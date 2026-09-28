# ProcureX TODO

- [ ] For this project for initial setup which is better the current approach or if we use data seeder and put admin credential via .env file.

- [ ] Add Dark Mode

- [ ] Implement silent refresh via UI
  - i.e. refreshing token a min before it expires without user interaction.

- [ ] Check for Security vulnerabilities in the codebase.
  - [ ] Like SQL Injection, XSS, CSRF, etc.
  - [ ] Any other vulnerabilities that may be present in the codebase.

# Bugs

## 1. API Gateway (`backend/api-gateway`)

### [Bug #1] Unauthenticated Discovery & Instance Leak Endpoints in Production Gateway
- **File & Lines**: [`ProcurexApiGatewayApplication.java`](file:///d:/Projects/ProcureX/backend/api-gateway/src/main/java/com/procurex/apigateway/ProcurexApiGatewayApplication.java#L21-L39)
- **Severity**: **Critical**
- **Description**: An inner `@RestController` (`DiscoveryDebugController`) exposes `/debug/services` and `/debug/instances` without authentication or `@Profile("dev")` restrictions. Since the API Gateway sits on port 8080 as the public ingress, any external client can query these endpoints to map out all microservices registered in Eureka, internal hostnames, and IP/port topology.
- **Additional Issue**: Line 22 defines this controller as a **non-static inner class** of the `@SpringBootApplication` class, causing each request to maintain a reference to the outer application context class.

### [Bug #2] All Actuator Management Endpoints Exposed Without Security
- **File & Lines**: [`application.yml`](file:///d:/Projects/ProcureX/backend/api-gateway/src/main/resources/application.yml#L37-L41)
- **Severity**: **Critical**
- **Description**: `management.endpoints.web.exposure.include: "*"` is configured without any Spring Security or WebFlux security filter. Endpoints like `/actuator/env`, `/actuator/heapdump`, `/actuator/beans`, and `/actuator/loggers` are fully exposed to external HTTP traffic on port 8080, leaking environment variables and internal runtime details.

### [Bug #3] Invalid Wildcard in `Access-Control-Expose-Headers`
- **File & Lines**: [`CorsConfig.java`](file:///d:/Projects/ProcureX/backend/api-gateway/src/main/java/com/procurex/apigateway/config/CorsConfig.java#L34-L35)
- **Severity**: **Medium**
- **Description**: `corsConfig.setExposedHeaders(List.of("*"))` is combined with `corsConfig.setAllowCredentials(true)`. The W3C/Fetch CORS specification does not permit a wildcard `*` for exposed headers (especially when credentials/cookies are included). Browsers will either discard exposed headers or fail preflight verification in strict implementations.

### [Bug #4] TRACE Logging of Proxied Requests Leaks Passwords & JWTs
- **File & Lines**: [`application.yml`](file:///d:/Projects/ProcureX/backend/api-gateway/src/main/resources/application.yml#L48-L50)
- **Severity**: **High**
- **Description**: `org.springframework.cloud.gateway: TRACE` and `org.springframework.cloud.loadbalancer: TRACE` log raw request bodies and headers (including `Authorization: Bearer ...` and passwords in `POST /api/v1/auth/login`). In production or shared log aggregators, credentials and tokens will leak in plaintext into log sinks.

### [Bug #5] Unparameterized Eureka Server URL
- **File & Lines**: [`application.yml`](file:///d:/Projects/ProcureX/backend/api-gateway/src/main/resources/application.yml#L28-L32)
- **Severity**: **Medium**
- **Description**: Eureka `defaultZone` is hardcoded to `http://localhost:8761/eureka/` without an environment variable fallback (unlike database and CORS configs). Any containerized or cloud deployment (Docker Compose/Cloud Run) will fail to resolve Eureka unless running on the host machine.

---

### Already Completed Tasks

- [x] **Check if `UserRegisterRequest.java` and `UserRegisterResponse.java` are still required.**
