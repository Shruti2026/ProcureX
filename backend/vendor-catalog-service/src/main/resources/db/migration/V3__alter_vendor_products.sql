-- V3: Rename unit_price -> vendor_price and add minimum_order_quantity to vendor_products
ALTER TABLE vendor_products
    CHANGE COLUMN unit_price vendor_price DECIMAL(15,2),
    ADD COLUMN minimum_order_quantity INT NOT NULL DEFAULT 1;
