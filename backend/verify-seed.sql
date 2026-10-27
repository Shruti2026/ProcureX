SELECT 'vendors'               AS tbl, COUNT(*) AS cnt FROM procurex_vendor.vendors
UNION ALL
SELECT 'vendor_products',               COUNT(*) FROM procurex_vendor.vendor_products
UNION ALL
SELECT 'contracts',                     COUNT(*) FROM procurex_vendor.contracts
UNION ALL
SELECT 'purchase_requisitions',         COUNT(*) FROM procurex_procurement.purchase_requisitions
UNION ALL
SELECT 'rfqs',                          COUNT(*) FROM procurex_procurement.rfqs
UNION ALL
SELECT 'quotations',                    COUNT(*) FROM procurex_procurement.quotations
UNION ALL
SELECT 'purchase_orders',               COUNT(*) FROM procurex_procurement.purchase_orders
UNION ALL
SELECT 'warehouses',                    COUNT(*) FROM procurex_inventory.warehouses
UNION ALL
SELECT 'goods_receipt_notes',           COUNT(*) FROM procurex_inventory.goods_receipt_notes
UNION ALL
SELECT 'quality_inspections',           COUNT(*) FROM procurex_inventory.quality_inspections
UNION ALL
SELECT 'stock_transactions',            COUNT(*) FROM procurex_inventory.stock_transactions
UNION ALL
SELECT 'budgets',                       COUNT(*) FROM procurex_finance.budgets
UNION ALL
SELECT 'invoices',                      COUNT(*) FROM procurex_finance.invoices
UNION ALL
SELECT 'payments',                      COUNT(*) FROM procurex_finance.payments
UNION ALL
SELECT 'notification_preferences',      COUNT(*) FROM procurex_notification.notification_preferences
UNION ALL
SELECT 'notifications',                 COUNT(*) FROM procurex_notification.notifications
UNION ALL
SELECT 'vendor_rating_cards',           COUNT(*) FROM procurex_analytics.vendor_rating_cards
UNION ALL
SELECT 'audit_logs',                    COUNT(*) FROM procurex_identity.audit_logs;
