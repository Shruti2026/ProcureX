# ProcureX – Database Design

# 1. Database Architecture

## 1.1 Overview

ProcureX follows the **Database per Microservice** pattern, where each microservice owns and manages its own MySQL database. This ensures loose coupling, independent scalability, and clear ownership of business data.

Each microservice is solely responsible for performing Create, Read, Update, and Delete (CRUD) operations on its own database. Direct access to another microservice's database is strictly prohibited. Data sharing between services is achieved through REST APIs or asynchronous event-driven communication using RabbitMQ.

This architecture improves maintainability, data isolation, fault tolerance, and enables independent development and deployment of each microservice.

---

## 1.2 Database Architecture Diagram

```text
                        React Frontend
                              │
                        API Gateway
                              │
      -------------------------------------------------------
      │          │           │          │          │         │
 Identity  Vendor & Catalog  Procurement  Inventory  Finance  Notification
 Service      Service        Service     Service   Service    Service
      │          │           │          │          │         │
      ▼          ▼           ▼          ▼          ▼         ▼

 identity_db vendor_db procurement_db inventory_db finance_db notification_db
                              │
                              ▼
                      Analytics Service
                              │
                              ▼
                        analytics_db
```

---

## 1.3 Database List

| Database | Owned By | Purpose |
|----------|----------|---------| 
| identity_db | Identity Service | Authentication, users, roles, permissions, and audit logs |
| vendor_db | Vendor & Catalog Service | Vendor profiles, product catalog, categories, vendor–product mapping, and contracts |
| procurement_db | Procurement Service | Purchase requisitions, RFQs, quotations, purchase orders, and status history |
| inventory_db | Inventory Service | Warehouses, inventory, GRN, quality inspections, stock transactions, returns, and history |
| finance_db | Finance Service | Invoices, invoice items, payments, budgets, and invoice history |
| notification_db | Notification Service | Notifications and user notification preferences |
| analytics_db | Reporting & Analytics Service | Pre-aggregated KPI metrics and analytics dashboard data |

---

## 1.4 Database Design Principles

The database architecture follows the following principles:

- One database per microservice.
- Every service owns its own data.
- No service directly accesses another service's database.
- Data sharing is performed only through REST APIs or RabbitMQ events.
- Every database maintains referential integrity within its own service.
- Cross-service relationships are maintained using entity identifiers rather than foreign key constraints.
- Each database is independently scalable and maintainable.
- All primary keys use UUID (v4) generated at the application layer.
- All monetary values use `DECIMAL(15,2)` consistently across all services.
- Frequently updated tables include a `version` column for optimistic locking.
- Key business tables include soft-delete fields (`is_deleted`, `deleted_at`) instead of hard deletes.
- **Multi-Tenant Planning:** Every business table contains an `organization_id` field to enable seamless future migration to a multi-tenant SaaS platform.
- **Audit Trails & Status History:** Significant status changes are tracked via active status history tables (`purchase_order_history`, etc.) to provide complete business auditable trace.

> **Cross-Service Reference Policy:** Cross-service identifiers (such as `vendor_id`, `product_id`, `purchase_order_id`) are treated as immutable business references, not database foreign keys. Referential integrity across microservices is enforced through service-level validation and business logic rather than database constraints.

---

## 1.5 Cross-Service Reference Examples

The following table documents all cross-service identifier references in the system. These are **not** database foreign keys — they are application-level references enforced through service logic.

| Stored In | Field | Refers To | Relationship |
|-----------|-------|-----------|-------------|
| Vendor & Catalog Service (`vendors`) | `user_id` | Identity Service `users.user_id` | Cross-service reference |
| Procurement Service (`purchase_requisitions`) | `created_by` | Identity Service `users.user_id` | Cross-service reference |
| Procurement Service (`rfqs`) | `created_by` | Identity Service `users.user_id` | Cross-service reference |
| Procurement Service (`rfq_vendors`) | `vendor_id` | Vendor & Catalog Service `vendors.vendor_id` | Cross-service reference |
| Procurement Service (`quotations`) | `vendor_id` | Vendor & Catalog Service `vendors.vendor_id` | Cross-service reference |
| Procurement Service (`purchase_requisition_items`) | `product_id` | Vendor & Catalog Service `products.product_id` | Cross-service reference |
| Procurement Service (`purchase_orders`) | `vendor_id` | Vendor & Catalog Service `vendors.vendor_id` | Cross-service reference |
| Procurement Service (`purchase_orders`) | `approved_by` | Identity Service `users.user_id` | Cross-service reference |
| Inventory Service (`goods_receipt_notes`) | `purchase_order_id` | Procurement Service `purchase_orders.purchase_order_id` | Cross-service reference |
| Inventory Service (`inventory`) | `product_id` | Vendor & Catalog Service `products.product_id` | Cross-service reference |
| Inventory Service (`stock_transactions`) | `product_id` | Vendor & Catalog Service `products.product_id` | Cross-service reference |
| Inventory Service (`product_returns`) | `vendor_id` | Vendor & Catalog Service `vendors.vendor_id` | Cross-service reference |
| Finance Service (`invoices`) | `purchase_order_id` | Procurement Service `purchase_orders.purchase_order_id` | Cross-service reference |
| Finance Service (`invoices`) | `vendor_id` | Vendor & Catalog Service `vendors.vendor_id` | Cross-service reference |
| Finance Service (`invoice_items`) | `product_id` | Vendor & Catalog Service `products.product_id` | Cross-service reference |
| Notification Service (`notifications`) | `recipient_id` | Identity Service `users.user_id` | Cross-service reference |
| Notification Service (`notification_preferences`) | `user_id` | Identity Service `users.user_id` | Cross-service reference |

---

# 2. Database Ownership

## 2.1 Ownership Rules

The following ownership rules are followed throughout the project.

### Rule 1

Each microservice is the sole owner of its database.

