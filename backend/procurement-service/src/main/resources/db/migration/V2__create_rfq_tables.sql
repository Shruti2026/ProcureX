-- V2: Create RFQ tables

CREATE TABLE rfqs (
    rfq_id           CHAR(36)     NOT NULL,
    organization_id  CHAR(36)     NOT NULL,
    requisition_id   CHAR(36)     NOT NULL,
    rfq_number       VARCHAR(20)  NOT NULL,
    issue_date       DATE         NOT NULL,
    closing_date     DATE         NOT NULL,
    status           ENUM('OPEN', 'CLOSED', 'AWARDED') NOT NULL DEFAULT 'OPEN',
    created_by       CHAR(36)     NOT NULL,
    updated_by       CHAR(36),
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    PRIMARY KEY (rfq_id),
    UNIQUE KEY uk_rfq_number (rfq_number),
    CONSTRAINT fk_rfq_requisition FOREIGN KEY (requisition_id)
        REFERENCES purchase_requisitions (requisition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rfq_vendors (
    rfq_vendor_id     CHAR(36)     NOT NULL,
    organization_id   CHAR(36)     NOT NULL,
    rfq_id            CHAR(36)     NOT NULL,
    vendor_id         CHAR(36)     NOT NULL,
    company_name      VARCHAR(150) NOT NULL DEFAULT '',
    invitation_status ENUM('SENT', 'VIEWED', 'RESPONDED', 'DECLINED', 'EXPIRED') NOT NULL DEFAULT 'SENT',
    created_at        DATETIME(6),
    updated_at        DATETIME(6),
    PRIMARY KEY (rfq_vendor_id),
    UNIQUE KEY uk_rfq_vendor (rfq_id, vendor_id),
    CONSTRAINT fk_rfq_vendor_rfq FOREIGN KEY (rfq_id)
        REFERENCES rfqs (rfq_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
