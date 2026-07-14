# ProcureX – API Design Specification

This document defines the formal API contracts for **ProcureX**. It acts as the API specification for integration between the React client dashboards, backend microservices, and external systems.

---

## 1. Introduction

### Purpose
The purpose of this document is to catalog the core endpoints that support the ProcureX business workflows, specifying request schemas, validation criteria, HTTP headers, status code mappings, and service boundaries.

### Scope
Covers the external-facing APIs exposed by the API Gateway to clients, mapping routes down to the 7 logical subdomains.

---

## 2. API Design Principles

- **Stateless REST:** All APIs are stateless. Authorization context is verified on every request using Bearer JWT tokens.
- **JSON Standard:** Payload bodies must utilize valid JSON formatting.
- **Idempotency:** HTTP methods follow RFC 7231 standards (`GET`, `PUT`, `DELETE` are idempotent; `POST` is non-idempotent).
- **Graceful Failures:** Validation errors return standard structured payloads detailing specific failing inputs.

---

## 3. API Standards

### 3.1 Base URLs
The API Gateway exposes routes grouped by domain prefix:
- Identity: `/api/auth` or `/api/users`
- Vendor & Catalog: `/api/vendors`
- Procurement: `/api/procurement`
- Inventory: `/api/inventory`
- Finance: `/api/finance`
- Notification: `/api/notifications`
- Reporting & Analytics: `/api/reports`

### 3.2 API Versioning
APIs are versioned via the URL path prefix (e.g. `/api/v1/procurement/...`). Version 1 is assumed throughout this specification.

### 3.3 Naming Conventions
- Paths utilize lowercase, plural nouns separated by hyphens (kebab-case): `/api/v1/purchase-requisitions`.
- Query parameters use camelCase: `?pageNumber=0&pageSize=20`.
- Payload properties use camelCase: `organizationId`.

### 3.4 HTTP Methods
- `GET`: Retrieve a resource or collection.
- `POST`: Create a resource or invoke a transaction.
- `PUT`: Replace or update an entire resource.
- `PATCH`: Partially update properties of a resource.
- `DELETE`: Remove a resource.

### 3.5 Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Token missing or signature invalid.
- `403 Forbidden`: Authenticated, but lacking sufficient role scope.
- `404 Not Found`: Target entity not found.
- `422 Unprocessable Entity`: Valid syntax, but violates business rules.
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Unhandled system failure.

### 3.6 Authentication
Clients authenticate by providing a bearer token in the HTTP headers:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 3.7 Authorization
Access is checked at the endpoint level using role permissions extracted from the active JWT claim scope.

### 3.8 Content Type
All payload-bearing requests and responses use:
```http
Content-Type: application/json
```

---

## 4. Common Request & Response Format

Successful mutate requests (POST/PUT/PATCH) utilize the following standard wrapper:
```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": {}
}
```

---

## 5. Error Response Format

When a request fails, the application returns a structured error object mapping the failure:
```json
{
  "timestamp": "2026-07-11T10:20:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/procurement/requisitions",
  "validationErrors": [
    {
      "field": "estimatedBudget",
      "rejectedValue": -100,
      "message": "Must be greater than 0"
    }
  ]
}
```

---

## 6. Pagination, Filtering & Sorting

Paged collection responses (`GET`) return a envelope enclosing pagination metadata:
```json
{
  "content": [],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": "createdAt,desc"
  },
  "totalElements": 150,
  "totalPages": 8,
  "last": false
}
```
Query parameters follow this structure:
- `page`: 0-indexed page index (default: `0`).
- `size`: Items count per page (default: `20`, max: `100`).
- `sort`: Fields and directions (e.g. `sort=createdAt,desc`).
- **Filters:** Extracted as query params (e.g. `?status=PENDING_APPROVAL`).
- **Search:** String queries pass via `?keyword=term`.

---

## 7. Identity Service APIs

### POST `/api/v1/auth/login`

#### Description
Authenticates user credentials and issues stateless tokens.

#### Authentication
None (Public endpoint)

#### Roles
Any unregistered visitor

#### Headers
`Content-Type: application/json`

#### Request Body
```json
{
  "username": "john.manager",
  "password": "SecurePassword123"
}
```

