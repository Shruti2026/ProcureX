# ProcureX – System Design

# 1. System Architecture

## 1.1 Overview

ProcureX follows a **Microservices Architecture** in which the application is divided into multiple independent services. Each microservice is responsible for a specific business domain and maintains its own database.

The application consists of a React.js frontend, an API Gateway, Eureka Discovery Server, seven Spring Boot microservices, RabbitMQ for asynchronous communication, and MySQL databases.

All client requests are routed through the API Gateway, which forwards requests to the appropriate microservice. Microservices communicate with each other using REST APIs for synchronous operations and RabbitMQ for asynchronous event-driven communication.

Each microservice owns its own database to ensure loose coupling, independent scalability, and better maintainability.

---

## 1.2 Architectural Style

The system follows the following architectural principles:

- Microservices Architecture
- Database per Microservice Pattern
- Event-Driven Architecture (Choreographed Saga & Transactional Outbox)
- RESTful API Architecture
- Layered Architecture
- Role-Based Access Control (RBAC)
- Multi-Tenant Logical Tenant Isolation

---

## 1.3 Major Components

The ProcureX system consists of the following major components:

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

The frontend provides separate dashboards for:

- **Admin:** Manages tenant organizations, user roles/permissions, account locks, system health, and global audit trails.
- **Procurement Manager:** Requisitions, RFQs, Quotation comparisons, Purchase Order approvals.
- **Inventory Manager:** GRN, quality inspections, warehouse stock levels, returns processing.
- **Finance Manager:** Budget allocations, invoice matching/verification, payment initiation.
- **Vendor:** Bid submissions, PO acceptances, invoice uploads.

---

### API Gateway

Acts as the single entry point for all client requests.

Responsibilities:
- Request Routing (routes dynamically using Eureka registry)
- JWT Signature Validation (stateless verification using cached public keys/JWKs)
- Downstream claim injection (injects `X-User-Id`, `X-User-Roles`, and `X-Organization-Id` headers)
- Global Rate Limiting and request logging

---

### Eureka Discovery Server

Responsible for service registration and discovery.

Responsibilities:
- Service Registration
- Dynamic Service Discovery
- Health Monitoring

---

### Identity Service

Responsible for:
- User Authentication (Admin, Managers, and Vendors)
- JWT Token Generation & Refresh Token Rotation
- User Account Lifecycle Management
- Role-Based Access Control (RBAC) Management
- Centralized Mutation Audit Log collection

> **Note:** The Identity Service is the single authentication authority for the entire system. Vendors authenticate through this service and receive a JWT with `role = VENDOR`. The Vendor & Catalog Service stores only business-domain profile data.

---

### Vendor & Catalog Service

Responsible for:
- Vendor Business Profile Management
- Product Catalog (organization master catalog)
- Product Categories
- Vendor–Product Mapping (pricing, MOQ, lead times)
- Vendor Contract Management

---

### Procurement Service

Responsible for:
- Purchase Requisition
- RFQ Creation & Invitation
- Vendor Quotation Submission & Verification
- Quotation Comparison Metrics
- Purchase Orders & PO Status History

---

### Inventory Service

Responsible for:
- Warehouse Capacity Management
- Goods Receipt Note (GRN) processing
- Quality Inspection reports
- Stock Transaction logs (immutable audit ledger)
- Product Returns & Return status history

---

### Finance Service

Responsible for:
- Invoice Verification (three-way PO-GRN-Invoice matching)
- Invoice Item Tracking
- Payment Processing (initiating transfers and logging details)
- Budget Management (departmental fiscal limits)
- Invoice Status History

---

### Notification Service

Responsible for:
- In-App Notifications
- Email Notifications (via SMTP integration)
- Scheduled alerts & preference management

---

### Reporting & Analytics Service

Responsible for:
- Dashboard Metrics Generation (pre-aggregated KPI tables)
- Procurement Analytics & Lead Time calculations
- Vendor Performance & Score calculation
- Inventory Turnover metrics
- Financial Analytics

---

## 1.4 Communication Architecture

The system uses two communication mechanisms.

### Synchronous Communication

