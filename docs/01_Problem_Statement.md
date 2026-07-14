# ProcureX – Enterprise Procurement Management Platform

# Project Overview

**ProcureX** is a full-stack, microservices-based Enterprise Procurement Management Platform developed to digitize and streamline the complete procurement lifecycle of an organization.

The platform enables seamless collaboration between internal organizational users and registered vendors through a centralized web application. It manages procurement activities from purchase requisition to vendor selection, purchase order generation, inventory updates, invoice verification, payment tracking, and business analytics.

The application consists of a React.js frontend and multiple Spring Boot microservices communicating through REST APIs and event-driven messaging using RabbitMQ.

Version 1 of ProcureX is designed for a **single organization** (e.g., **ABC Technologies**). However, the database schema and service APIs are pre-architected with **multi-tenancy primitives** (`organization_id` fields, HTTP tenant headers, tenant routing filters) to enable seamless SaaS scaling in future releases without major schema rewrites.

---

# Problem Statement

Many organizations still manage procurement using spreadsheets, emails, phone calls, and paper-based records. These disconnected processes often result in:

- Inefficient vendor management and unregistered supplier risks
- Manual quotation comparison errors
- Delayed purchase processing
- Inventory inaccuracies and un-audited stock movements
- Poor invoice tracking and payment delays
- Limited visibility into procurement performance
- Lack of centralized reporting and compliance audit logs

Although enterprise procurement solutions such as SAP Ariba and Oracle Procurement Cloud solve these problems, they are expensive and overly complex for medium-sized organizations.

ProcureX aims to provide a simplified enterprise procurement platform with modern microservices architecture, secure role-based access, guest-driven vendor onboarding, and analytical dashboards.

---

# Organization & Multi-Tenancy Strategy

Current Version (V1) supports deployment for **one active organization** (e.g., ABC Technologies).

To prevent expensive migration complexity later:
- Every business table in the system is pre-configured with an `organization_id` column.
- Every API route and event envelope includes tenant identification context (`X-Organization-Id` headers).
- Future versions can transition to a multi-tenant SaaS model without altering the database schema layouts.

---

# User Roles

## Admin

Responsible for system administration, tenant onboarding, user roles, security audits, and system monitoring.

Responsibilities:
- Setup organization parameters and tenant properties
- Create and manage internal user accounts
- Assign and modify RBAC Roles and Permissions
- Query and review the system mutation Audit Log
- Monitor microservice health metrics and connection pools via the **Admin Dashboard**

---

## Procurement Manager

Responsible for the complete procurement process.

Responsibilities:
- Create Purchase Requisitions
- Create RFQs (Request for Quotations)
- Invite Vendors and review registration requests
- Compare Quotation metrics side-by-side
- Generate and Approve Purchase Orders (PO status history logged)
- Cancel Purchase Orders

No separate managerial approval is required.

---

## Inventory Manager

Responsible for inventory and warehouse operations.

Responsibilities:
- View Approved Purchase Orders (fetched via secure cross-service REST calls to Procurement Service)
- Create Goods Receipt Notes (GRN)
- Perform Quality Inspections (approving quantities, logging rejects and reasons)
- Update Warehouse Stock levels (optimistic locking enforced)
- Log all stock movements in the Stock Transactions ledger
- Process Product Returns (handling replacements and tracking delivery)

---

## Finance Manager

Responsible for procurement-related finance and compliance.

Responsibilities:
- Verify Vendor Invoices (three-way matched to PO and GRN)
- Approve Invoices and audit Invoice Status History
- Process Payments (log transaction references, handle retries)
- Manage departmental Budgets (preventing PO creation if budget limit is exceeded)
- Track Outstanding Payments

---

## Vendor

External supplier registered with the organization.

Responsibilities:
- Register online via public guest onboarding page
- Secure Login (authenticated through the unified Identity Service)
- Configure Notification Preferences (email, in-app channels)
- View active RFQs they are invited to
- Submit Quotation pricing and terms
- Accept or reject Purchase Orders
- Upload Invoices and track payment status

---

# Business Workflow

### Step 1: User/Vendor Onboarding & Registration
- Admin sets up tenant parameters and user accounts.
- External vendors register via the public portal, undergo Procurement Manager review, and activate accounts linked to the single Identity Service.

↓

### Step 2: Requisition & RFQ Setup
- Procurement Manager creates a Purchase Requisition.
- Procurement Manager generates an RFQ and selects invited vendors.

↓

### Step 3: Quotation Bidding
- Invited vendors receive email notifications and submit bids through the Vendor Portal.

↓

### Step 4: PO Creation
- Procurement Manager compares bids, awards the RFQ to the best vendor, generates the PO, and approves it (PO state transitions logged).

