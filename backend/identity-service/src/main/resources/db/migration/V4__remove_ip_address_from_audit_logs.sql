-- ============================================================
-- V4 - Remove ip_address column from audit_logs
-- IP address tracking has been removed from the audit log
-- schema as it is not required for compliance or auditing purposes.
-- ============================================================

ALTER TABLE audit_logs DROP COLUMN ip_address;