REST APIs are used whenever one microservice requires an immediate response from another microservice.

Examples:
- **Procurement → Vendor & Catalog:** Retrieve vendor contact details or check product specifications.
- **Finance → Procurement:** Retrieve Purchase Order total amounts for three-way invoice verification.
- **Inventory → Procurement:** Retrieve approved PO quantities during Goods Receipt validation.

---

### Asynchronous Communication

RabbitMQ is used for business events that do not require an immediate response.

Examples:
- RFQ Created
- Quotation Submitted
- Purchase Order Approved
- Goods Received
- Invoice Uploaded
- Payment Completed

These events are consumed independently by the Notification Service, Reporting & Analytics Service, and downstream business services.

---

## 1.5 Data Storage Strategy

Each microservice maintains its own independent MySQL database.

| Microservice | Database |
|--------------|----------|
| Identity Service | procurex_identity |
| Vendor & Catalog Service | procurex_vendor |
| Procurement Service | procurex_procurement |
| Inventory Service | procurex_inventory |
| Finance Service | procurex_finance |
| Notification Service | procurex_notification |
| Reporting & Analytics Service | procurex_analytics |

No microservice is allowed to access another microservice's database directly. Cross-service communication is performed only through REST APIs or RabbitMQ events.

---

## 1.6 Security Architecture

The system uses JWT (JSON Web Token) based authentication.

Security features include:
- Secure Login via Identity Service
- Short-lived Access Tokens (15 minutes) + Long-lived Refresh Tokens (7 days)
- HttpOnly, Secure, SameSite=Strict Refresh Cookie storage to block XSS
- Role-Based Access Control (RBAC)
- Password Encryption using BCrypt
- Stateless gateway verification using cached JWKs (JSON Web Keys)

---

## 1.7 Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Java 21, Spring Boot |
| Security | Spring Security, JWT |
| API Communication | REST APIs, OpenFeign |
| Event Communication | RabbitMQ |
| Service Discovery | Eureka Server |
| API Gateway | Spring Cloud Gateway |
| Database | MySQL |
| Database Migration | Flyway |
| Testing | JUnit, Mockito |
| API Documentation | Swagger / OpenAPI |
| Version Control | Git, GitHub |

---

## 1.8 Architectural Characteristics

The ProcureX architecture provides the following benefits:
- Modular and maintainable design
- Independent microservices
- Database isolation
- Secure authentication and authorization
- Event-driven communication
- High scalability
- Loose coupling between services
- Easier maintenance and testing
- Improved fault isolation
- Clear separation of business domains

---

# 2. High-Level Architecture

```text
                                         +----------------------+
                                         |      End Users       |
                                         |----------------------|
                                         | Admin                |
                                         | Procurement Manager  |
                                         | Inventory Manager    |
                                         | Finance Manager      |
                                         | Vendor               |
                                         +----------+-----------+
                                                    |
                                                    |
                                                    v
                              +--------------------------------------+
                              |      React.js Frontend (Vite)        |
                              +----------------+---------------------+
                                               |
                                               |
                                               v
                              +--------------------------------------+
                              |          API Gateway                 |
                              +----------------+---------------------+
                                               |
                                               |
                    +--------------------------+---------------------------+
                    |                          |                           |
                    |                          |                           |
                    v                          v                           v
        +-------------------+        +-------------------+      +-------------------+
        |  Eureka Server    |        |    RabbitMQ       |      |   Swagger UI      |
        | Service Discovery |        | Event Messaging   |      | API Documentation |
        +-------------------+        +-------------------+      +-------------------+

                                               |
           -------------------------------------------------------------------------------------
           |             |               |              |              |             |           |
           |             |               |              |              |             |           |
           v             v               v              v              v             v           v

+----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------------+
| Identity       | | Vendor &       | | Procurement    | | Inventory      | | Finance        | | Notification   | | Reporting &          |
| Service        | | Catalog Service| | Service        | | Service        | | Service        | | Service        | | Analytics Service    |
+-------+--------+ +-------+--------+ +-------+--------+ +-------+--------+ +-------+--------+ +-------+--------+ +----------+-----------+
        |                  |                  |                  |                  |                  |                      |
        |                  |                  |                  |                  |                  |                      |
        v                  v                  v                  v                  v                  v                      v

+----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------------+
| MySQL     | | MySQL     | | MySQL     | | MySQL     | | MySQL     | | MySQL     | | MySQL          |
| procurex_      | | procurex_      | | procurex_      | | procurex_      | | procurex_      | | procurex_      | | procurex_           |
| identity       | | vendor         | | procurement    | | inventory      | | finance        | | notification   | | analytics           |
+----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------------+
```

