-- Add vendor_name to vendor_rating_cards so the analytics UI can display
-- a human-readable company name instead of a raw UUID.
ALTER TABLE vendor_rating_cards
    ADD COLUMN vendor_name VARCHAR(200) NOT NULL DEFAULT '' AFTER vendor_id;
