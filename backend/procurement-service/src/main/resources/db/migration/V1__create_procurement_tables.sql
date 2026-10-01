-- V1: Create procurement tables

CREATE TABLE purchase_requisitions (
    requisition_id     CHAR(36)        NOT NULL,
    organization_id    CHAR(36)        NOT NULL,
    requisition_number VARCHAR(30)     NOT NULL,
    title              VARCHAR(150)    NOT NULL,
    description        TEXT,
    required_date      DATE,
    status             ENUM('CREATED', 'RFQ_CREATED', 'CLOSED') NOT NULL DEFAULT 'CREATED',
    created_by         CHAR(36),
    updated_by         CHAR(36),
    created_at         DATETIME(6),
    updated_at         DATETIME(6),
    PRIMARY KEY (requisition_id),
    UNIQUE KEY uk_requisition_number (requisition_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_requisition_items (
    requisition_item_id CHAR(36)     NOT NULL,
    organization_id     CHAR(36)     NOT NULL,
    requisition_id      CHAR(36)     NOT NULL,
    product_id          CHAR(36)     NOT NULL,
    product_name        VARCHAR(150) NOT NULL,
    unit_of_measure     VARCHAR(30)  NOT NULL,
    quantity            INT          NOT NULL,
    remarks             TEXT,
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    PRIMARY KEY (requisition_item_id),
    CONSTRAINT fk_item_requisition FOREIGN KEY (requisition_id)
        REFERENCES purchase_requisitions (requisition_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
