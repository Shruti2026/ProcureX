-- Add vendor_name to invoices so the Finance UI can display a human-readable
-- company name instead of a raw UUID. Populated at submit time from the PO's
-- company_name field (denormalized for resilience — no runtime JOIN needed).
ALTER TABLE invoices
    ADD COLUMN vendor_name VARCHAR(200) NOT NULL DEFAULT '' AFTER vendor_id;