### Rule 2

Only the owning microservice can insert, update or delete records in its database.

### Rule 3

Other microservices must never access another service's database directly.

### Rule 4

Inter-service communication shall occur using:

- REST APIs (Synchronous Communication)
- RabbitMQ Events (Asynchronous Communication)

### Rule 5

Cross-service references shall use entity IDs instead of database foreign keys.

Example:

Purchase Order stores:

- Vendor ID
- Product ID

instead of creating foreign key relationships with Vendor & Catalog Service.

---

## 2.2 Database Ownership Matrix

| Microservice | Database | Owned Entities |
|--------------|----------|----------------|
| Identity Service | identity_db | Users, Roles, Audit Logs |
| Vendor & Catalog Service | vendor_db | Vendors, Products, Categories, Vendor Products, Contracts |
| Procurement Service | procurement_db | Purchase Requisitions, Requisition Items, RFQs, RFQ Vendors, Quotations, Quotation Items, Purchase Orders, Purchase Order Items, Purchase Order History |
| Inventory Service | inventory_db | Warehouses, Inventory, Goods Receipt Notes (GRN), GRN Items, Quality Inspections, Stock Transactions, Product Returns, Product Return History |
| Finance Service | finance_db | Invoices, Invoice Items, Payments, Budgets, Invoice History |
| Notification Service | notification_db | Notifications, Notification Preferences |
| Reporting & Analytics Service | analytics_db | Dashboard KPIs |

---

## 2.3 Data Access Policy

| Operation | Allowed |
|-----------|---------|
| Read Own Database | ✅ Yes |
| Insert Own Database | ✅ Yes |
| Update Own Database | ✅ Yes |
| Delete Own Database | ✅ Yes |
| Read Another Service Database | ❌ No |
| Insert Another Service Database | ❌ No |
| Update Another Service Database | ❌ No |
| Delete Another Service Database | ❌ No |

---

## 2.4 Cross-Service Communication

When one microservice requires information owned by another service, it shall use one of the following communication mechanisms:

### REST APIs

Used for request-response communication.

Examples:

- Procurement Service retrieves Vendor details from Vendor & Catalog Service.
- Finance Service retrieves Purchase Order details from Procurement Service.
- Inventory Service retrieves Product details from Vendor & Catalog Service.

---

### RabbitMQ Events

Used for asynchronous business events.

Examples:

- RFQ Created
- Quotation Submitted
- Purchase Order Approved
- Goods Received
- Inventory Updated
- Invoice Approved
- Payment Completed

Subscribed services process these events independently without directly accessing another service's database.

---

## 3. Identity Service Database

The Identity Service is the **single authentication authority** for the entire system. All users — including Procurement Managers, Inventory Managers, Finance Managers, Admins, and Vendors — authenticate through this service. It manages user credentials, JWT token generation, Role-Based Access Control (RBAC), and global system-wide mutation audit logging.

---

### Tables

- roles
- users
- audit_logs

---

## 3.1 roles

Stores all predefined system roles.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| role_id | UUID | Primary Key | Unique role identifier |
| role_name | VARCHAR(50) | NOT NULL, UNIQUE | Role name |
| description | TEXT | NULL | Role description |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Default Roles

- ADMIN
- PROCUREMENT_MANAGER
- INVENTORY_MANAGER
- FINANCE_MANAGER
- VENDOR

---

## 3.2 users

Stores all application users, including internal organization users and registered vendors. Vendor credentials are stored here; the Vendor & Catalog Service stores only business-domain profile data.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| user_id | UUID | Primary Key | Unique user identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| full_name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(100) | NOT NULL, UNIQUE | Login email |
| password | VARCHAR(255) | NOT NULL | BCrypt-encrypted password |
| phone_number | VARCHAR(15) | NULL | Contact number |
| role_id | UUID | Foreign Key | References roles.role_id |
| account_status | ENUM | NOT NULL | ACTIVE, INACTIVE, LOCKED |
| last_login | TIMESTAMP | NULL | Last successful login |
| created_by | UUID | NULL | Cross-service ref to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service ref to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 3.3 audit_logs

Stores an immutable system-wide history of all mutation actions (creates, updates, deletes) performed by users. This serves as the primary system audit trail for compliance and security auditing.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| audit_log_id | UUID | Primary Key | Unique log identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| user_id | UUID | NOT NULL | Cross-service ref to Identity Service users.user_id who made the change |
| action | VARCHAR(50) | NOT NULL | Action type (e.g., CREATE_PO, UPDATE_INVENTORY, DELETE_USER) |
| entity_name | VARCHAR(100) | NOT NULL | Name of the table/entity affected (e.g., purchase_orders) |
| entity_id | UUID | NOT NULL | Identifier of the affected record |
| old_value | TEXT | NULL | JSON string of the state before change |
| new_value | TEXT | NULL | JSON string of the state after change |
| ip_address | VARCHAR(45) | NULL | IP address of the user agent |
| created_at | TIMESTAMP | NOT NULL | Timestamp when the action was performed |

---

## Entity Relationships

```
Roles (1)
    │
    │
    ▼
 Users (1)
    │
    ▼
 Audit Logs (N)
```

- One Role can be assigned to many Users.
- Each User has exactly one Role.
- One User can perform multiple audited actions.
- Vendors are also stored as Users with `role = VENDOR`.

---

## Database Notes

- Passwords shall be stored using BCrypt hashing.
- Authentication is performed using email and password for all user types.
- Role-Based Access Control (RBAC) is implemented through the assigned role.
- When a Vendor account is created, a corresponding vendor profile is created in the Vendor & Catalog Service, storing `user_id` as a cross-service reference.

---

## 4. Vendor & Catalog Service Database

The Vendor & Catalog Service manages vendor business profiles, the organization's master product catalog, product categories, vendor–product mappings, and vendor contracts. Authentication credentials are **not** stored here — they are owned by the Identity Service.