#### Validation Rules
- `username`: Required, cannot be blank.
- `password`: Required, cannot be blank.

#### Success Response
- **Status:** `200 OK`
- **Response Headers:** `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 900,
      "userId": "usr-8f3a",
      "roles": ["PROCUREMENT_MANAGER"],
      "organizationId": "org-9912"
    }
  }
  ```

#### Error Responses
- `400 Bad Request`: Missing inputs.
- `401 Unauthorized`: Username/Password mismatch.
- `423 Locked`: Account is locked due to excess login failures.

#### Business Rules
- Uses BCrypt hash verification.
- Stores the 7-day refresh token securely inside an HttpOnly cookie.
- Clears active token records on the database during rotation.

---

### POST `/api/v1/auth/refresh`

#### Description
Validates the HttpOnly Refresh Cookie to issue a rotated Access Token.

#### Authentication
Valid Cookie (`refreshToken`)

#### Roles
Any authenticated user

#### Request Body
None (payload read from HTTP Cookie).

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 900
    }
  }
  ```

#### Error Responses
- `401 Unauthorized`: Invalid or expired refresh token.

---

## 8. Vendor & Catalog Service APIs

### POST `/api/v1/vendors/register`

#### Description
Allows public external vendors to submit an onboarding profile application.

#### Authentication
None (Public endpoint)

#### Request Body
```json
{
  "businessName": "Apex Trading Inc",
  "taxIdentifier": "TX-998811",
  "contactEmail": "contact@apextrading.com",
  "contactPhone": "+15550199",
  "categories": ["OFFICE_SUPPLIES", "IT_HARDWARE"]
}
```

#### Validation Rules
- `businessName`: Required, max 100 characters.
- `taxIdentifier`: Required, unique pattern format.
- `contactEmail`: Required, valid email format.

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Registration application received",
    "data": {
      "vendorId": "ven-29ab",
      "status": "PENDING_APPROVAL"
    }
  }
  ```

#### Error Responses
- `400 Bad Request`: Email syntax invalid or name missing.
- `409 Conflict`: Business Name or Tax ID already exists.

#### Business Rules
- Inserts an inactive user account in Identity.
- Publishes a `VendorUserCreated` event to setup the profile mapping asynchronously.

---

## 9. Procurement Service APIs

### POST `/api/v1/procurement/requisitions`

#### Description
Allows Procurement Managers to raise a new internal Purchase Requisition.

#### Authentication
Bearer Token

#### Roles
`PROCUREMENT_MANAGER`, `ADMIN`

#### Request Body
```json
{
  "title": "Q3 Office Hardware Upgrade",
  "department": "Engineering",
  "estimatedBudget": 15000.00,
  "items": [
    {
      "productId": "prod-109a",
      "quantity": 10,
      "estimatedUnitPrice": 1500.00
    }
  ]
}
```

#### Validation Rules
- `estimatedBudget`: Required, must be greater than 0.
- `items`: Required, minimum 1 item.
- `items[].quantity`: Must be greater than or equal to 1.

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Requisition created",
    "data": {
      "requisitionId": "pr-8891",
      "status": "PENDING_APPROVAL"
    }
  }
  ```

#### Error Responses
- `400 Bad Request`: Validation failures.
- `422 Unprocessable Entity`: Product ID does not exist in master catalog.

---

### POST `/api/v1/procurement/rfqs`

#### Description
Publishes a Request for Quotation (RFQ) out to mapped vendors.

#### Authentication
Bearer Token

#### Roles
`PROCUREMENT_MANAGER`

#### Request Body
```json
{
  "requisitionId": "pr-8891",
  "closingDate": "2026-08-01T23:59:59Z",
  "invitedVendorIds": ["ven-29ab", "ven-4411"]
}
```

#### Validation Rules
- `closingDate`: Must be a future date.
- `invitedVendorIds`: Must contain at least 1 vendor ID.

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "RFQ published",
    "data": {
      "rfqId": "rfq-4410",
      "status": "PUBLISHED"
    }
  }
  ```

#### Business Rules
- Binds RFQ to specific invited vendors.
- Publishes `RFQ_CREATED` to trigger email alerts via the Notification Service.

---

