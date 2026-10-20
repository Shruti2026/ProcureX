-- ============================================================
-- V5 - Add index on audit_logs.action for efficient filtering
-- ============================================================

ALTER TABLE audit_logs ADD INDEX idx_audit_logs_action (action);