---

### Tables

- vendors
- categories
- products
- vendor_products
- contracts

---

## 4.1 vendors

Stores business profile information for all registered vendors. The `user_id` field is a cross-service reference to the Identity Service `users` table and is used to link the vendor's business profile to their authentication account.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| vendor_id | UUID | Primary Key | Unique vendor identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| user_id | UUID | NOT NULL, UNIQUE | Cross-service reference to Identity Service users.user_id |
| company_name | VARCHAR(150) | NOT NULL | Vendor company name |
| contact_person | VARCHAR(100) | NOT NULL | Primary contact person |
| phone_number | VARCHAR(15) | NOT NULL | Contact number |
| address | TEXT | NOT NULL | Company address |
| city | VARCHAR(100) | NOT NULL | City |
| state | VARCHAR(100) | NOT NULL | State |
| country | VARCHAR(100) | NOT NULL | Country |
| postal_code | VARCHAR(15) | NULL | Postal code |
| gst_number | VARCHAR(30) | UNIQUE | GST registration number |
| vendor_status | ENUM | NOT NULL | ACTIVE, INACTIVE, SUSPENDED |
| rating | DECIMAL(2,1) | DEFAULT 0.0 | Average vendor rating (see rating note below) |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Vendor Rating Note

The `rating` field is updated by the **Vendor & Catalog Service** in response to vendor-performance events. The Reporting & Analytics Service calculates the performance score and publishes a `VendorRatingUpdated` RabbitMQ event. The Vendor & Catalog Service consumes this event and updates the `rating` field. Analytics calculates — Vendor & Catalog Service stores.

---

## 4.2 categories

Stores product categories.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| category_id | UUID | Primary Key | Unique category identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| category_name | VARCHAR(100) | NOT NULL, UNIQUE | Category name |
| description | TEXT | NULL | Category description |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

Examples

- Electronics
- Furniture
- Office Supplies
- Networking Equipment

---

## 4.3 products

Stores the organization's master product catalog.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| product_id | UUID | Primary Key | Unique product identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| category_id | UUID | Foreign Key | References categories.category_id |
| product_name | VARCHAR(150) | NOT NULL | Product name |
| description | TEXT | NULL | Product description |
| unit_of_measure | VARCHAR(30) | NOT NULL | Piece, Box, Kg, Litre, etc. |
| minimum_stock | INTEGER | DEFAULT 0 | Low stock threshold |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 4.4 vendor_products

Maps vendors to the products they supply. A vendor can supply multiple products; a product can be supplied by multiple vendors. This table stores vendor-specific pricing and ordering terms.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| vendor_product_id | UUID | Primary Key | Unique mapping identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| vendor_id | UUID | Foreign Key | References vendors.vendor_id |
| product_id | UUID | Foreign Key | References products.product_id |
| vendor_price | DECIMAL(15,2) | NOT NULL | Vendor's standard unit price |
| minimum_order_quantity | INTEGER | DEFAULT 1 | Minimum order quantity |
| lead_time_days | INTEGER | NULL | Standard lead time in days |
| status | ENUM | NOT NULL | ACTIVE, INACTIVE |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Unique Constraint

`(vendor_id, product_id)` must be unique — one vendor cannot have duplicate product entries.

---

## 4.5 contracts

Stores vendor contracts agreed between the organization and a vendor.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| contract_id | UUID | Primary Key | Unique contract identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| vendor_id | UUID | Foreign Key | References vendors.vendor_id |
| contract_number | VARCHAR(30) | NOT NULL, UNIQUE | Contract reference number |
| start_date | DATE | NOT NULL | Contract effective date |
| end_date | DATE | NOT NULL | Contract expiry date |
| terms | TEXT | NULL | Contract terms and conditions |
| status | ENUM | NOT NULL | ACTIVE, EXPIRED, TERMINATED |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## Entity Relationships

```
Categories (1)
      │
      ▼
   Products (N)
      │
      ▼
Vendor Products (N) ←── Vendors (1)
      │
Vendors (1)
      │
      ▼
 Contracts (N)
```

- One Category can contain many Products.
- Each Product belongs to one Category.
- One Vendor can supply many Products (via vendor_products).
- One Product can be supplied by many Vendors (via vendor_products).
- One Vendor can have multiple Contracts.
- Each Contract belongs to one Vendor.

---

## 5. Procurement Service Database

The Procurement Service manages the complete procurement lifecycle, including purchase requisitions, requests for quotations (RFQs), vendor quotations, quotation comparison, purchase orders, and purchase order history.

---

### Tables

- purchase_requisitions
- purchase_requisition_items
- rfqs
- rfq_vendors
- quotations
- quotation_items
- purchase_orders
- purchase_order_items
- purchase_order_history

---

## 5.1 purchase_requisitions

Stores procurement requests created by the Procurement Manager.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| requisition_id | UUID | Primary Key | Unique requisition identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| requisition_number | VARCHAR(30) | NOT NULL, UNIQUE | Requisition reference number |
| title | VARCHAR(150) | NOT NULL | Requisition title |
| description | TEXT | NULL | Procurement requirement |
| required_date | DATE | NOT NULL | Expected delivery date |
| status | ENUM | NOT NULL | CREATED, RFQ_CREATED, CLOSED |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.2 purchase_requisition_items

Stores products included in a requisition.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| requisition_item_id | UUID | Primary Key | Unique item identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| requisition_id | UUID | Foreign Key | References purchase_requisitions |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| quantity | INTEGER | NOT NULL | Required quantity |
| remarks | TEXT | NULL | Additional notes |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.3 rfqs