### POST `/api/v1/procurement/quotations`

#### Description
Allows vendors to submit bidding quotations against an active RFQ.

#### Authentication
Bearer Token

#### Roles
`VENDOR`

#### Request Body
```json
{
  "rfqId": "rfq-4410",
  "unitPrices": [
    {
      "productId": "prod-109a",
      "offeredPrice": 1450.00
    }
  ],
  "deliveryLeadTimeDays": 5
}
```

#### Validation Rules
- `deliveryLeadTimeDays`: Must be greater than 0.

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Quotation submitted successfully",
    "data": {
      "quotationId": "qte-3312"
    }
  }
  ```

#### Error Responses
- `403 Forbidden`: Vendor is not on the invited list for this RFQ.
- `422 Unprocessable Entity`: RFQ has passed its closing date.

---

### GET `/api/v1/procurement/rfqs/{id}/comparison`

#### Description
Retrieves comparison parameters (pricing, lead times) across submitted bids.

#### Authentication
Bearer Token

#### Roles
`PROCUREMENT_MANAGER`

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "rfqId": "rfq-4410",
    "comparisons": [
      {
        "vendorId": "ven-29ab",
        "vendorName": "Apex Trading Inc",
        "totalBidAmount": 14500.00,
        "deliveryLeadTimeDays": 5,
        "vendorPerformanceRating": 4.8
      }
    ]
  }
  ```

---

### POST `/api/v1/procurement/orders/{id}/approve`

#### Description
Approves a pending Purchase Order, checking budget thresholds.

#### Authentication
Bearer Token

#### Roles
`PROCUREMENT_MANAGER`

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Purchase Order approved",
    "data": {
      "orderId": "po-9910",
      "status": "APPROVED"
    }
  }
  ```

#### Business Rules
- Checks budget availability synchronously or launches a Choreographed Saga.
- Writes to local transaction DB and updates `outbox_events` (`PO_APPROVED`).

---

## 10. Inventory Service APIs

### POST `/api/v1/inventory/grns`

#### Description
Registers a Goods Receipt Note (GRN) for received items.

#### Authentication
Bearer Token

#### Roles
`INVENTORY_MANAGER`

#### Request Body
```json
{
  "purchaseOrderId": "po-9910",
  "warehouseId": "wh-01",
  "receivedItems": [
    {
      "productId": "prod-109a",
      "quantityReceived": 10
    }
  ]
}
```

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Goods Receipt logged",
    "data": {
      "grnId": "grn-5521",
      "status": "PENDING_INSPECTION"
    }
  }
  ```

#### Business Rules
- Quantity received must not exceed approved quantities in PO.
- Emits `GRN_CREATED` to notify quality assurance teams.

---

### POST `/api/v1/inventory/inspections`

#### Description
Logs a Quality Control (QC) inspection status for received goods.

#### Authentication
Bearer Token

#### Roles
`INVENTORY_MANAGER`

#### Request Body
```json
{
  "grnId": "grn-5521",
  "inspectedItems": [
    {
      "productId": "prod-109a",
      "acceptedQuantity": 9,
      "rejectedQuantity": 1,
      "reasonForRejection": "Physical damage during transport"
    }
  ]
}
```

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Inspection results logged",
    "data": {
      "inspectionId": "qc-8812"
    }
  }
  ```

#### Business Rules
- Increments stock levels dynamically inside `stock_levels` table for accepted quantities.
- Logs immutable ledger entries to `stock_transactions`.

---

## 11. Finance Service APIs

### POST `/api/v1/finance/invoices`

#### Description
Allows vendors to upload their invoice documents for verification.

#### Authentication
Bearer Token

#### Roles
`VENDOR`

#### Request Body
```json
{
  "purchaseOrderId": "po-9910",
  "invoiceNumber": "INV-2026-001",
  "invoiceAmount": 14500.00,
  "invoiceItems": [
    {
      "productId": "prod-109a",
      "quantity": 10,
      "unitPrice": 1450.00
    }
  ]
}
```

#### Success Response
- **Status:** `201 Created`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Invoice uploaded for verification",
    "data": {
      "invoiceId": "inv-7762",
      "status": "PENDING_VERIFICATION"
    }
  }
  ```