---

# 3. Microservice Architecture

## 3.1 Overview

ProcureX follows a **Microservices Architecture**, where the application is divided into independent services based on business domains. Each microservice is responsible for a specific functionality, owns its own database, and communicates with other services using REST APIs or RabbitMQ.

This architecture improves modularity, scalability, maintainability, and fault isolation.

---

## 3.2 Microservices Overview

| Microservice | Primary Responsibility | Database |
|--------------|------------------------|----------|
| Identity Service | Authentication, User Management, and Auditing | procurex_identity |
| Vendor & Catalog Service | Vendor profile, contracts, catalog, categories, mappings | procurex_vendor |
| Procurement Service | PRs, RFQs, quotations, POs, status tracking | procurex_procurement |
| Inventory Service | Warehouses, stock levels, GRN, inspections, returns | procurex_inventory |
| Finance Service | Invoices, three-way matching, payments, budgets | procurex_finance |
| Notification Service | Email templates, preferences, in-app channels | procurex_notification |
| Reporting & Analytics Service | Pre-aggregated KPI calculations and event piping | procurex_analytics |

---

## 3.3 Service Responsibilities

### Identity Service
Responsible for:
- User Authentication (Admin, Managers, and Vendors)
- JWT Access and Refresh token lifecycle management
- Role Management and permissions mapping
- Collecting and storing mutation audit log records

---

### Vendor & Catalog Service
Responsible for:
- Vendor registration reviews and approval workflow trigger
- Vendor profiles and status updates
- Master product catalog and category configurations
- Mapping vendor pricing, MOQ, and lead times
- Vendor contract records management

---

### Procurement Service
Responsible for:
- Purchase Requisition (PR) lifecycle
- RFQ generation and invitation rules
- Vendor Quotation processing
- Quotation comparison engine
- Purchase Order creation, approvals, and PO status history tracking

---

### Inventory Service
Responsible for:
- Warehouse setups and capacities
- Inventory levels tracking
- Goods Receipt Notes (GRN) matching
- Quality Inspections logging
- Immutable Stock Transaction ledger
- Returns management and returns status history tracking

---

### Finance Service
Responsible for:
- Invoices matching (matching PO total + GRN accepted qty + Invoice amount)
- Invoice Items tracking
- Budget tracking and threshold checks
- Payment transaction initiation
- Invoice status history tracking

---

### Notification Service
Responsible for:
- In-App channels delivery
- Email SMTP configurations and templated compiles
- Notification preference settings

---

### Reporting & Analytics Service
Responsible for:
- Asynchronous metrics calculation engine
- Real-time and scheduled KPI calculations
- Dashboard aggregates update
- Generating performance rating cards for vendors

---

## 3.4 Service Communication

Microservices communicate via synchronous OpenFeign REST clients and asynchronous RabbitMQ event bindings.

---

## 3.5 Database Ownership

Each microservice owns its MySQL database schema. Direct cross-database joins or accesses are forbidden.

---

# 4. Frontend Architecture

## 4.1 Overview

The frontend is developed using **React.js** and Vite. It provides dashboard interfaces tailored to different user roles, communicating through the Gateway.

---

## 4.2 Frontend Technology Stack

- React.js, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts.

---

## 4.3 Frontend Folder Structure

```text
src/
├── assets/
├── components/
├── layouts/
├── pages/
├── services/
├── hooks/
├── context/
├── utils/
├── routes/
└── App.jsx
```

---

## 4.4 UI Components