Stores Requests for Quotations created from purchase requisitions.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| rfq_id | UUID | Primary Key | Unique RFQ identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| requisition_id | UUID | Foreign Key | References purchase_requisitions |
| rfq_number | VARCHAR(30) | UNIQUE | RFQ reference number |
| issue_date | DATE | NOT NULL | RFQ issue date |
| closing_date | DATE | NOT NULL | Quotation submission deadline |
| status | ENUM | NOT NULL | OPEN, CLOSED, AWARDED |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.4 rfq_vendors

Stores vendors invited to participate in an RFQ.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| rfq_vendor_id | UUID | Primary Key | Unique mapping identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| rfq_id | UUID | Foreign Key | References rfqs |
| vendor_id | UUID | NOT NULL | Vendor identifier (cross-service ref) |
| invitation_status | ENUM | NOT NULL | SENT, VIEWED, RESPONDED, DECLINED, EXPIRED |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.5 quotations

Stores quotations submitted by vendors.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| quotation_id | UUID | Primary Key | Unique quotation identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| rfq_id | UUID | Foreign Key | References rfqs |
| vendor_id | UUID | NOT NULL | Vendor identifier (cross-service ref) |
| total_amount | DECIMAL(15,2) | NOT NULL | Total quotation amount |
| delivery_days | INTEGER | NOT NULL | Delivery duration |
| payment_terms | VARCHAR(150) | NULL | Payment terms |
| validity_date | DATE | NOT NULL | Quotation validity |
| status | ENUM | NOT NULL | SUBMITTED, SELECTED, REJECTED |
| submitted_at | TIMESTAMP | NOT NULL | Submission timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.6 quotation_items

Stores product-wise quotation details.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| quotation_item_id | UUID | Primary Key | Unique item identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| quotation_id | UUID | Foreign Key | References quotations |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| quantity | INTEGER | NOT NULL | Offered quantity |
| unit_price | DECIMAL(12,2) | NOT NULL | Price per unit |
| total_price | DECIMAL(15,2) | NOT NULL | Total price |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.7 purchase_orders

Stores approved purchase orders.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| purchase_order_id | UUID | Primary Key | Unique Purchase Order identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| po_number | VARCHAR(30) | UNIQUE | Purchase Order number |
| quotation_id | UUID | NULL | Selected quotation (NULL if manually created) |
| vendor_id | UUID | NOT NULL | Vendor identifier (cross-service ref) |
| order_date | DATE | NOT NULL | Purchase Order date |
| expected_delivery | DATE | NOT NULL | Expected delivery date |
| total_amount | DECIMAL(15,2) | NOT NULL | Purchase Order value |
| status | ENUM | NOT NULL | CREATED, APPROVED, ACCEPTED, DELIVERED, COMPLETED, CANCELLED |
| approved_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| version | INTEGER | DEFAULT 0 | Optimistic locking version |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Note on `quotation_id`

`quotation_id` is nullable. A Purchase Order is typically generated from a selected quotation, but may also be created manually (e.g., for repeat orders or negotiated contracts). When `quotation_id` is NULL, the PO is treated as a manual purchase order.

---

## 5.8 purchase_order_items

Stores products included in the Purchase Order.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| po_item_id | UUID | Primary Key | Unique item identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| purchase_order_id | UUID | Foreign Key | References purchase_orders |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| quantity | INTEGER | NOT NULL | Ordered quantity |
| unit_price | DECIMAL(12,2) | NOT NULL | Price per unit |
| total_price | DECIMAL(15,2) | NOT NULL | Total price |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 5.9 purchase_order_history

Maintains a complete audit history of all status changes for purchase orders.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| history_id | UUID | Primary Key | Unique history identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| purchase_order_id | UUID | Foreign Key | References purchase_orders.purchase_order_id |
| from_status | ENUM | NULL | Previous status (NULL if initial CREATED) |
| to_status | ENUM | NOT NULL | Current status after transition |
| remarks | TEXT | NULL | Reason for status change |
| changed_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| changed_at | TIMESTAMP | NOT NULL | Timestamp when the change occurred |

---

## Entity Relationships

```
Purchase Requisition (1)
│
├── Purchase Requisition Items (N)
│
▼
RFQ (1)
│
├── RFQ Vendors (N)
│
├── Quotations (N)
│ │
│ └── Quotation Items (N)
│
▼
Purchase Order (1)
│
├── Purchase Order Items (N)
│
└── Purchase Order History (N)
```

---

## 6. Inventory Service Database

The Inventory Service is responsible for managing warehouses, goods receipt, inventory updates, quality inspections, stock transaction audit trails, product returns, and return status history.

---

### Tables

- warehouses
- inventory
- goods_receipt_notes
- grn_items
- quality_inspections
- stock_transactions
- product_returns
- product_return_history

---

## 6.1 warehouses

Stores warehouse information.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| warehouse_id | UUID | Primary Key | Unique warehouse identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| warehouse_name | VARCHAR(100) | NOT NULL | Warehouse name |
| location | VARCHAR(255) | NOT NULL | Warehouse location |
| capacity | INTEGER | NULL | Maximum storage capacity |
| manager_name | VARCHAR(100) | NULL | Warehouse manager |
| status | ENUM | NOT NULL | ACTIVE, INACTIVE |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 6.2 inventory

Stores current inventory levels per product per warehouse.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| inventory_id | UUID | Primary Key | Unique inventory identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| warehouse_id | UUID | Foreign Key | References warehouses.warehouse_id |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| available_quantity | INTEGER | NOT NULL | Current available quantity |
| reserved_quantity | INTEGER | DEFAULT 0 | Reserved stock |
| version | INTEGER | DEFAULT 0 | Optimistic locking version |
| last_updated | TIMESTAMP | NOT NULL | Last inventory update |

---

## 6.3 goods_receipt_notes

