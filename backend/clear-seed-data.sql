-- ============================================================
-- Clear all previously seeded test data (old org_id)
-- Safe to run — only deletes rows with the old placeholder
-- org_id or hardcoded seed UUIDs.
-- ============================================================

-- procurex_identity
DELETE FROM procurex_identity.audit_logs
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- procurex_vendor
DELETE FROM procurex_vendor.vendor_products
WHERE vendor_id IN (
    'dddddddd-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000004',
    'dddddddd-0000-0000-0000-000000000005',
    'dddddddd-0000-0000-0000-000000000006'
);
DELETE FROM procurex_vendor.contracts
WHERE vendor_id IN (
    'dddddddd-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000004',
    'dddddddd-0000-0000-0000-000000000005',
    'dddddddd-0000-0000-0000-000000000006'
);
DELETE FROM procurex_vendor.vendors
WHERE vendor_id IN (
    'dddddddd-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000004',
    'dddddddd-0000-0000-0000-000000000005',
    'dddddddd-0000-0000-0000-000000000006'
);

-- procurex_procurement
DELETE FROM procurex_procurement.purchase_order_history
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.purchase_order_items
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.purchase_orders
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.quotation_items
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.quotations
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.rfq_vendors
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.rfqs
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.purchase_requisition_items
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_procurement.purchase_requisitions
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- procurex_inventory
DELETE FROM procurex_inventory.stock_transactions
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_inventory.inspection_items
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_inventory.quality_inspections
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_inventory.grn_items
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_inventory.goods_receipt_notes
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_inventory.inventory
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_inventory.warehouses
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- procurex_finance
DELETE FROM procurex_finance.payments
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_finance.invoice_history
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_finance.invoice_items
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_finance.invoices
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_finance.budgets
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- procurex_notification
DELETE FROM procurex_notification.notifications
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM procurex_notification.notification_preferences
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

-- procurex_analytics
DELETE FROM procurex_analytics.vendor_rating_cards
WHERE vendor_id IN (
    'dddddddd-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000003',
    'dddddddd-0000-0000-0000-000000000004',
    'dddddddd-0000-0000-0000-000000000005',
    'dddddddd-0000-0000-0000-000000000006'
);

SELECT 'Old seed data cleared.' AS status;