- Login Page, Dashboard, Sidebar, Navbar, Tables, Forms, Charts, Notification Panel.

---

## 4.5 User Dashboards

### Admin Dashboard
- **Tenant Management Page** (`/admin/tenants`): Visualizes tenant list, configurations, and tenant subscription settings.
- **User Management Page** (`/admin/users`): Setup internal users, roles, password resets, account locking.
- **Centralized Audit Logs** (`/admin/audit-logs`): Search and filter query mutations across all services.
- **Eureka Service Monitor** (`/admin/health`): Real-time monitor of service registries and connection pools.

### Procurement Manager
- Dashboard, PR Management, RFQs, Quotation Comparing, Purchase Orders.

### Inventory Manager
- Dashboard, GRN matching, Inventory Stock grid, Inspections, Returns.

### Finance Manager
- Dashboard, Invoice Matching, Payments, Department Budgets.

### Vendor
- Dashboard, RFQ list, Quotation submitting, PO accepts, Invoice uploads.

---

## 4.6 Frontend Communication

`React Axios Calls → API Gateway → Downstream Microservice API`

---

# 5. Backend Architecture

## 5.1 Overview

Developed using Spring Boot, utilizing a Layered Architecture (Controller → Service → Repository → DB).

---

# 6. API Gateway Design

## 6.1 Overview

Acts as the front door. Resolves requests dynamically.

---

## 6.2 Routing Strategy

Routing routes `/api/auth/**` to Identity, `/api/vendors/**` to Vendor & Catalog, `/api/procurement/**` to Procurement, `/api/inventory/**` to Inventory, `/api/finance/**` to Finance, `/api/notifications/**` to Notification, `/api/reports/**` to Reporting & Analytics.

---

# 7. Service Discovery (Eureka)

Dynamic service naming integration using Eureka.

---

# 8. Inter-Service Communication

## 8.1 Overview

Enforces separation using sync Feign clients and async events.

---

## 8.2 Synchronous Communication Details

OpenFeign REST clients are configured to communicate directly between microservices.
When a call is initiated (e.g., Inventory Service calling Procurement Service to fetch PO quantities), a Feign `RequestInterceptor` extracts the active user's JWT from the Security Context and appends it as an `Authorization: Bearer <token>` header downstream. This maintains security state downstream.

---

## 8.3 OpenFeign Client

Declarative rest clients handling cross-service calls securely.

---

## 8.4 Transactional Consistency Strategy

Since distributed transactions (like 2PC) are slow and prone to locks, ProcureX uses a choreographed **Saga Pattern** for transactional workflows and the **Transactional Outbox Pattern** to guarantee event-delivery reliability.

### 8.5 Transactional Outbox Pattern
Each microservice that publishes events maintains an `outbox_events` table within its local MySQL database.
1. **Local Transaction:** When a business state changes (e.g. creating a Purchase Order), the business record and the event payload are saved in the same local transaction.
2. **Poller Scheduler:** A background polling process scans the `outbox_events` table for unpublished events, publishes them to RabbitMQ, and updates their status to `PUBLISHED` upon confirmation. This ensures "at-least-once" delivery guarantee.

### 8.6 Choreographed Saga Flow (PO Approval Example)
1. **Start:** Procurement Service approves a Purchase Order, writes to PO database, and inserts `PO_APPROVED` event into the outbox.
2. **Budget Reserve:** Finance Service consumes `PO_APPROVED` event, checks departmental budget. 
   - *Success:* Reserves the budget locally and emits `BUDGET_RESERVED`.
   - *Failure (Compensating Transaction):* If budget is exceeded, Finance emits `BUDGET_RESERVATION_FAILED`. Procurement consumes this event and reverts the PO status to `REJECTED_BUDGET_EXCEEDED`.
3. **Stock Pre-Allocation:** Inventory Service consumes `BUDGET_RESERVED` and pre-allocates incoming warehouse slots.

---

# 9. Event-Driven Architecture (RabbitMQ)

## 9.1 Overview

RabbitMQ manages asynchronous communication broker.

---

## 9.2 Analytics Pipeline Mechanisms

