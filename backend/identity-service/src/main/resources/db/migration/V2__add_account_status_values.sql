-- ============================================================
-- V2 - Identity Service: Extend account_status ENUM
-- Adds PENDING, REJECTED, and SUSPENDED values to support
-- the vendor approval workflow.
-- ============================================================

ALTER TABLE users
    MODIFY COLUMN account_status
        ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED', 'LOCKED')
        NOT NULL DEFAULT 'INACTIVE';