Stores Goods Receipt Notes created after receiving products from vendors. Previously named `grn`.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| grn_id | UUID | Primary Key | Unique GRN identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| grn_number | VARCHAR(30) | UNIQUE | GRN reference number |
| purchase_order_id | UUID | NOT NULL | Purchase Order identifier (cross-service ref) |
| warehouse_id | UUID | Foreign Key | Receiving warehouse |
| received_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| received_date | DATE | NOT NULL | Goods received date |
| remarks | TEXT | NULL | Additional remarks |
| status | ENUM | NOT NULL | RECEIVED, INSPECTED, COMPLETED |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 6.4 grn_items

Stores product-wise details for a Goods Receipt Note.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| grn_item_id | UUID | Primary Key | Unique item identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| grn_id | UUID | Foreign Key | References goods_receipt_notes.grn_id |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| ordered_quantity | INTEGER | NOT NULL | Quantity ordered |
| received_quantity | INTEGER | NOT NULL | Quantity received |
| accepted_quantity | INTEGER | NOT NULL | Accepted quantity |
| rejected_quantity | INTEGER | DEFAULT 0 | Rejected quantity |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 6.5 quality_inspections

Stores inspection details for received products.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| inspection_id | UUID | Primary Key | Unique inspection identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| grn_item_id | UUID | Foreign Key | References grn_items.grn_item_id |
| inspected_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| inspection_date | DATE | NOT NULL | Inspection date |
| status | ENUM | NOT NULL | PASSED, FAILED, PARTIALLY_ACCEPTED |
| approved_quantity | INTEGER | NULL | Final approved quantity after inspection |
| rejected_reason | TEXT | NULL | Reason for rejection or partial acceptance |
| inspection_report | TEXT | NULL | Detailed inspection report notes |
| remarks | TEXT | NULL | General inspection remarks |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 6.6 stock_transactions

Records every stock movement for full inventory auditability. Every inventory change (receipt, transfer, return, adjustment) is captured as a transaction.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| transaction_id | UUID | Primary Key | Unique transaction identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| inventory_id | UUID | Foreign Key | References inventory.inventory_id |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| warehouse_id | UUID | Foreign Key | References warehouses.warehouse_id |
| transaction_type | ENUM | NOT NULL | RECEIPT, TRANSFER, RETURN, ADJUSTMENT |
| quantity | INTEGER | NOT NULL | Quantity moved (positive = in, negative = out) |
| reason | TEXT | NULL | Reason for the stock movement |
| reference_id | UUID | NULL | Reference to originating record (e.g., grn_id, return_id) |
| reference_type | VARCHAR(50) | NULL | Type of originating record (GRN, RETURN, etc.) |
| performed_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Transaction timestamp |

---

## 6.7 product_returns

Stores products returned to vendors after failed or partial quality inspection. Previously named `returns`.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| return_id | UUID | Primary Key | Unique return identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| return_number | VARCHAR(30) | NOT NULL, UNIQUE | Return reference number |
| grn_item_id | UUID | Foreign Key | References grn_items.grn_item_id |
| vendor_id | UUID | NOT NULL | Vendor identifier (cross-service ref) |
| return_date | DATE | NOT NULL | Return date |
| quantity | INTEGER | NOT NULL | Returned quantity |
| reason | TEXT | NOT NULL | Reason for return |
| return_status | ENUM | NOT NULL | INITIATED, RETURNED, REPLACED, CLOSED |
| approved_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| replacement_expected | BOOLEAN | DEFAULT FALSE | Whether replacement shipment is expected |
| replacement_received_date | DATE | NULL | Date when replacement delivery was received |
| credit_note_reference | VARCHAR(50) | NULL | Credit note reference if applicable |
| closed_at | TIMESTAMP | NULL | Timestamp when return was closed |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 6.8 product_return_history

Maintains status tracking history of returns.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| history_id | UUID | Primary Key | Unique history identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| return_id | UUID | Foreign Key | References product_returns.return_id |
| from_status | ENUM | NULL | Previous status |
| to_status | ENUM | NOT NULL | New status after change |
| remarks | TEXT | NULL | Reason |
| changed_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| changed_at | TIMESTAMP | NOT NULL | Timestamp of status transition |

---

## Entity Relationships

```
Warehouses (1)
│
├── Inventory (N)
│   │
│   └── Stock Transactions (N)
│
└── Goods Receipt Notes (N)
    │
    └── GRN Items (N)
        │
        ├── Quality Inspection (1)
        │
        └── Product Returns (0..1)
            │
            └── Product Return History (N)
```

---

## 7. Finance Service Database

The Finance Service is responsible for invoice verification, invoice item tracking, payment processing, budget management, and invoice history tracking.

---

### Tables

- invoices
- invoice_items
- payments
- budgets
- invoice_history

---

## 7.1 invoices

Stores vendor invoices submitted against approved Purchase Orders.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| invoice_id | UUID | Primary Key | Unique invoice identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| invoice_number | VARCHAR(30) | NOT NULL, UNIQUE | Vendor invoice number |
| purchase_order_id | UUID | NOT NULL | Purchase Order reference (cross-service ref) |
| vendor_id | UUID | NOT NULL | Vendor identifier (cross-service ref) |
| invoice_date | DATE | NOT NULL | Invoice generation date |
| due_date | DATE | NOT NULL | Payment due date |
| invoice_amount | DECIMAL(15,2) | NOT NULL | Total invoice amount before tax |
| tax_amount | DECIMAL(15,2) | DEFAULT 0 | GST / Tax amount |
| total_amount | DECIMAL(15,2) | NOT NULL | Final payable amount |
| status | ENUM | NOT NULL | PENDING, VERIFIED, APPROVED, PAID, REJECTED |
| verified_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| remarks | TEXT | NULL | Verification remarks |
| version | INTEGER | DEFAULT 0 | Optimistic locking version |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 7.2 invoice_items

