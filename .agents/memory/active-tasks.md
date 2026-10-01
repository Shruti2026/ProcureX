# Active Tasks & Progress Log

Track dynamic sprint goals, work-in-progress tasks, and current session checklists.

## 🎯 Current Sprint Goals
- [x] Configure AI Workspace Memory & Rules setup.
- [x] Investigate and clean up legacy request/response classes in `identity-service` (reference [TODO.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/TODO.md)).
- [x] **Day 2 Joint Task** — Connect frontend with authentication APIs (CORS, Axios interceptor, auth context).
- [x] **Bonus (Day 2 Extension)** — Implement Change Password feature for all authenticated users (managers & vendors).

## 📋 Session Checklist
- **AI Environment Setup**:
  - [x] Create root-level `AGENTS.md` rules coordinator.
  - [x] Create root-level `MEMORY.md` index.
  - [x] Define backend & frontend static rules under `.agents/rules/`.
  - [x] Document microservices system architecture, port mappings, and diagram.

- **Day 2 — Auth Integration (Joint Task)**:
  - [x] Add CORS configuration (`CorsConfig.java`) in API Gateway for `localhost:3000` and `localhost:5173`.
  - [x] Fix Axios infinite redirect loop in `api.js` (skip interceptor for `/auth/login` and `/auth/refresh` calls).
  - [x] Verify frontend login success with correct credentials end-to-end.

- **Change Password Feature**:
  - [x] Create `ChangePasswordRequest.java` DTO in identity-service.
  - [x] Add `changePassword(email, request)` to `AuthService` interface.
  - [x] Implement `changePassword` in `AuthServiceImpl` (validates current password, blocks same-password reuse, BCrypt-encodes new password, writes audit log).
  - [x] Expose `POST /api/v1/auth/change-password` endpoint in `AuthController` (JWT-protected, available to all roles).
  - [x] Add `changePassword()` API call in frontend `authService.js`.
  - [x] Create `ChangePasswordModal.jsx` component with 3-field form, show/hide toggles, Yup validation, and toast feedback.
  - [x] Upgrade `Navbar.jsx` with profile avatar dropdown (initials, role label, Change Password option, Logout).
  - [x] Update `DashboardLayout.jsx` to read `user` directly from `AuthContext`.

## Day 3 — vendor-catalog-service, procurement-service, JWT filter, Requisitions UI

### Suraj — Backend Services

- **vendor-catalog-service**:
  - [x] Scaffold Spring Boot service (`vendor-catalog-service`) with Eureka client, JPA, Flyway, RabbitMQ dependencies.
  - [x] Create `application.yml` with DB, Eureka, and RabbitMQ config.
  - [x] Create Flyway migration `V1__init_vendor_catalog.sql` (tables: `product_categories`, `products`).
  - [x] Implement `ProductCategory` and `Product` JPA entities.
  - [x] Implement `ProductCategoryRepository` and `ProductRepository`.
  - [x] Implement `ProductCategoryService` / `ProductCategoryServiceImpl` (CRUD).
  - [x] Implement `ProductService` / `ProductServiceImpl` (CRUD, filter by category).
  - [x] Expose REST endpoints: `ProductCategoryController` (`/api/v1/categories`) and `ProductController` (`/api/v1/products`).
  - [x] Add `SecurityContextFilter` to extract `X-User-Id`, `X-Organization-Id`, `X-User-Roles` headers set by the gateway.
  - [x] Register service route in API Gateway (`application.yml`).

- **procurement-service**:
  - [x] Scaffold Spring Boot service (`procurement-service`) with Eureka client, JPA, Flyway, RabbitMQ dependencies.
  - [x] Create `application.yml` with DB, Eureka, and RabbitMQ config.
  - [x] Create Flyway migration `V1__init_procurement.sql` (table: `purchase_requisitions` with items JSON column).
  - [x] Implement `PurchaseRequisition` JPA entity and `RequisitionItem` embeddable/value type.
  - [x] Implement `PurchaseRequisitionRepository`.
  - [x] Implement `RequisitionService` / `RequisitionServiceImpl` (create, list, get by id, approve/reject status transition).
  - [x] Expose REST endpoints: `RequisitionController` (`/api/v1/requisitions`).
  - [x] Add `SecurityContextFilter` (same header-extraction pattern as vendor-catalog-service).
  - [x] Register service route in API Gateway.

- **JWT Gateway Filter (Joint)**:
  - [x] Implement `JwtAuthenticationFilter` in `api-gateway` as `GlobalFilter + Ordered`.
  - [x] Define `PUBLIC_PATHS` list (login, register, refresh, actuator).
  - [x] On non-public routes: validate JWT, extract claims, inject `X-User-Id`, `X-Organization-Id`, `X-User-Roles` headers into the downstream request.
  - [x] Return `401` with JSON error body for missing or invalid tokens.

### Shruti — Requisitions UI

- **Requisitions module (frontend)**:
  - [x] Create `requisitionService.js` with Axios calls for create, list, get, approve/reject.
  - [x] Create `RequisitionList.jsx` — paginated table of requisitions with status badges.
  - [x] Create `CreateRequisitionModal.jsx` — multi-item form with product picker, quantity, and unit-price fields; React Hook Form + Yup validation.
  - [x] Create `RequisitionDetailDrawer.jsx` — slide-in panel showing full requisition details and approve/reject action buttons (manager role only).
  - [x] Wire pages into React Router (`/requisitions` route) and sidebar navigation.
  - [x] Add role-based rendering: vendors see create button; managers see approve/reject actions.