The Reporting & Analytics Service binds its metrics database listeners to business exchanges, processing incoming activities asynchronously:
- **Real-Time Counters:** Events like `PO_APPROVED`, `GRN_CREATED`, and `PAYMENT_COMPLETED` trigger immediate updates in the `dashboard_metrics` counters table.
- **Scheduled Batches:** Intensive KPIs (like Average Vendor Delivery Delay, Quality Acceptance Ratio, and Vendor Performance Ratings) are calculated asynchronously on an hourly/nightly schedule. Updated rating scorecards are then emitted via RabbitMQ back to the Vendor & Catalog Service database.

---

# 10. Authentication & Token Management

## 10.1 Overview

ProcureX uses **JWT (JSON Web Token)** for stateless user authentication and session tracking.

---

## 10.2 Token Management Lifecycle

To protect against XSS and CSRF attacks:
- **Access Token:** Short-lived token (15 minutes), containing user profile claims (`user_id`, `roles`, `organization_id`). Retained in-memory on the React client.
- **Refresh Token:** Long-lived token (7 days), stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. The Identity Service stores the session ID in its `refresh_tokens` table.
- **Token Rotation:** When the access token expires, the frontend calls the `/api/auth/refresh` endpoint. The Identity Service validates the cookie, rotates the refresh token (issuing a new one), and returns a new access token.

---

## 10.3 Gateway Validation Flow

To keep validation stateless and fast:
1. API Gateway intercepts incoming requests.
2. Rather than calling the Identity Service on every request, the Gateway performs stateless verification of the JWT signature using cached public keys fetched via Identity Service's JWK (JSON Web Key) endpoint.
3. Upon successful validation, the Gateway injects the claims as HTTP headers (`X-User-Id`, `X-User-Roles`, `X-Organization-Id`) downstream.

---

## 10.4 Vendor Registration Workflow

Vendor onboarding is managed via a strict approval pipeline:
1. **Public Submission:** An external vendor submits registration information via a public guest portal page.
2. **Pending Registration:** The API Gateway forwards the request to the Identity Service, which inserts a user record with `account_status = INACTIVE` and role `VENDOR`. It then publishes a `VendorUserCreated` event.
3. **Vendor Profile Setup:** The Vendor & Catalog Service consumes `VendorUserCreated`, creates a profile record in `vendors`, linking it using the provided `user_id` cross-service identifier.
4. **Manager Approval:** A Procurement Manager reviews the registration in the Admin panel and clicks Approve. The Vendor & Catalog Service publishes `VendorRegistrationApproved`.
5. **Activation:** Identity Service consumes the approval event, changes the account status to `ACTIVE`, and publishes `VendorAccountActivated`.
6. **Notification:** The Notification Service consumes the activation event and emails a secure onboarding password creation link to the vendor.

---

# 14. Notification Service Architecture Details

The Notification Service processes notifications through a robust decoupled architecture:
- **RabbitMQ Listeners:** A thread pool listens on `notification.queue` bound to the main exchange.
- **SMTP Mail Client:** Integrates with a standard SMTP mailer (via Spring Mail Starter) utilizing environment-configured host, port, credentials, and TLS variables.
- **Thymeleaf Template Engine:** Renders HTML notification templates located in the classpath (`src/main/resources/templates/`). Templates dynamically compile text placeholders (e.g. PO number, names) passed within the event payload.

---

# 15. Folder Structure

Provides a standard structure. (Standard folders mapped).

---

# 16. Multi-Tenancy Architecture Details

Multi-tenancy is structured around logical tenant isolation to enable clean scalability.
- **Header Propagation:** Incoming requests carry the tenant header `X-Organization-Id`. The API Gateway validates this claim against the JWT.
- **Hibernate Filter:** Microservices intercept calls and bind the tenant context to a ThreadLocal variable. JPA repositories utilize Hibernate's `@TenantId` or dynamic filter configuration (`@Filter`) to automatically append `WHERE organization_id = :orgId` on all database selects, updates, and deletes.
- **Event Header Context:** RabbitMQ message body envelopes contain an outer header block enclosing the `organizationId`, preserving tenant context asynchronously.