Stores line-item details for each vendor invoice.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| invoice_item_id | UUID | Primary Key | Unique item identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| invoice_id | UUID | Foreign Key | References invoices.invoice_id |
| product_id | UUID | NOT NULL | Product identifier (cross-service ref) |
| description | TEXT | NULL | Line item description |
| quantity | INTEGER | NOT NULL | Invoiced quantity |
| unit_price | DECIMAL(12,2) | NOT NULL | Price per unit |
| total_price | DECIMAL(15,2) | NOT NULL | Total line item amount |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 7.3 payments

Stores payment details for approved invoices.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| payment_id | UUID | Primary Key | Unique payment identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| invoice_id | UUID | Foreign Key | References invoices.invoice_id |
| payment_reference | VARCHAR(50) | UNIQUE | Payment transaction reference |
| payment_date | DATE | NOT NULL | Payment date |
| payment_method | ENUM | NOT NULL | BANK_TRANSFER, UPI, CHEQUE, NEFT, RTGS |
| amount_paid | DECIMAL(15,2) | NOT NULL | Paid amount |
| payment_status | ENUM | NOT NULL | SUCCESS, FAILED, PENDING |
| processed_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| remarks | TEXT | NULL | Payment remarks |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 7.4 budgets

Stores procurement budgets allocated for controlling department spending.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| budget_id | UUID | Primary Key | Unique budget identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| budget_name | VARCHAR(150) | NOT NULL | Budget name or title |
| fiscal_year | VARCHAR(10) | NOT NULL | Fiscal year (e.g., 2025-26) |
| department | VARCHAR(100) | NULL | Department the budget is allocated for |
| total_amount | DECIMAL(15,2) | NOT NULL | Total allocated budget |
| utilized_amount | DECIMAL(15,2) | DEFAULT 0 | Amount spent so far |
| status | ENUM | NOT NULL | ACTIVE, EXHAUSTED, CLOSED |
| created_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| updated_by | UUID | NULL | Cross-service reference to Identity Service users.user_id |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

> **Note:** `remaining_amount` is intentionally omitted — it is a derived value (`total_amount - utilized_amount`) and is computed at the application layer to avoid data inconsistency.

---

## 7.5 invoice_history

Tracks the audit history of invoice approval workflows.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| history_id | UUID | Primary Key | Unique history identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| invoice_id | UUID | Foreign Key | References invoices.invoice_id |
| from_status | ENUM | NULL | Previous status |
| to_status | ENUM | NOT NULL | Status after transition |
| remarks | TEXT | NULL | Comments |
| changed_by | UUID | NOT NULL | Cross-service reference to Identity Service users.user_id |
| changed_at | TIMESTAMP | NOT NULL | Timestamp of approval step |

---

## Entity Relationships

```
Purchase Order (1)
│
▼
Invoice (1)
│
├── Invoice Items (N)
│
├── Invoice History (N)
│
▼
Payment (1)

Budgets (N)
```

---

## 8. Notification Service Database

The Notification Service is responsible for delivering system-generated notifications to internal users and vendors during different stages of the procurement lifecycle. It also stores per-user notification delivery preferences.

Notifications are triggered automatically through RabbitMQ events published by other microservices.

---

### Tables

- notifications
- notification_preferences

---

## 8.1 notifications

Stores all in-app and email notifications generated by the system.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| notification_id | UUID | Primary Key | Unique notification identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| recipient_id | UUID | NOT NULL | `users.user_id` from Identity Service — covers all roles including Vendor |
| title | VARCHAR(150) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| notification_type | ENUM | NOT NULL | IN_APP, EMAIL |
| event_type | ENUM | NOT NULL | RFQ_CREATED, QUOTATION_SUBMITTED, PURCHASE_ORDER_APPROVED, GOODS_RECEIVED, INVOICE_UPLOADED, PAYMENT_COMPLETED |
| entity_type | VARCHAR(50) | NULL | Type of originating entity (e.g., PURCHASE_ORDER, INVOICE, RFQ) |
| entity_id | UUID | NULL | ID of the originating entity for deep-linking |
| status | ENUM | NOT NULL | UNREAD, READ |
| created_at | TIMESTAMP | NOT NULL | Notification creation timestamp |
| read_at | TIMESTAMP | NULL | Timestamp when notification was read |

> **Note on `recipient_id`:** Since all users — including Vendors — now authenticate through the Identity Service and have a `user_id`, `recipient_id` is always a reference to `Identity.users.user_id`. The separate `recipient_type` field has been removed as it is no longer needed; the recipient's role is available from the JWT context.

---

## 8.2 notification_preferences

Stores per-user notification delivery preferences. Allows users to control which channels they receive notifications through.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| preference_id | UUID | Primary Key | Unique preference identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| user_id | UUID | NOT NULL, UNIQUE | User identifier (cross-service ref to Identity Service) |
| email_enabled | BOOLEAN | DEFAULT TRUE | Whether email notifications are enabled |
| in_app_enabled | BOOLEAN | DEFAULT TRUE | Whether in-app notifications are enabled |
| sms_enabled | BOOLEAN | DEFAULT FALSE | Whether SMS notifications are enabled |
| created_at | TIMESTAMP | NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## Entity Relationships

```
Identity User (1)
       │
       ▼
Notifications (N)

Identity User (1)
  │
  ▼
Notification Preferences (1)
```

- One user can receive multiple notifications.
- Since vendors are Identity users with `role = VENDOR`, vendor notifications also use `users.user_id` as `recipient_id`.
- Each user has exactly one notification preference record.

---

## 9. Reporting & Analytics Service Database

The Reporting & Analytics Service is responsible for generating dashboards, business reports, and Key Performance Indicators (KPIs) by consuming events from other microservices.

This service stores **aggregated metrics only**. Detailed transactional data is fetched dynamically from other microservices via REST APIs when reports are generated. This approach avoids data duplication while keeping dashboards performant through pre-aggregated KPIs.

---

### Tables

- dashboard_metrics

---

## 9.1 dashboard_metrics

Stores aggregated business metrics used for reporting dashboards.

