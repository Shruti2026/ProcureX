# Dynamic Architectural Decisions

This log stores historical decisions, architectural changes, design trade-offs, and critical technical debt resolutions.

## 📝 Decision Log

### 1. Project Initialization & Architecture Setup
- **Status**: Approved
- **Date**: 2026-07-29
- **Context**: A structured microservices environment is required to segregate operations (Identity, Catalog, Procurement, Inventory, Finance, Notification, Analytics).
- **Decision**: Adopted Spring Cloud Gateway + Eureka Server for registry, service discovery, and routing, backed by individual databases integrated via a shared MySQL instance and RabbitMQ for asynchronous event messaging.
- **Consequences**: Easy module scalability; API clients only interact with the gateway.

---

### 2. CORS Configuration — API Gateway Layer
- **Status**: Approved
- **Date**: 2026-07-29
- **Context**: Frontend (running on `localhost:3000` or `localhost:5173`) was blocked by the browser's CORS policy when making requests to the API Gateway (`localhost:8080`). This caused login to fail silently with "Invalid email or password".
- **Decision**: Implement CORS using Spring's `CorsWebFilter` bean (`CorsConfig.java`) in the **API Gateway** (reactive/WebFlux layer), rather than in individual services. Allowed origins include both Vite dev port (`5173`) and standard React port (`3000`). `allowCredentials = true` is required for the HttpOnly refresh cookie mechanism.
- **Consequences**: A single CORS policy covers all routes routed through the gateway. Individual microservices do not need their own CORS config as they are never directly accessed by the browser.
- **Files**: `backend/api-gateway/src/.../config/CorsConfig.java`

---

### 3. Axios Interceptor — Infinite Redirect Loop Prevention
- **Status**: Approved
- **Date**: 2026-07-29
- **Context**: On page load, `AuthContext` calls `/api/v1/auth/refresh` to restore the session. If no valid refresh cookie exists (user not logged in), the backend returns `401`. The Axios response interceptor was catching this `401` and triggering `window.location.href = '/login'`, which reloaded the entire app in an infinite loop.
- **Decision**: Added a bypass guard in `api.js` — if the failing request URL includes `/auth/refresh` or `/auth/login`, the interceptor immediately rejects without attempting a re-refresh or redirect. Additionally, the redirect is now guarded with `window.location.pathname !== '/login'` to prevent redirect storms.
- **Consequences**: Clean page lifecycle on load; unauthenticated users see the login page without loops.
- **Files**: `frontend/src/services/api.js`

---

### 4. Change Password — Self-Service via Authenticated Endpoint
- **Status**: Approved
- **Date**: 2026-07-29
- **Context**: Internal managers are created with auto-generated 16-character temporary passwords. Vendors also need password self-management. No reset/change mechanism existed.
- **Decision**: Implemented `POST /api/v1/auth/change-password` as a JWT-protected endpoint accessible to **all authenticated roles** (ADMIN, managers, VENDOR). The service layer validates current password, blocks same-password reuse, BCrypt-encodes the new password, and writes an audit log entry with action `CHANGE_PASSWORD`. Frontend exposes this via a modal in the Navbar profile dropdown.
- **Consequences**: No email-based reset flow is needed at this stage. All role users can self-manage their password after first login. The endpoint is in the auth controller as it relates to authentication, not user management.
- **Files**: `backend/.../dto/request/ChangePasswordRequest.java`, `AuthService.java`, `AuthServiceImpl.java`, `AuthController.java`, `frontend/.../authService.js`, `ChangePasswordModal.jsx`, `Navbar.jsx`, `DashboardLayout.jsx`

---