↓

### Step 5: Goods Delivery
- Vendor accepts the PO and delivers the products.

↓

### Step 6: Goods Receipt & Quality Audit
- Inventory Manager inspects the incoming goods, creates a Goods Receipt Note (GRN), performs Quality Inspection, logs stock additions in the Stock Transaction table, and initiates returns for failed items.

↓

### Step 7: Invoicing
- Vendor uploads the Invoice.

↓

### Step 8: Three-Way Match & Payment
- Finance Service verifies the PO, GRN, and Invoice are matching. Budget allocations are verified, and Finance Manager approves payment (Invoice state transitions logged).

↓

### Step 9: Analytics Recalculations
- Asynchronous pipeline consumes event logs from RabbitMQ, recalculates KPI values, and updates reporting aggregates.

---

# Microservices

The backend is developed using seven independent Spring Boot microservices.

## 1. Identity Service

Responsibilities:
- Authentication & Session Verification (common credential storage for all roles)
- Token Generation & Refresh Token Rotation
- Role-Based Access Control (RBAC)
- User Mutation Audit Log capture

---

## 2. Vendor & Catalog Service

Responsibilities:
- Vendor Onboarding & Registration Approval State
- Master Product Catalog
- Product Categories
- Vendor–Product Mapping (prices, MOQs, lead times)
- Vendor Contracts Management

---

## 3. Procurement Service

Responsibilities:
- Purchase Requisition Lifecycle
- Request for Quotation (RFQ) Rules
- Vendor Quotation storage and comparison metrics
- Purchase Order management and PO history log

---

## 4. Inventory Service

Responsibilities:
- Warehouse capacity tracking
- Goods Receipt Notes (GRN) matching
- Quality Inspections logging
- Immutable Stock Transaction ledger (auditable movement history)
- Product Returns, replacements, and status history log

---

## 5. Finance Service

Responsibilities:
- Invoice Management
- Invoice Item Tracking
- Invoice Verification (three-way matched)
- Payment Processing & retries
- Budget Management
- Invoice Status History log

---

## 6. Notification Service

Responsibilities:
- In-App channels delivery
- Email SMTP client integration
- HTML Email template engine
- Notification Preference management

---

## 7. Reporting & Analytics Service

Responsibilities:
- Asynchronous KPI calculations
- Executive dashboards aggregates
- Procurement, Vendor, Inventory, and Financial Analytics

---

# System Architecture

ProcureX follows a Microservices Architecture.

## Frontend
- React.js, Vite, Tailwind CSS

## Backend
- Spring Boot Microservices, Spring Security, Spring Data JPA, Hibernate, Flyway Migrations

## Infrastructure
- API Gateway (stateless verification using Cached JWKs), Eureka Discovery Server, RabbitMQ (Saga choreographies & Outbox pollers)

---

# Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts
- **Backend:** Java 21, Spring Boot, Spring Security, Spring Data JPA, Hibernate, Flyway
- **Microservices:** Spring Cloud Gateway, Eureka Server, OpenFeign (with Bearer header interceptor), RabbitMQ
- **Database:** MySQL (with logical multi-tenancy columns, partial indexes, and optimistic version columns)
- **API Documentation:** Swagger / OpenAPI
- **Testing:** JUnit, Mockito
- **Version Control:** Git, GitHub

---

# Major Features

### Authentication & Security
- Secure Unified Login
- Access & Refresh Token Management (HTTP-only secure cookies)
- Stateless Gateway Signature Verification
- Role-Based Access Control (RBAC)
- Unified Mutation Audit Logging (action, user, changes, timestamp)

### Admin Panel
- Tenant Configuration Management
- Internal Account Setup
- Central Audit Log Explorer
- Microservice Health & Uptime statistics

### Vendor Portal & Registration
- Public Vendor Onboarding & approval pipeline
- Bid Submission & Terms input
- Purchase Order Acceptance
- Invoice uploads

### Procurement Management
- Purchase Requisitions
- RFQ generation and invitation
- Multi-Vendor quotation comparisons
- Purchase Order approvals & PO Status History

### Inventory Management
- GRN processing
- Quality Inspection reports
- Stock Transaction audit trail
- Product Returns & Return Status History

### Finance Management
- PO-GRN-Invoice three-way matches
- Department Budget limits verification
- Payments processing
- Invoice Status History

### Notification System
- SMTP Templated Email Delivery
- In-App Alerts
- Per-User Notification Preferences

### Reporting & Analytics
- Executive dashboard aggregates
- Vendor Performance & Score calculation
- Procurement turnover KPIs
- Scheduled calculation schedules