| Attribute | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| metric_id | UUID | Primary Key | Unique metric identifier |
| organization_id | UUID | NOT NULL | Multi-tenancy organization reference |
| metric_name | VARCHAR(100) | NOT NULL, UNIQUE | Name of the KPI |
| metric_value | DECIMAL(15,2) | NOT NULL | Current metric value |
| metric_type | ENUM | NOT NULL | PROCUREMENT, VENDOR, INVENTORY, FINANCE |
| last_updated | TIMESTAMP | NOT NULL | Last update timestamp |

---

# 10. Global Database Standards

The following standards apply across **all** databases in the ProcureX system.

## 10.1 Primary Keys

- Every table shall have a UUID (v4) Primary Key.
- UUIDs are generated at the application layer before insertion.
- Primary Keys shall be immutable.

---

## 10.2 Foreign Keys

Foreign Keys shall only exist **within the same microservice database**.

Examples:
- `role_id` → `users`
- `category_id` → `products`
- `rfq_id` → `quotations`

Foreign Keys shall **never** reference tables belonging to another microservice.

---

## 10.3 Cross-Service References

Fields referencing entities in another microservice's database (e.g., `vendor_id` in `purchase_orders`) are treated as **immutable business references**, not database foreign keys. Referential integrity is enforced through service-level business logic and validation.

---

## 10.4 Unique Constraints

The following attributes shall be unique:

- `email` (users)
- `role_name`
- `category_name`
- `invoice_number`
- `requisition_number`
- `rfq_number`
- `po_number`
- `grn_number`
- `return_number`
- `contract_number`
- `(vendor_id, product_id)` in `vendor_products`

---

## 10.5 NOT NULL Constraints

Mandatory business attributes shall not allow NULL values. Examples:

- User Email
- Password
- Vendor Company Name
- Product Name
- Invoice Amount
- Purchase Order Status

---

## 10.6 Timestamp and Audit Field Standards

Every business table shall contain:

| Field | Description |
|-------|-------------|
| `created_at` | Timestamp when the record was created |
| `updated_at` | Timestamp of the last update |

Key business tables shall additionally contain:

| Field | Type | Description |
|-------|------|-------------|
| `created_by` | UUID | Cross-service reference to Identity Service `users.user_id`. Identifies who created the record. |
| `updated_by` | UUID | Cross-service reference to Identity Service `users.user_id`. Identifies who last modified the record. |

> **Standardization Rule:** `created_by` and `updated_by` are always UUIDs referencing `Identity.users.user_id`. They are not foreign keys — they are cross-service references enforced at the application layer. All tables follow this convention consistently.

---

## 10.7 Soft Delete Standard

Soft delete applies **only to master data entities** — records that represent long-lived business assets:

| Table | Service | Soft Delete Applied |
|-------|---------|--------------------|
| `vendors` | Vendor & Catalog | ✅ Yes |
| `products` | Vendor & Catalog | ✅ Yes |
| `categories` | Vendor & Catalog | ✅ Yes |
| `warehouses` | Inventory | ✅ Yes |

Soft delete is **not** applied to transactional or audit records (purchase orders, invoices, payments, GRNs, stock transactions, notifications, status history tables). These are immutable business records and should never be deleted.

### Query and Reporting Filtering Strategy
To ensure deleted master records do not appear in application queries or reporting dashboards:
1. **Query Filtering:** Microservices configure their JPA entities with Hibernate `@SQLDelete` (to intercept hard delete and set `is_deleted = true`) and `@Where(clause = "is_deleted = false")` (to automatically filter out soft-deleted records on all reads).
2. **Dashboard & Metric Exclusions:** Reporting Service query templates explicitly exclude metrics from deleted resources, ensuring active counts only calculate where `is_deleted = false`.
3. **Partial Indexing:** To maintain unique constraints on soft-deleted columns (e.g. `gst_number` or `email`), unique indexes are created with a partial condition. Example:
   ```sql
   CREATE UNIQUE INDEX idx_vendor_gst ON vendors(gst_number) WHERE is_deleted = false;
   ```
   This allows a new vendor to use a GST number if the previously registered vendor using that number has been soft-deleted.

---

## 10.8 Optimistic Locking

Optimistic locking (`version` column) is applied **only to tables that experience high-frequency concurrent updates** where the same record may be modified by multiple users or services simultaneously:

| Table | Service | Reason |
|-------|---------|--------|
| `inventory` | Inventory | Stock levels updated by GRN processing, transfers, and returns |
| `purchase_orders` | Procurement | Status transitions (APPROVED → ACCEPTED → DELIVERED) |
| `invoices` | Finance | Status transitions (PENDING → VERIFIED → APPROVED → PAID) |

Other tables (e.g., `vendors`, `contracts`, `budgets`, `warehouses`) are updated infrequently and do not require optimistic locking. Applying it universally would add unnecessary overhead.

The `version` value is auto-incremented by Hibernate `@Version` on every update. A concurrent update on a stale version throws an `OptimisticLockingFailureException`, which is handled at the service layer.

---

## 10.9 Monetary Value Precision

All monetary values across all services shall use `DECIMAL(15,2)` to represent amounts consistently. This provides support for values up to 999,999,999,999,999.99 with two decimal places for currency precision.

---

## 10.10 Multi-Tenancy Architecture standard

To support multi-tenancy dynamically, every business table across all services contains an `organization_id UUID NOT NULL` column. 
Tenant isolation is enforced at the database level:
- In shared databases (logical multi-tenancy), Spring Data JPA repositories filter all operations automatically using Spring Security's authenticated tenant context injected into Hibernate's `@TenantId` or dynamic filter clauses.
- Inter-service Feign calls pass the tenant ID via HTTP header `X-Tenant-ID`.
- Incoming RabbitMQ events include `organizationId` in their payload context.

---

## 10.11 ENUM Definitions

