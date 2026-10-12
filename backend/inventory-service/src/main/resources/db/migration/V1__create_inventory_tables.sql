CREATE TABLE warehouses (
    warehouse_id    CHAR(36)     PRIMARY KEY,
    organization_id CHAR(36)     NOT NULL,
    warehouse_name  VARCHAR(100) NOT NULL,
    location        VARCHAR(255) NOT NULL,
    capacity        INT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    inventory_id      CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    warehouse_id      CHAR(36) NOT NULL,
    product_id        CHAR(36) NOT NULL,
    quantity_on_hand  INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    version           INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    UNIQUE KEY uq_warehouse_product (warehouse_id, product_id)
);

CREATE TABLE goods_receipt_notes (
    grn_id            CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    purchase_order_id CHAR(36) NOT NULL,
    warehouse_id      CHAR(36) NOT NULL,
    grn_number        VARCHAR(30) UNIQUE NOT NULL,
    status            ENUM('PENDING_INSPECTION','INSPECTED','CLOSED') NOT NULL DEFAULT 'PENDING_INSPECTION',
    received_by       CHAR(36) NOT NULL,
    received_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE TABLE grn_items (
    grn_item_id       CHAR(36) PRIMARY KEY,
    organization_id   CHAR(36) NOT NULL,
    grn_id            CHAR(36) NOT NULL,
    product_id        CHAR(36) NOT NULL,
    product_name      VARCHAR(200) NOT NULL,
    quantity_ordered  INT NOT NULL,
    quantity_received INT NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(grn_id)
);

CREATE TABLE quality_inspections (
    inspection_id   CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    grn_id          CHAR(36) NOT NULL UNIQUE,
    status          ENUM('PENDING','PASSED','FAILED','PARTIAL') NOT NULL DEFAULT 'PENDING',
    inspected_by    CHAR(36),
    inspected_at    TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(grn_id)
);

CREATE TABLE inspection_items (
    inspection_item_id CHAR(36) PRIMARY KEY,
    organization_id    CHAR(36) NOT NULL,
    inspection_id      CHAR(36) NOT NULL,
    product_id         CHAR(36) NOT NULL,
    accepted_quantity  INT NOT NULL DEFAULT 0,
    rejected_quantity  INT NOT NULL DEFAULT 0,
    reason_for_rejection TEXT,
    FOREIGN KEY (inspection_id) REFERENCES quality_inspections(inspection_id)
);

CREATE TABLE stock_transactions (
    transaction_id   CHAR(36) PRIMARY KEY,
    organization_id  CHAR(36) NOT NULL,
    product_id       CHAR(36) NOT NULL,
    warehouse_id     CHAR(36) NOT NULL,
    transaction_type ENUM('INCOMING','OUTGOING','RESERVED','DAMAGED') NOT NULL,
    quantity         INT NOT NULL,
    reference_id     CHAR(36),
    reference_type   VARCHAR(20),
    remarks          TEXT,
    performed_by     CHAR(36),
    transaction_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