---

### GET `/api/v1/finance/invoices/{id}/match`

#### Description
Runs three-way validation matches: Invoice parameters match both GRN accepted quantities and PO price agreements.

#### Authentication
Bearer Token

#### Roles
`FINANCE_MANAGER`, `ADMIN`

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "invoiceId": "inv-7762",
    "isMatchSuccess": true,
    "details": {
      "purchaseOrderMatches": true,
      "goodsReceiptMatches": true,
      "variancePercentage": 0.00
    }
  }
  ```

#### Business Rules
- Matches criteria: Invoice item quantities must be $\le$ accepted quantities in QC inspections.
- Price values must equal the rates defined in the Purchase Order.

---

### POST `/api/v1/finance/payments`

#### Description
Initiates disbursement for matched invoices.

#### Authentication
Bearer Token

#### Roles
`FINANCE_MANAGER`

#### Request Body
```json
{
  "invoiceId": "inv-7762",
  "paymentMethod": "ACH"
}
```

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Payment initiated",
    "data": {
      "transactionId": "txn-55110",
      "status": "INITIATED"
    }
  }
  ```

#### Business Rules
- Integrates with bank processor. Upon settlement confirmation, publishes `PAYMENT_COMPLETED` event.

---

## 12. Notification Service APIs

### PUT `/api/v1/notifications/preferences`

#### Description
Allows users to configure alert channels.

#### Authentication
Bearer Token

#### Request Body
```json
{
  "channels": {
    "email": true,
    "inApp": true
  },
  "subscribedEvents": ["RFQ_CREATED", "PO_APPROVED", "PAYMENT_COMPLETED"]
}
```

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "success": true,
    "message": "Preferences updated"
  }
  ```

---

## 13. Reporting & Analytics APIs

### GET `/api/v1/reports/spend-by-department`

#### Description
Provides aggregated departmental budget statistics.

#### Authentication
Bearer Token

#### Roles
`ADMIN`, `FINANCE_MANAGER`

#### Success Response
- **Status:** `200 OK`
- **Body:**
  ```json
  {
    "organizationId": "org-9912",
    "year": 2026,
    "departments": [
      {
        "name": "Engineering",
        "allocatedBudget": 50000.00,
        "spentBudget": 14500.00,
        "committedBudget": 2000.00
      }
    ]
  }
  ```

---

## 14. OpenAPI / Swagger Integration

- **OpenAPI 3.0 Standard:** All services define auto-generated contracts using `springdoc-openapi-starter-webmvc-ui`.
- **Exposed Endpoint:** Swagger UI is located locally at `/swagger-ui.html` or aggregated at the Gateway: `/webjars/swagger-ui/index.html`.
- **Metadata Annotation Example:**
  ```java
  @Operation(summary = "Approve PO", description = "Authorizes PO and registers Outbox Events")
  @ApiResponse(responseCode = "200", description = "Purchase Order Approved")
  @PostMapping("/orders/{id}/approve")
  ```

---

## 15. API Security Considerations

- **TLS Enforcement:** All client requests are restricted to HTTPS.
- **JWT Signature Validation:** Gateway validates signatures dynamically using cached JWK public keys to maintain stateless security downstream.
- **Rate Limiting:** Gateway enforces limits per client identity (max 100 requests/minute per authenticated user IP).
- **CORS Configuration:** Restricts cross-origin resource sharing strictly to approved dashboard domain URLs.
- **Input Sanitation:** Fields undergo JSR-380 checking at service borders, preventing scripting injections or SQL payload exploits.

---

## 16. API Versioning Strategy

- **URL Path Versioning:** Prefix version formats (`/api/v1/`) are maintained for long-term support.
- **Backwards Compatibility:** Breaking schema modifications (such as property deletions or type transformations) necessitate bumping paths to `/api/v2/`. Non-breaking additions (optional query parameter additions or extra response fields) are resolved directly within `/api/v1/`.

---

## 17. Future APIs

- **Payment Gateway Webhook:** `/api/v1/finance/webhooks/stripe` to reconcile cash transfers automatically.
- **ERP Synchronization Endpoint:** `/api/v1/sync/erp` to facilitate nightly SAP integrations.
