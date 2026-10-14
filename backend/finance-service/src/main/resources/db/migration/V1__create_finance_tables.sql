-- Departmental budgets with optimistic locking
CREATE TABLE budgets (
    budget_id        CHAR(36)      PRIMARY KEY,
    organization_id  CHAR(36)      NOT NULL,
    department_name  VARCHAR(100)  NOT NULL,
    fiscal_year      INT           NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    used_amount      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    committed_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    version          INT           NOT NULL DEFAULT 0,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_dept_year (organization_id, department_name, fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendor-submitted invoices (one per PO)
CREATE TABLE invoices (
    invoice_id        CHAR(36)      PRIMARY KEY,
    organization_id   CHAR(36)      NOT NULL,
    purchase_order_id CHAR(36)      NOT NULL,
    vendor_id         CHAR(36)      NOT NULL,
    invoice_number    VARCHAR(50)   NOT NULL UNIQUE,
    invoice_amount    DECIMAL(15,2) NOT NULL,
    status            ENUM('PENDING_VERIFICATION','VERIFIED','FLAGGED_VARIANCE','APPROVED','PAID','REJECTED')
                        NOT NULL DEFAULT 'PENDING_VERIFICATION',
    submitted_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at       TIMESTAMP     NULL,
    verified_by       CHAR(36),
    approved_at       TIMESTAMP     NULL,
    approved_by       CHAR(36),
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice line items
CREATE TABLE invoice_items (
    invoice_item_id CHAR(36)      PRIMARY KEY,
    organization_id CHAR(36)      NOT NULL,
    invoice_id      CHAR(36)      NOT NULL,
    product_id      CHAR(36)      NOT NULL,
    product_name    VARCHAR(200)  NOT NULL,
    quantity        INT           NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL,
    total_price     DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments (one per invoice)
CREATE TABLE payments (
    payment_id            CHAR(36)      PRIMARY KEY,
    organization_id       CHAR(36)      NOT NULL,
    invoice_id            CHAR(36)      NOT NULL UNIQUE,
    amount                DECIMAL(15,2) NOT NULL,
    payment_method        VARCHAR(20)   NOT NULL,
    transaction_reference VARCHAR(100),
    status                ENUM('INITIATED','PROCESSING','COMPLETED','FAILED')
                            NOT NULL DEFAULT 'INITIATED',
    initiated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at          TIMESTAMP     NULL,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice audit trail
CREATE TABLE invoice_history (
    history_id      CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    invoice_id      CHAR(36) NOT NULL,
    from_status     ENUM('PENDING_VERIFICATION','VERIFIED','FLAGGED_VARIANCE','APPROVED','PAID','REJECTED'),
    to_status       ENUM('PENDING_VERIFICATION','VERIFIED','FLAGGED_VARIANCE','APPROVED','PAID','REJECTED') NOT NULL,
    remarks         TEXT,
    changed_by      CHAR(36) NOT NULL,
    changed_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactional outbox for reliable event publishing
CREATE TABLE outbox_events (
    event_id       CHAR(36)     PRIMARY KEY,
    event_type     VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(50)  NOT NULL,
    aggregate_id   CHAR(36)     NOT NULL,
    payload        TEXT         NOT NULL,
    status         ENUM('PENDING','PUBLISHED','FAILED') NOT NULL DEFAULT 'PENDING',
    retry_count    INT          NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at   TIMESTAMP    NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