### 5. Session Expiry — Refresh Token Expiry Aligned with Access Token
- **Status**: Approved
- **Date**: 2026-08-04
- **Context**: After the access token (JWT) expired (15 min), hitting `/api/v1/auth/login` returned `409 Conflict: "You are already logged in"`. This happened because the refresh token was set to **7 days** — the DB row was still valid when the user tried to re-authenticate, so the conflict guard correctly fired but at the wrong time (the user's session had already expired from their perspective).
- **Decision**: Changed `jwt.refresh-token-expiry` from `604800000` (7 days) to `900000` (15 min), aligning it with the access token. The conflict guard (`ConflictException("You are already logged in")`) was **kept in place** — it will now only trigger if a user tries to log in while a genuinely active session (within its 15-min window) already exists. The guard is annotated with a `TODO [Redis]` comment to replace it with a Redis-backed session check in the future.
- **Consequences**: Re-login after session expiry works correctly. Active-session conflict protection is still enforced. Both tokens expire together after 15 min.
- **Files**: `backend/identity-service/src/.../service/impl/AuthServiceImpl.java`, `backend/identity-service/src/main/resources/application.yml`

---

### 7. JWT Gateway Filter — Token Validation & Header Injection Pattern
- **Status**: Approved
- **Date**: 2026-08-05
- **Context**: Day 3 introduced two new backend services (`vendor-catalog-service`, `procurement-service`) that need to know which user is making a request (user ID, organization ID, roles) without each service re-implementing JWT parsing or holding the JWT secret.
- **Decision**: Implemented `JwtAuthenticationFilter` in `api-gateway` as a `GlobalFilter + Ordered` bean (runs before routing). The filter:
  1. Checks the request path against a `PUBLIC_PATHS` list (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh`, `/actuator/**`). Public paths bypass the filter entirely.
  2. For all other routes: extracts the `Authorization: Bearer <token>` header, validates the JWT signature and expiry using the shared secret, and reads the `sub`, `organizationId`, and `roles` claims.
  3. Injects three downstream headers before forwarding: `X-User-Id`, `X-Organization-Id`, `X-User-Roles`.
  4. Returns `401 Unauthorized` with a structured JSON error body (`{ "error": "...", "timestamp": "..." }`) for missing or invalid tokens — never forwarding the request downstream.
- **Downstream pattern**: Both `vendor-catalog-service` and `procurement-service` implement a `SecurityContextFilter` (servlet `OncePerRequestFilter`) that reads these three injected headers from every incoming request and populates a request-scoped `SecurityContext` (or a simple `RequestContext` holder) so service-layer code can call `SecurityContext.getUserId()` etc. without any JWT dependency.
- **Consequences**: JWT secret and validation logic live in exactly one place (the gateway). Downstream services trust the gateway-injected headers and do not need `spring-security-jwt` or the secret key. Adding a new service only requires registering its route in the gateway — no auth plumbing needed in the service itself.
- **Files**: `backend/api-gateway/src/.../filter/JwtAuthenticationFilter.java`, `backend/vendor-catalog-service/src/.../filter/SecurityContextFilter.java`, `backend/procurement-service/src/.../filter/SecurityContextFilter.java`

---

### 6. Single-Session-Per-User Model — Current Design & Future Redis Plan
- **Status**: Approved (by design, with known future migration path)
- **Date**: 2026-08-04
- **Context**: The `refresh_tokens` table has a `UNIQUE` constraint on `user_id` (`@OneToOne` mapping), enforcing exactly one refresh token row per user at a time. The JWT access token remains stateless and is never stored anywhere.
- **Decision**: The system currently supports **one active session per user**, backed by MySQL. The future plan (when Redis is introduced) is:
  - **JWT access token** — remains stateless in memory, no change needed.
  - **Refresh token** — move from MySQL `refresh_tokens` table to Redis, enabling per-device sessions, instant revocation, and TTL-based auto-expiry without scheduled cleanup jobs.
- **Consequences**: Current MySQL-backed single-session model is simple and correct for now. Redis migration will unlock multi-device support and better performance. `TODO.md` tracks this work item.
- **Files**: `backend/identity-service/src/.../entity/RefreshToken.java`, `TODO.md`
