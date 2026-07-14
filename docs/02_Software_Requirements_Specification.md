# ProcureX – Software Requirements Specification (SRS)

This document establishes the requirements baseline for **ProcureX**. It acts as the central reference mapping business objectives and functional user roles to the detailed system design, database, and API documents.

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) is to define the functional, non-functional, and interface requirements for the **ProcureX** multi-tenant e-procurement platform. 

### 1.2 Scope
This document covers the core capabilities of the React client dashboards, perimeter API gateway services, and the 7 functional domain subdomains (Identity, Vendor & Catalog, Procurement, Inventory, Finance, Notification, Reporting & Analytics).

---

## 2. Project Overview

ProcureX is an enterprise-grade B2B SaaS e-procurement platform that digitizes organization procurement lifecycles. The system automates organizational purchasing processes—from public vendor registrations, purchase requisitions, and bid invitations (RFQs) to quality control inspections (GRN), three-way invoice matching, and payment processing.

---

## 3. User Roles & Stakeholders

The platform serves five primary user roles, each with custom dashboards:

1. **System Administrator (Admin):** Manages host tenant organizations, system configurations, global user authorizations, password resets, and mutations audit logs.
2. **Procurement Manager:** Raises internal purchase requisitions (PR), publishes requests for quotations (RFQ), compares vendor bids, and approves purchase orders (PO).
3. **Inventory Manager:** Handles physical warehouse capacities, accepts inbound shipments, records Goods Receipt Notes (GRN), runs quality inspections, and schedules return processes.
4. **Finance Manager:** Sets departmental fiscal budgets, reconciles vendor invoices (three-way PO-GRN-Invoice matches), and initiates cash disbursements.
5. **Vendor:** Manages corporate profiles, submits quotation bids, accepts purchase orders, and uploads invoices.

---

## 4. Business Requirements (BRs)

- **BR-1 (Tenant Administration):** System must isolate tenant subscription profiles to support multi-tenant SaaS scaling.
- **BR-2 (Procurement Automation):** Enable complete digital tracking of purchasing lifecycles to reduce transaction processing time.
- **BR-3 (Vendor Compliance & Catalog):** Ensure only approved vendors bid on invited RFQs.
- **BR-4 (Three-Way Invoice Match):** Automatically verify invoice items against PO pricing and GRN accepted quantities before releasing funds.
- **BR-5 (Budget Accountability):** Prevent PO approvals if department allocations are exceeded.

---

## 5. Functional Requirements (FRs)

### 5.1 Identity & Access Management
- **FR-1.1:** Authentication using secure username and password credentials.
- **FR-1.2:** Enforce Role-Based Access Control (RBAC) mapping endpoints.
- **FR-1.3:** Record write actions to a centralized, non-updatable Audit Log database.
- **FR-1.4:** Session tracking using short-lived tokens and secure refresh cookies.

### 5.2 Vendor & Catalog Management
- **FR-2.1:** Host a guest portal page for public vendor registration applications.
- **FR-2.2:** Enable managers to review profiles and activate vendor accounts.
- **FR-2.3:** Maintain organization-wide master product catalogs.
- **FR-2.4:** Map vendor pricing, MOQ, and expected lead times.

### 5.3 Procurement Lifecycle
- **FR-3.1:** Create, edit, and submit Purchase Requisitions.
- **FR-3.2:** Publish RFQs specifying closing dates and invited vendors.
- **FR-3.3:** Allow vendors to submit quotation bids against active RFQs.
- **FR-3.4:** Display quotation metrics tables (total cost, lead time, rating score) side-by-side.
- **FR-3.5:** Automatically generate PO documents upon quotation award.

### 5.4 Inventory & Warehouse Operations
- **FR-4.1:** Register warehouses with capacities.
- **FR-4.2:** Match inbound shipments against purchase orders to verify received quantities.
- **FR-4.3:** Log quality inspections detailing accepted vs. rejected counts.
- **FR-4.4:** Record append-only stock transaction history logs.

### 5.5 Finance & Budget Control
- **FR-5.1:** Match invoices:
  $$\text{Invoice Qty} \le \text{GRN Accepted Qty}$$
  $$\text{Invoice Unit Price} = \text{PO Unit Price}$$
- **FR-5.2:** Enforce departmental budget checkups during PO approvals.
- **FR-5.3:** Release payment statuses upon match verification.