The following ENUMs are used across services:

| ENUM Name | Values |
|-----------|--------|
| AccountStatus | ACTIVE, INACTIVE, LOCKED |
| VendorStatus | ACTIVE, INACTIVE, SUSPENDED |
| PurchaseRequisitionStatus | CREATED, RFQ_CREATED, CLOSED |
| RFQStatus | OPEN, CLOSED, AWARDED |
| RFQVendorInvitationStatus | SENT, VIEWED, RESPONDED, DECLINED, EXPIRED |
| QuotationStatus | SUBMITTED, SELECTED, REJECTED |
| PurchaseOrderStatus | CREATED, APPROVED, ACCEPTED, DELIVERED, COMPLETED, CANCELLED |
| GRNStatus | RECEIVED, INSPECTED, COMPLETED |
| InspectionStatus | PASSED, FAILED, PARTIALLY_ACCEPTED |
| StockTransactionType | RECEIPT, TRANSFER, RETURN, ADJUSTMENT |
| ProductReturnStatus | INITIATED, RETURNED, REPLACED, CLOSED |
| InvoiceStatus | PENDING, VERIFIED, APPROVED, PAID, REJECTED |
| PaymentStatus | SUCCESS, FAILED, PENDING |
| PaymentMethod | BANK_TRANSFER, UPI, CHEQUE, NEFT, RTGS |
| BudgetStatus | ACTIVE, EXHAUSTED, CLOSED |
| ContractStatus | ACTIVE, EXPIRED, TERMINATED |
| VendorProductStatus | ACTIVE, INACTIVE |
| NotificationType | IN_APP, EMAIL |
| WarehouseStatus | ACTIVE, INACTIVE |
| MetricType | PROCUREMENT, VENDOR, INVENTORY, FINANCE |

---

# 11. Indexing Strategy

Indexes are created to improve query performance.

## Identity Service

Indexes:
- `email` (unique index)
- `role_id`
- Composite index `(organization_id, user_id)`

---

## Vendor & Catalog Service

Indexes:
- `company_name` on `vendors`
- `category_id` on `products`
- `product_name` on `products`
- Composite index `(vendor_id, product_id)` on `vendor_products` (covers both directions of the many-to-many lookup)
- `vendor_id` on `contracts`
- Composite index `(organization_id, vendor_id)`

---

## Procurement Service

Indexes:
- `requisition_number` on `purchase_requisitions`
- `rfq_number` on `rfqs`
- `po_number` on `purchase_orders`
- `vendor_id` on `purchase_orders`
- `status` on `purchase_orders` and `rfqs`
- `purchase_order_id` on `purchase_order_items`
- Composite index `(organization_id, purchase_order_id)`

---

## Inventory Service

Indexes:
- `grn_number` on `goods_receipt_notes`
- `warehouse_id` on `inventory`
- `product_id` on `inventory`
- Composite index `(inventory_id, created_at)` on `stock_transactions` (covers audit queries sorted by time)
- `product_id` on `stock_transactions`
- Composite index `(organization_id, inventory_id)`

---

## Finance Service

Indexes:
- `invoice_number` on `invoices`
- `payment_reference` on `payments`
- `status` on `invoices`
- `invoice_id` on `invoice_items`
- `fiscal_year` on `budgets`
- Composite index `(organization_id, invoice_id)`

---

## Notification Service

Indexes:
- Composite index `(recipient_id, status)` on `notifications` (covers the common query: unread notifications for a user)
- `created_at` on `notifications`

---

## Reporting & Analytics Service

Indexes:
- `metric_name` on `dashboard_metrics`
- `metric_type` on `dashboard_metrics`

---

# 12. Naming Conventions

The following naming conventions shall be followed throughout the project.

---

## Database Naming

```
procurex_identity

procurex_vendor

procurex_procurement

procurex_inventory

procurex_finance

procurex_notification

procurex_analytics
```

## Table Naming

- All table names use `snake_case` (lowercase with underscores).
- Table names are descriptive and use full words where possible.
- Abbreviations are avoided unless industry-standard (e.g., `grn` → renamed to `goods_receipt_notes`).

## Column Naming

- All column names use `snake_case`.
- Boolean columns use prefixes: `is_`, `has_`, `enable_`.
- Timestamp columns use suffixes: `_at` (e.g., `created_at`, `deleted_at`).
- Status columns use `_status` suffix where applicable.
- Cross-service reference columns use the pattern `<entity>_id` (e.g., `vendor_id`, `product_id`).

---

# 13. Future Enhancements

The following features are intentionally excluded from Version 1 but are architecturally recommended for future releases.

## 13.1 Schema Migration Strategy

All database schema changes shall be managed using **Flyway** versioned migrations. This ensures schema evolution is tracked, reproducible, and reversible.

Recommended folder structure inside each microservice:

```text
src/main/resources/db/migration/
├── V1__init_schema.sql
├── V2__add_vendor_products.sql
├── V3__add_contracts.sql
├── V4__add_budgets_and_invoice_items.sql
└── V5__add_stock_transactions.sql
```

- Each migration file is prefixed with a version number (`V1__`, `V2__`, etc.).
- Migration files are immutable once applied to a production database.
- Schema changes are never made directly — always through a new migration file.

---

## 13.2 Payment Attempts Table

For payment methods that can fail and be retried (UPI, NEFT, RTGS), a `payment_attempts` table would capture each attempt independently:

| Field | Type | Description |
|-------|------|-------------|
| attempt_id | UUID | Primary key |
| payment_id | UUID | References payments |
| attempt_number | INTEGER | Sequential attempt number |
| payment_method | ENUM | Method used in this attempt |
| attempt_status | ENUM | SUCCESS, FAILED |
| failure_reason | TEXT | Reason for failure |
| attempted_at | TIMESTAMP | Attempt timestamp |

This is recommended for Version 2 when payment gateway integration is implemented.