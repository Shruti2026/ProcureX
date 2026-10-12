-- V3: Create quotation and purchase order tables

CREATE TABLE quotations (
    quotation_id    CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    rfq_id          CHAR(36) NOT NULL,
    vendor_id       CHAR(36) NOT NULL,
    company_name    VARCHAR(150) NOT NULL,
    total_amount    DECIMAL(15,2) NOT NULL,
    delivery_days   INT NOT NULL,
    payment_terms   VARCHAR(150),
    validity_date   DATE NOT NULL,
    status          ENUM('SUBMITTED','SELECTED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    submitted_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(rfq_id),
    UNIQUE KEY uq_rfq_vendor (rfq_id, vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quotation_items (
    quotation_item_id CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    quotation_id      CHAR(36) NOT NULL,
    product_id        CHAR(36) NOT NULL,
    product_name      VARCHAR(200) NOT NULL,
    quantity          INT NOT NULL,
    unit_price        DECIMAL(12,2) NOT NULL,
    total_price       DECIMAL(15,2) NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_orders (
    purchase_order_id CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    po_number         VARCHAR(30) UNIQUE NOT NULL,
    quotation_id      CHAR(36),
    vendor_id         CHAR(36) NOT NULL,
    company_name      VARCHAR(150) NOT NULL,
    order_date        DATE NOT NULL,
    expected_delivery DATE NOT NULL,
    total_amount      DECIMAL(15,2) NOT NULL,
    status            ENUM('CREATED','APPROVED','ACCEPTED','DELIVERED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'CREATED',
    approved_by       CHAR(36),
    version           INT NOT NULL DEFAULT 0,
    created_by        CHAR(36) NOT NULL,
    updated_by        CHAR(36),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_items (
    po_item_id        CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    purchase_order_id CHAR(36) NOT NULL,
    product_id        CHAR(36) NOT NULL,
    product_name      VARCHAR(200) NOT NULL,
    quantity          INT NOT NULL,
    unit_price        DECIMAL(12,2) NOT NULL,
    total_price       DECIMAL(15,2) NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_history (
    history_id        CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    purchase_order_id CHAR(36) NOT NULL,
    from_status       ENUM('CREATED','APPROVED','ACCEPTED','DELIVERED','COMPLETED','CANCELLED'),
    to_status         ENUM('CREATED','APPROVED','ACCEPTED','DELIVERED','COMPLETED','CANCELLED') NOT NULL,
    remarks           TEXT,
    changed_by        CHAR(36) NOT NULL,
    changed_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE outbox_events (
    event_id        CHAR(36) PRIMARY KEY,
    event_type      VARCHAR(100) NOT NULL,
    aggregate_type  VARCHAR(50)  NOT NULL,
    aggregate_id    CHAR(36)     NOT NULL,
    payload         TEXT         NOT NULL,
    status          ENUM('PENDING','PUBLISHED','FAILED') NOT NULL DEFAULT 'PENDING',
    retry_count     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