### 5.6 Notifications & Analytics
- **FR-6.1:** Transmit email notifications for critical workflow events (e.g. `RFQ_CREATED`, `PO_APPROVED`).
- **FR-6.2:** Calculate vendor performance ratings asynchronously:
  $$\text{Score} = (\text{On-Time Delivery} \times 0.6) + (\text{Quality Acceptance} \times 0.4)$$

### 5.7 Acceptance Criteria

#### FR-2.1: Public Vendor Registration Application
- **AC-2.1.1:** The guest portal registration form rejects submissions with empty mandatory fields (Name, Tax ID, Email).
- **AC-2.1.2:** System validates email format and rejects duplicate emails or tax identifiers (returns HTTP 409).
- **AC-2.1.3:** Upon successful submit, a `PENDING_APPROVAL` Vendor record is created in the database, and a `VendorUserCreated` event is published to RabbitMQ.

#### FR-3.2: Publish RFQ
- **AC-3.2.1:** The RFQ is saved successfully to the database with a status of `PUBLISHED`.
- **AC-3.2.2:** Rejects submission if the invited vendor list is empty or references non-existent vendor IDs.
- **AC-3.2.3:** Rejects submission if the specified closing date is in the past.
- **AC-3.2.4:** Publishes an `RFQ_CREATED` notification event to RabbitMQ.
- **AC-3.2.5:** Registers an audit trail entry in the Identity audit log.

#### FR-5.1: Three-Way Match Verification
- **AC-5.1.1:** Verification succeeds only if the invoice item quantities are less than or equal to the GRN accepted quantities.
- **AC-5.1.2:** Verification succeeds only if invoice unit prices match the prices declared on the approved PO.
- **AC-5.1.3:** If a mismatch is detected, the invoice status changes to `FLAGGED_VARIANCE` and alerts the Finance Manager.

---

## 6. Non-Functional Requirements (NFRs)

### 6.1 Performance
- **NFR-1.1 Response Time:** API Gateway routing and read queries must respond within 200ms under standard loads.
- **NFR-1.2 Event Processing Latency:** Event-driven notification emails and analytics counters recalculation must complete within 3 seconds of event publication.

### 6.2 Availability & Scalability
- **NFR-2.1 Target Uptime:** The platform targets 99.9% availability, excluding planned maintenance windows.
- **NFR-2.2 Stateless Replication:** Backend microservice instances must remain stateless to support horizontal autoscaling configurations.

### 6.3 Security
- **NFR-3.1 Data-in-Transit:** Enforce HTTPS using TLS 1.3 protocol globally; reject unencrypted HTTP traffic.
- **NFR-3.2 Cryptographic Hash:** Store user credentials using BCrypt hashing with a strength factor of 12.
- **NFR-3.3 Tenant Isolation:** Restrict data queries dynamically at the database layer using Hibernate tenant filters to block cross-organization data leakage.

### 6.4 Auditability
- **NFR-4.1 Write Action Audit:** All system mutation states must register audit entries containing timestamps, user IDs, organization IDs, and changed values.

---

## 7. Assumptions, Constraints & Scope Boundaries

### 7.1 Assumptions
- A third-party SMTP server is available to process emails.
- Tenant organizations communicate using UTC timezone references.
- Private virtual networks (VPCs) route internal microservice communication securely.

### 7.2 Constraints
- Databases are isolated per service; direct cross-database access is prohibited.
- Distributed transactions (such as 2-Phase Commits) are forbidden; consistency is managed via Sagas and the Outbox Pattern.
- MySQL must serve as the primary relational database layer.

### 7.3 Out of Scope
- **Payment Processing Gateway Integration:** Out of scope for Phase 1. Transactions are marked as "disbursed" programmatically; banking webhook integrations (e.g. Stripe, ACH rails) are deferred to future phases.
- **ERP Integration:** Direct synchronization syncs with SAP or Oracle ERP systems.
- **Kubernetes Orchestration:** Deployment configurations target simple Docker Compose environments; Kubernetes clusters and helm charts are out of scope.
- **AI Recommendation Engine:** Automated predictive vendor sourcing, contract negotiations, or AI-powered budget suggestions are excluded from V1.

---

## 8. Business Workflow

The central business workflow spans from public vendor registration to invoice verification and cash settlement:

```text
  [ Vendor Portal ]          [ Procurement Dashboard ]         [ Inventory/Finance Dashboard ]
          │                              │                                    │
  Vendor Registers                       │                                    │
          │                              │                                    │
  Manager Approves ──────────────────────►                                    │
                                         │                                    │
                                  Raises Requisition                          │
                                         │                                    │
                                  Publishes RFQ ──────────────────────────────►
                                                                              │
                                                                       Submits Quotation
                                                                              │
                                  Selects Bid & Generates PO ◄────────────────┘
                                         │
                                   Approves PO
                                         │
                                         ▼
                                  Receives Goods (GRN) & QA Inspection
                                         │
                                         ▼
                                  Uploads Invoice & 3-Way Match Verification
                                         │
                                         ▼
                                  Payment Settlement
```

---

## 9. System Context

The following diagram illustrates how the frontend React client connects to the ProcureX system through the API Gateway, and how the backend integrates with external systems:

```mermaid
graph TD
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef system fill:#bbf,stroke:#333,stroke-width:2px;
    classDef ext fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;

    Client[React Client Dashboard] ::: client -->|HTTPS| GW[API Gateway] ::: system
    
    subgraph ProcureX [ProcureX Core Subsystem]
        GW --> Services[Microservices Layer] ::: system
    end

    Services -->|Asynchronous SMTP| Email[SMTP Mail Server] ::: ext
    Services -.->|Future webhook web hooks| ERP[Future ERP System] ::: ext
    Services -.->|Future API Integrations| Bank[Future Payment Processor] ::: ext
```

---

## 10. Requirement Traceability Matrix

The matrix below maps critical functional requirements (FRs) to their implementations in HLD components, API contract methods, and Database schemas:

| Requirement ID | Description | HLD Component | API Endpoint / Method | Database Table |
| :--- | :--- | :--- | :--- | :--- |
| **FR-1.1** | User Authentication | Identity Service | `POST /api/v1/auth/login` | `users` |
| **FR-2.1** | Vendor Registration | Vendor Service | `POST /api/v1/vendors/register` | `vendors` |
| **FR-3.1** | Create Requisition (PR) | Procurement Service | `POST /api/v1/procurement/requisitions` | `purchase_requisitions` |
| **FR-3.2** | Publish RFQ | Procurement Service | `POST /api/v1/procurement/rfqs` | `rfqs` |
| **FR-3.3** | Submit Quotation | Procurement Service | `POST /api/v1/procurement/quotations` | `quotations` |
| **FR-3.5** | Generate PO | Procurement Service | `POST /api/v1/procurement/orders/{id}/approve` | `purchase_orders` |
| **FR-4.2** | Goods Receipt Note | Inventory Service | `POST /api/v1/inventory/grns` | `goods_receipt_notes` |
| **FR-4.3** | QC Inspection | Inventory Service | `POST /api/v1/inventory/inspections` | `quality_inspections` |
| **FR-5.1** | Three-Way Matching | Finance Service | `GET /api/v1/finance/invoices/{id}/match` | `invoices` |
| **FR-5.2** | Budget Controls | Finance Service | Checked during PO approval | `budgets` |

---

## 11. Design Document References

To explore technical design, architectural patterns, schemas, or API contracts, refer to the dedicated design specifications:

- **High-Level Design:** Reference [03_High_Level_Design.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/ProcureX/03_High_Level_Design.md) for overall services, topologies, workflows, and deployment overlays.
- **Technical System Architecture:** Reference [04_Technical_System_Architecture.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/ProcureX/04_Technical_System_Architecture.md) for Feign setups, transactional outboxes, orchestrated sagas, and RabbitMQ bindings.
- **Database Design:** Reference [05_Database_Design.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/ProcureX/05_Database_Design.md) for entity schemas, column definitions, index keys, and migration scripts.
- **API Design:** Reference [06_API_Design.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/ProcureX/06_API_Design.md) for rest endpoint request schemas, parameter filters, status codes, and security requirements.
- **Security Design:** Reference [08_Security_Design.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/ProcureX/08_Security_Design.md) for trust boundaries, login sequences, RBAC permissions, and vulnerability mitigations.
- **Low-Level Design:** Reference [07_Low_Level_Design.md](file:///c:/Users/DELL/Desktop/Projects/ProcureX/ProcureX/07_Low_Level_Design.md) for class models, directories, logic loops, validation annotations, and class structures.
