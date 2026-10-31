-- ============================================================
-- ProcureX — Test Data Seed Script
-- ============================================================
-- PURPOSE:
--   Populate all 7 ProcureX databases with realistic test data
--   covering the full procurement lifecycle.
--
-- PRE-REQUISITES:
--   1. All services must have started at least once so Flyway
--      has applied all schema migrations (tables must exist).
--   2. Create your own user accounts via the bootstrap/register
--      APIs (passwords are BCrypt-hashed; we cannot seed them
--      directly). Then come back here and fill in the UUIDs.
--
-- HOW TO RUN:
--   mysql -u root -p < seed-test-data.sql
--   (or paste into MySQL Workbench / DBeaver and execute)
--
-- IDEMPOTENCY:
--   All INSERTs use INSERT IGNORE so re-running on a machine
--   that already has the data is safe — duplicates are skipped.
--
-- ============================================================
-- STEP 0 — USER UUIDs (pre-filled with real values)
-- ============================================================
-- These are sourced from the actual procurex_identity.users table.
-- On a new machine, re-bootstrap users first, then run:
--   SELECT user_id, email FROM procurex_identity.users;
-- and update the SET block below before running the seed.
-- ============================================================

-- ============================================================
-- Real user UUIDs — sourced from procurex_identity.users
-- Update these if you re-bootstrap on a new machine.
-- Query: SELECT user_id, email, organization_id FROM procurex_identity.users;
-- ============================================================

SET @ORG_ID          = '20e3006c-86ad-11f1-aa2e-462403e66e86';

-- Admin
SET @ADMIN_ID        = ''; -- admin@procurex.com; -- admin@procurex.com

-- Procurement Managers
SET @PM_ALICE_ID     = ''; -- sarah.procurement@procurex.com; -- sarah.procurement@procurex.com
SET @PM_BOB_ID       = ''; -- fyodor@procurex.com; -- fyodor@procurex.com
SET @PM_CAROL_ID     = ''; -- sarah.procurement@procurex.com (reused); -- sarah.procurement@procurex.com (reused)

-- Inventory Managers
SET @IM_DAN_ID       = ''; -- john.inventory@procurex.com; -- john.inventory@procurex.com
SET @IM_EVE_ID       = ''; -- john.inventory@procurex.com (reused); -- john.inventory@procurex.com (reused)

-- Finance Managers
SET @FM_FRANK_ID     = ''; -- bruce.finance@procurex.com; -- bruce.finance@procurex.com
SET @FM_GRACE_ID     = ''; -- bruce.finance@procurex.com (reused); -- bruce.finance@procurex.com (reused)

-- Vendors — all 6 real vendor users
SET @V1_USER_ID      = ''; -- sales@acmesupplier.com; -- sales@acmesupplier.com
SET @V2_USER_ID      = ''; -- query@morisakibooks.com; -- query@morisakibooks.com
SET @V3_USER_ID      = ''; -- info@penguin.com; -- info@penguin.com
SET @V4_USER_ID      = ''; -- finance@scale.com; -- finance@scale.com
SET @V5_USER_ID      = ''; -- win@aibounty.com; -- win@aibounty.com
SET @V6_USER_ID      = ''; -- learn@courses.com; -- learn@courses.com

-- Vendor catalog UUIDs (vendor_id in procurex_vendor.vendors —
-- created by the identity-service outbox → vendor-catalog-service)
SET @V1_VENDOR_ID    = 'dddddddd-0000-0000-0000-000000000001';
SET @V2_VENDOR_ID    = 'dddddddd-0000-0000-0000-000000000002';
SET @V3_VENDOR_ID    = 'dddddddd-0000-0000-0000-000000000003';
SET @V4_VENDOR_ID    = 'dddddddd-0000-0000-0000-000000000004';
SET @V5_VENDOR_ID    = 'dddddddd-0000-0000-0000-000000000005';
SET @V6_VENDOR_ID    = 'dddddddd-0000-0000-0000-000000000006';


-- ============================================================
-- DATABASE 1 — procurex_identity
-- ============================================================
USE procurex_identity;

-- ------------------------------------------------------------
-- AUDIT LOGS  (admin actions — 5 examples)
-- These represent the admin creating employees and approving
-- vendors. Auto-calculated fields (last_login, failed_login_attempts)
-- are deliberately excluded.
-- ------------------------------------------------------------
INSERT IGNORE INTO audit_logs (audit_log_id, organization_id, user_id, action, entity_name, entity_id, old_value, new_value, created_at) VALUES
    (UUID(), @ORG_ID, @ADMIN_ID, 'CREATE',  'User',   @PM_ALICE_ID, NULL,
     '{"email":"alice.morgan@procurex.com","role":"PROCUREMENT_MANAGER"}',
     '2026-10-01 09:00:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'CREATE',  'User',   @PM_BOB_ID, NULL,
     '{"email":"bob.chen@procurex.com","role":"PROCUREMENT_MANAGER"}',
     '2026-10-01 09:05:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'APPROVE', 'Vendor', @V1_USER_ID, '{"account_status":"PENDING"}',
     '{"account_status":"ACTIVE"}',
     '2026-10-02 10:00:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'APPROVE', 'Vendor', @V2_USER_ID, '{"account_status":"PENDING"}',
     '{"account_status":"ACTIVE"}',
     '2026-10-02 10:15:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'REJECT',  'Vendor', @V5_USER_ID, '{"account_status":"PENDING"}',
     '{"account_status":"REJECTED","reason":"Incomplete documentation"}',
     '2026-10-02 11:00:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'APPROVE', 'Vendor', @V3_USER_ID, '{"account_status":"PENDING"}',
     '{"account_status":"ACTIVE"}',
     '2026-10-03 09:30:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'CREATE',  'User',   @FM_FRANK_ID, NULL,
     '{"email":"frank.oliver@procurex.com","role":"FINANCE_MANAGER"}',
     '2026-10-03 10:00:00'),

    (UUID(), @ORG_ID, @ADMIN_ID, 'UPDATE',  'User',   @PM_CAROL_ID,
     '{"account_status":"INACTIVE"}', '{"account_status":"ACTIVE"}',
     '2026-10-04 08:45:00');

-- ------------------------------------------------------------
-- NOTIFICATION PREFERENCES (one per user — 13 users)
-- Seeded here in identity_db context but stored in
-- procurex_notification — see DATABASE 6 below.
-- ------------------------------------------------------------


-- ============================================================
-- DATABASE 2 — procurex_vendor
-- ============================================================
USE procurex_vendor;

-- ------------------------------------------------------------
-- VENDORS  (6 vendor profiles — 5 active, 1 pending)
-- vendor_id must match @V*_VENDOR_ID set above.
-- NOTE: When the identity-service outbox fires, it creates the
-- vendor row automatically. For manual seeding, insert directly.
-- ------------------------------------------------------------
INSERT IGNORE INTO vendors
    (vendor_id, organization_id, user_id, company_name, contact_person, email,
     phone_number, address, city, state, country, postal_code, gst_number,
     vendor_status, rating, is_deleted, created_at, updated_at)
VALUES
    (@V1_VENDOR_ID, @ORG_ID, @V1_USER_ID,
     'Acme Industrial Supplies',   'Alex Carter',  'sales@acmesupplier.com',
     '+91-9876543210', '12 MG Road',     'Bengaluru', 'Karnataka', 'India', '560001',
     'GST27AABCU9603R1ZM', 'ACTIVE', 4.50, 0, NOW(), NOW()),

    (@V2_VENDOR_ID, @ORG_ID, @V2_USER_ID,
     'MoriSaki Bookshop',          'Kenji Morino',  'query@morisakibooks.com',
     '+91-9812345678', '45 Connaught Place', 'New Delhi', 'Delhi', 'India', '110001',
     'GST07AACCM9617R1Z5', 'ACTIVE', 4.20, 0, NOW(), NOW()),

    (@V3_VENDOR_ID, @ORG_ID, @V3_USER_ID,
     'Penguin House India',         'Priya Sharma',  'info@penguin.com',
     '+91-9765432109', '78 GIDC Estate', 'Surat', 'Gujarat', 'India', '395002',
     'GST24AABCF0582R1ZP', 'ACTIVE', 3.90, 0, NOW(), NOW()),

    (@V4_VENDOR_ID, @ORG_ID, @V4_USER_ID,
     'Scalin',                      'Rohan Mehta',   'finance@scale.com',
     '+91-9654321098', '22 Industrial Area', 'Pune', 'Maharashtra', 'India', '411019',
     'GST27AABCC4589R1ZN', 'ACTIVE', 4.10, 0, NOW(), NOW()),

    (@V5_VENDOR_ID, @ORG_ID, @V5_USER_ID,
     'AI Bounty Corp',              'Vikram Singh',  'win@aibounty.com',
     '+91-9543210987', '5 Sector 17',    'Chandigarh', 'Punjab', 'India', '160017',
     'GST03AABCS7654R1ZK', 'INACTIVE', 0.00, 0, NOW(), NOW()),

    (@V6_VENDOR_ID, @ORG_ID, @V6_USER_ID,
     'Learning Academy',            'Neha Gupta',    'learn@courses.com',
     '+91-9432109876', '90 Anna Salai',  'Chennai', 'Tamil Nadu', 'India', '600002',
     'GST33AABCP1234R1ZT', 'ACTIVE', 3.70, 0, NOW(), NOW());

-- ------------------------------------------------------------
-- VENDOR ↔ PRODUCT MAPPINGS  (5+ mappings per active vendor)
-- Uses hardcoded product_ids from V2__seed_products.sql
-- ------------------------------------------------------------
INSERT IGNORE INTO vendor_products
    (vendor_product_id, vendor_id, product_id, vendor_price, lead_time_days,
     minimum_order_quantity, mapping_status, is_deleted, created_at, updated_at)
VALUES
    -- TechSupply Co. → IT Equipment & Printing
    (UUID(), @V1_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440004', 850.00,  3, 1,  'ACTIVE', 0, NOW(), NOW()),  -- USB Keyboard
    (UUID(), @V1_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440005', 450.00,  3, 1,  'ACTIVE', 0, NOW(), NOW()),  -- Optical USB Mouse
    (UUID(), @V1_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440006', 320.00,  2, 5,  'ACTIVE', 0, NOW(), NOW()),  -- HDMI Cable 1.8m
    (UUID(), @V1_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440013', 1800.00, 5, 1,  'ACTIVE', 0, NOW(), NOW()),  -- Black Toner Cartridge
    (UUID(), @V1_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440014', 2200.00, 5, 1,  'ACTIVE', 0, NOW(), NOW()),  -- Colour Ink Cartridge Set

    -- OfficeWorld → Office Supplies & Pantry
    (UUID(), @V2_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440001', 210.00,  2, 10, 'ACTIVE', 0, NOW(), NOW()),  -- A4 Copy Paper
    (UUID(), @V2_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440002', 95.00,   1, 5,  'ACTIVE', 0, NOW(), NOW()),  -- Ballpoint Pen (Blue)
    (UUID(), @V2_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440003', 45.00,   1, 10, 'ACTIVE', 0, NOW(), NOW()),  -- Sticky Notes 3x3
    (UUID(), @V2_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440015', 180.00,  3, 6,  'ACTIVE', 0, NOW(), NOW()),  -- Instant Coffee 200g
    (UUID(), @V2_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440016', 120.00,  3, 5,  'ACTIVE', 0, NOW(), NOW()),  -- Tea Bags (100 pack)

    -- FurniturePlus → Furniture
    (UUID(), @V3_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440007', 8500.00, 10, 1, 'ACTIVE', 0, NOW(), NOW()), -- Ergonomic Office Chair
    (UUID(), @V3_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440008', 12000.00, 14, 1,'ACTIVE', 0, NOW(), NOW()), -- Office Desk 120cm
    (UUID(), @V3_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440001', 230.00,  3, 10, 'ACTIVE', 0, NOW(), NOW()), -- A4 Copy Paper (also supplies stationery)
    (UUID(), @V3_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440003', 55.00,   2, 10, 'ACTIVE', 0, NOW(), NOW()), -- Sticky Notes
    (UUID(), @V3_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440015', 195.00,  4, 6,  'ACTIVE', 0, NOW(), NOW()), -- Instant Coffee

    -- CleanPro → Cleaning & Safety
    (UUID(), @V4_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440009', 165.00,  2, 12, 'ACTIVE', 0, NOW(), NOW()), -- Multi-surface Cleaner
    (UUID(), @V4_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440010', 280.00,  2, 5,  'ACTIVE', 0, NOW(), NOW()), -- Microfibre Cloth Pack
    (UUID(), @V4_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440011', 420.00,  3, 5,  'ACTIVE', 0, NOW(), NOW()), -- Disposable Face Mask
    (UUID(), @V4_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440012', 380.00,  3, 5,  'ACTIVE', 0, NOW(), NOW()), -- Nitrile Gloves
    (UUID(), @V4_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440001', 225.00,  3, 10, 'ACTIVE', 0, NOW(), NOW()), -- A4 Copy Paper

    -- PrintMaster → Printing & Imaging
    (UUID(), @V6_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440013', 1950.00, 4, 1,  'ACTIVE', 0, NOW(), NOW()), -- Black Toner Cartridge
    (UUID(), @V6_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440014', 2400.00, 4, 1,  'ACTIVE', 0, NOW(), NOW()), -- Colour Ink Cartridge Set
    (UUID(), @V6_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440004', 920.00,  4, 1,  'ACTIVE', 0, NOW(), NOW()), -- USB Keyboard
    (UUID(), @V6_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440005', 480.00,  4, 1,  'ACTIVE', 0, NOW(), NOW()), -- Optical USB Mouse
    (UUID(), @V6_VENDOR_ID, '650e8400-e29b-41d4-a716-446655440001', 200.00,  2, 10, 'ACTIVE', 0, NOW(), NOW()); -- A4 Copy Paper

-- ------------------------------------------------------------
-- CONTRACTS  (one active contract per approved vendor)
-- ------------------------------------------------------------
INSERT IGNORE INTO contracts
    (contract_id, vendor_id, organization_id, contract_number, start_date, end_date,
     total_value, contract_status, notes, is_deleted, created_at, updated_at)
VALUES
    (UUID(), @V1_VENDOR_ID, @ORG_ID, 'CON-2026-001', '2026-01-01', '2026-12-31',
     500000.00, 'ACTIVE', 'Annual IT equipment and peripherals supply contract', 0, NOW(), NOW()),

    (UUID(), @V2_VENDOR_ID, @ORG_ID, 'CON-2026-002', '2026-01-01', '2026-12-31',
     200000.00, 'ACTIVE', 'Annual office supplies and pantry items contract',    0, NOW(), NOW()),

    (UUID(), @V3_VENDOR_ID, @ORG_ID, 'CON-2026-003', '2026-04-01', '2027-03-31',
     800000.00, 'ACTIVE', 'Office furniture procurement for new floor fit-out',  0, NOW(), NOW()),

    (UUID(), @V4_VENDOR_ID, @ORG_ID, 'CON-2026-004', '2026-01-01', '2026-12-31',
     150000.00, 'ACTIVE', 'Cleaning and safety supplies recurring contract',     0, NOW(), NOW()),

    (UUID(), @V6_VENDOR_ID, @ORG_ID, 'CON-2026-005', '2026-06-01', '2027-05-31',
     300000.00, 'ACTIVE', 'Printing and imaging consumables annual contract',    0, NOW(), NOW());


-- ============================================================
-- DATABASE 3 — procurex_procurement
-- ============================================================
USE procurex_procurement;

-- ============================================================
-- PURCHASE REQUISITIONS  (5 PRs — various statuses)
-- ============================================================

-- PR-1: Approved and converted to RFQ (CLOSED status)
INSERT IGNORE INTO purchase_requisitions
    (requisition_id, organization_id, requisition_number, title, description,
     required_date, status, created_by, updated_by, created_at, updated_at)
VALUES
    ('ee000001-0000-0000-0000-000000000001', @ORG_ID,
     'PR-2026-0001', 'IT Equipment for New Hires',
     'Keyboards, mice and HDMI cables for 10 new engineers joining in November',
     '2026-11-15', 'RFQ_CREATED', @PM_ALICE_ID, @PM_ALICE_ID,
     '2026-10-05 09:00:00', '2026-10-06 10:00:00');

INSERT IGNORE INTO purchase_requisition_items
    (requisition_item_id, organization_id, requisition_id, product_id, product_name,
     unit_of_measure, quantity, remarks, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000001',
     '650e8400-e29b-41d4-a716-446655440004', 'USB Keyboard', 'Unit', 10,
     'Standard QWERTY layout preferred', NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000001',
     '650e8400-e29b-41d4-a716-446655440005', 'Optical USB Mouse', 'Unit', 10,
     NULL, NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000001',
     '650e8400-e29b-41d4-a716-446655440006', 'HDMI Cable 1.8m', 'Unit', 10,
     'For dual-monitor setup', NOW(), NOW());

-- PR-2: Open — awaiting RFQ creation
INSERT IGNORE INTO purchase_requisitions
    (requisition_id, organization_id, requisition_number, title, description,
     required_date, status, created_by, updated_by, created_at, updated_at)
VALUES
    ('ee000001-0000-0000-0000-000000000002', @ORG_ID,
     'PR-2026-0002', 'Office Furniture — 3rd Floor Expansion',
     'Desks and ergonomic chairs for 20 new workstations on the 3rd floor',
     '2026-12-01', 'CREATED', @PM_BOB_ID, @PM_BOB_ID,
     '2026-10-10 10:30:00', '2026-10-10 10:30:00');

INSERT IGNORE INTO purchase_requisition_items
    (requisition_item_id, organization_id, requisition_id, product_id, product_name,
     unit_of_measure, quantity, remarks, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000002',
     '650e8400-e29b-41d4-a716-446655440007', 'Ergonomic Office Chair', 'Unit', 20,
     'Lumbar support mandatory', NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000002',
     '650e8400-e29b-41d4-a716-446655440008', 'Office Desk 120cm', 'Unit', 20,
     'Height-adjustable preferred', NOW(), NOW());

-- PR-3: Quarterly office supplies replenishment
INSERT IGNORE INTO purchase_requisitions
    (requisition_id, organization_id, requisition_number, title, description,
     required_date, status, created_by, updated_by, created_at, updated_at)
VALUES
    ('ee000001-0000-0000-0000-000000000003', @ORG_ID,
     'PR-2026-0003', 'Q4 Office Supplies Replenishment',
     'Paper, pens, sticky notes and pantry items for Q4',
     '2026-11-01', 'RFQ_CREATED', @PM_CAROL_ID, @PM_CAROL_ID,
     '2026-10-08 11:00:00', '2026-10-09 09:00:00');

INSERT IGNORE INTO purchase_requisition_items
    (requisition_item_id, organization_id, requisition_id, product_id, product_name,
     unit_of_measure, quantity, remarks, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000003',
     '650e8400-e29b-41d4-a716-446655440001', 'A4 Copy Paper', 'Ream', 100,
     '80 GSM only', NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000003',
     '650e8400-e29b-41d4-a716-446655440002', 'Ballpoint Pen (Blue)', 'Box', 10,
     NULL, NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000003',
     '650e8400-e29b-41d4-a716-446655440016', 'Tea Bags (100 pack)', 'Pack', 20,
     NULL, NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000003',
     '650e8400-e29b-41d4-a716-446655440015', 'Instant Coffee 200g', 'Jar', 12,
     NULL, NOW(), NOW());

-- PR-4: Cleaning supplies (open)
INSERT IGNORE INTO purchase_requisitions
    (requisition_id, organization_id, requisition_number, title, description,
     required_date, status, created_by, updated_by, created_at, updated_at)
VALUES
    ('ee000001-0000-0000-0000-000000000004', @ORG_ID,
     'PR-2026-0004', 'Monthly Cleaning & Safety Supplies',
     'Routine restock of cleaning products and PPE for facilities team',
     '2026-10-31', 'CREATED', @PM_ALICE_ID, @PM_ALICE_ID,
     '2026-10-15 08:30:00', '2026-10-15 08:30:00');

INSERT IGNORE INTO purchase_requisition_items
    (requisition_item_id, organization_id, requisition_id, product_id, product_name,
     unit_of_measure, quantity, remarks, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000004',
     '650e8400-e29b-41d4-a716-446655440009', 'Multi-surface Cleaner 1L', 'Bottle', 48,
     NULL, NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000004',
     '650e8400-e29b-41d4-a716-446655440010', 'Microfibre Cloth Pack', 'Pack', 10,
     NULL, NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000004',
     '650e8400-e29b-41d4-a716-446655440011', 'Disposable Face Mask (50 pack)', 'Box', 20,
     NULL, NOW(), NOW());

-- PR-5: Printer consumables (RFQ_CREATED)
INSERT IGNORE INTO purchase_requisitions
    (requisition_id, organization_id, requisition_number, title, description,
     required_date, status, created_by, updated_by, created_at, updated_at)
VALUES
    ('ee000001-0000-0000-0000-000000000005', @ORG_ID,
     'PR-2026-0005', 'Printer Consumables Restock',
     'Toner and ink cartridges running critically low across all office printers',
     '2026-11-05', 'RFQ_CREATED', @PM_BOB_ID, @PM_BOB_ID,
     '2026-10-12 14:00:00', '2026-10-13 09:00:00');

INSERT IGNORE INTO purchase_requisition_items
    (requisition_item_id, organization_id, requisition_id, product_id, product_name,
     unit_of_measure, quantity, remarks, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000005',
     '650e8400-e29b-41d4-a716-446655440013', 'Black Toner Cartridge', 'Unit', 8,
     'High-yield cartridges only', NOW(), NOW()),
    (UUID(), @ORG_ID, 'ee000001-0000-0000-0000-000000000005',
     '650e8400-e29b-41d4-a716-446655440014', 'Colour Ink Cartridge Set', 'Set', 4,
     NULL, NOW(), NOW());

-- ============================================================
-- RFQs  (one per PR-1, PR-3 and PR-5 which are in RFQ_CREATED)
-- ============================================================
INSERT IGNORE INTO rfqs
    (rfq_id, organization_id, requisition_id, rfq_number, issue_date, closing_date,
     status, created_by, updated_by, created_at, updated_at)
VALUES
    -- RFQ-1 for PR-1 (IT equipment) — AWARDED
    ('ff000001-0000-0000-0000-000000000001', @ORG_ID,
     'ee000001-0000-0000-0000-000000000001',
     'RFQ-2026-0001', '2026-10-06', '2026-10-13',
     'AWARDED', @PM_ALICE_ID, @PM_ALICE_ID,
     '2026-10-06 10:00:00', '2026-10-14 11:00:00'),

    -- RFQ-2 for PR-3 (office supplies) — AWARDED
    ('ff000001-0000-0000-0000-000000000002', @ORG_ID,
     'ee000001-0000-0000-0000-000000000003',
     'RFQ-2026-0002', '2026-10-09', '2026-10-16',
     'AWARDED', @PM_CAROL_ID, @PM_CAROL_ID,
     '2026-10-09 09:00:00', '2026-10-17 09:00:00'),

    -- RFQ-3 for PR-5 (printer consumables) — OPEN
    ('ff000001-0000-0000-0000-000000000003', @ORG_ID,
     'ee000001-0000-0000-0000-000000000005',
     'RFQ-2026-0003', '2026-10-13', '2026-10-27',
     'OPEN', @PM_BOB_ID, @PM_BOB_ID,
     '2026-10-13 09:00:00', '2026-10-13 09:00:00');

-- ------------------------------------------------------------
-- RFQ VENDOR INVITATIONS
-- ------------------------------------------------------------
INSERT IGNORE INTO rfq_vendors
    (rfq_vendor_id, organization_id, rfq_id, vendor_id, company_name,
     invitation_status, created_at, updated_at)
VALUES
    -- RFQ-1 invites Acme Industrial and Learning Academy
    (UUID(), @ORG_ID, 'ff000001-0000-0000-0000-000000000001', @V1_VENDOR_ID, 'Acme Industrial Supplies',
     'RESPONDED', '2026-10-06 10:05:00', '2026-10-10 12:00:00'),
    (UUID(), @ORG_ID, 'ff000001-0000-0000-0000-000000000001', @V6_VENDOR_ID, 'Learning Academy',
     'RESPONDED', '2026-10-06 10:05:00', '2026-10-11 09:00:00'),

    -- RFQ-2 invites MoriSaki Bookshop and Penguin House
    (UUID(), @ORG_ID, 'ff000001-0000-0000-0000-000000000002', @V2_VENDOR_ID, 'MoriSaki Bookshop',
     'RESPONDED', '2026-10-09 09:10:00', '2026-10-12 14:00:00'),
    (UUID(), @ORG_ID, 'ff000001-0000-0000-0000-000000000002', @V3_VENDOR_ID, 'Penguin House India',
     'DECLINED',  '2026-10-09 09:10:00', '2026-10-10 08:00:00'),

    -- RFQ-3 invites Acme Industrial and Learning Academy
    (UUID(), @ORG_ID, 'ff000001-0000-0000-0000-000000000003', @V1_VENDOR_ID, 'Acme Industrial Supplies',
     'VIEWED',    '2026-10-13 09:10:00', '2026-10-14 10:00:00'),
    (UUID(), @ORG_ID, 'ff000001-0000-0000-0000-000000000003', @V6_VENDOR_ID, 'Learning Academy',
     'SENT',      '2026-10-13 09:10:00', '2026-10-13 09:10:00');

-- ============================================================
-- QUOTATIONS  (vendors submit quotes against awarded RFQs)
-- ============================================================

-- Quotation IDs (referenced later in POs)
SET @Q1_ID = 'aa111111-0000-0000-0000-000000000001'; -- TechSupply for RFQ-1 (SELECTED)
SET @Q2_ID = 'aa111111-0000-0000-0000-000000000002'; -- PrintMaster for RFQ-1 (REJECTED)
SET @Q3_ID = 'aa111111-0000-0000-0000-000000000003'; -- OfficeWorld for RFQ-2 (SELECTED)

INSERT IGNORE INTO quotations
    (quotation_id, organization_id, rfq_id, vendor_id, company_name,
     total_amount, delivery_days, payment_terms, validity_date, status,
     submitted_at, updated_at)
VALUES
    (@Q1_ID, @ORG_ID, 'ff000001-0000-0000-0000-000000000001', @V1_VENDOR_ID,
     'Acme Industrial Supplies',
     16200.00, 5, 'Net 30',     '2026-10-20', 'SELECTED',
     '2026-10-10 12:00:00', '2026-10-14 11:00:00'),

    (@Q2_ID, @ORG_ID, 'ff000001-0000-0000-0000-000000000001', @V6_VENDOR_ID,
     'Learning Academy',
     17850.00, 7, 'Net 45',     '2026-10-20', 'REJECTED',
     '2026-10-11 09:00:00', '2026-10-14 11:00:00'),

    (@Q3_ID, @ORG_ID, 'ff000001-0000-0000-0000-000000000002', @V2_VENDOR_ID,
     'MoriSaki Bookshop',
     32800.00, 3, 'Immediate',  '2026-10-23', 'SELECTED',
     '2026-10-12 14:00:00', '2026-10-17 09:00:00');

-- Quotation items for Q1 (TechSupply — IT Equipment)
INSERT IGNORE INTO quotation_items
    (quotation_item_id, organization_id, quotation_id, product_id, product_name,
     quantity, unit_price, total_price, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, @Q1_ID, '650e8400-e29b-41d4-a716-446655440004', 'USB Keyboard',
     10, 850.00,  8500.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q1_ID, '650e8400-e29b-41d4-a716-446655440005', 'Optical USB Mouse',
     10, 450.00,  4500.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q1_ID, '650e8400-e29b-41d4-a716-446655440006', 'HDMI Cable 1.8m',
     10, 320.00,  3200.00, NOW(), NOW());

-- Quotation items for Q2 (PrintMaster — IT Equipment, higher price)
INSERT IGNORE INTO quotation_items
    (quotation_item_id, organization_id, quotation_id, product_id, product_name,
     quantity, unit_price, total_price, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, @Q2_ID, '650e8400-e29b-41d4-a716-446655440004', 'USB Keyboard',
     10, 920.00,  9200.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q2_ID, '650e8400-e29b-41d4-a716-446655440005', 'Optical USB Mouse',
     10, 480.00,  4800.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q2_ID, '650e8400-e29b-41d4-a716-446655440006', 'HDMI Cable 1.8m',
     10, 385.00,  3850.00, NOW(), NOW());

-- Quotation items for Q3 (OfficeWorld — Office Supplies)
INSERT IGNORE INTO quotation_items
    (quotation_item_id, organization_id, quotation_id, product_id, product_name,
     quantity, unit_price, total_price, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, @Q3_ID, '650e8400-e29b-41d4-a716-446655440001', 'A4 Copy Paper',
     100, 210.00, 21000.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q3_ID, '650e8400-e29b-41d4-a716-446655440002', 'Ballpoint Pen (Blue)',
     10,   95.00,   950.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q3_ID, '650e8400-e29b-41d4-a716-446655440016', 'Tea Bags (100 pack)',
     20,  120.00,  2400.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @Q3_ID, '650e8400-e29b-41d4-a716-446655440015', 'Instant Coffee 200g',
     12,  195.00,  2340.00, NOW(), NOW());

-- ============================================================
-- PURCHASE ORDERS  (5 POs — various stages of lifecycle)
-- ============================================================

SET @PO1_ID = 'bb222222-0000-0000-0000-000000000001'; -- COMPLETED (full lifecycle done)
SET @PO2_ID = 'bb222222-0000-0000-0000-000000000002'; -- DELIVERED  (awaiting finance)
SET @PO3_ID = 'bb222222-0000-0000-0000-000000000003'; -- APPROVED   (delivery pending)
SET @PO4_ID = 'bb222222-0000-0000-0000-000000000004'; -- ACCEPTED   (in transit)
SET @PO5_ID = 'bb222222-0000-0000-0000-000000000005'; -- CREATED    (just raised)

INSERT IGNORE INTO purchase_orders
    (purchase_order_id, organization_id, po_number, quotation_id, vendor_id,
     company_name, order_date, expected_delivery, total_amount, status,
     approved_by, version, created_by, updated_by, created_at, updated_at)
VALUES
    (@PO1_ID, @ORG_ID, 'PO-2026-00001', @Q1_ID, @V1_VENDOR_ID,
     'Acme Industrial Supplies', '2026-10-14', '2026-10-19', 16200.00, 'COMPLETED',
     @PM_ALICE_ID, 5, @PM_ALICE_ID, @PM_ALICE_ID, '2026-10-14 11:00:00', '2026-10-22 16:00:00'),

    (@PO2_ID, @ORG_ID, 'PO-2026-00002', @Q3_ID, @V2_VENDOR_ID,
     'MoriSaki Bookshop', '2026-10-17', '2026-10-20', 32800.00, 'DELIVERED',
     @PM_CAROL_ID, 4, @PM_CAROL_ID, @PM_CAROL_ID, '2026-10-17 09:00:00', '2026-10-21 12:00:00'),

    (@PO3_ID, @ORG_ID, 'PO-2026-00003', NULL, @V4_VENDOR_ID,
     'Scalin', '2026-10-16', '2026-10-23', 14340.00, 'APPROVED',
     @PM_ALICE_ID, 2, @PM_ALICE_ID, @PM_ALICE_ID, '2026-10-15 14:00:00', '2026-10-16 10:00:00'),

    (@PO4_ID, @ORG_ID, 'PO-2026-00004', NULL, @V3_VENDOR_ID,
     'Penguin House India', '2026-10-18', '2026-11-01', 410000.00, 'ACCEPTED',
     @PM_BOB_ID, 3, @PM_BOB_ID, @PM_BOB_ID, '2026-10-18 10:00:00', '2026-10-19 09:00:00'),

    (@PO5_ID, @ORG_ID, 'PO-2026-00005', NULL, @V6_VENDOR_ID,
     'Learning Academy', '2026-10-20', '2026-10-27', 22800.00, 'CREATED',
     NULL, 1, @PM_BOB_ID, @PM_BOB_ID, '2026-10-20 11:00:00', '2026-10-20 11:00:00');

-- PO line items
INSERT IGNORE INTO purchase_order_items
    (po_item_id, organization_id, purchase_order_id, product_id, product_name,
     quantity, unit_price, total_price, created_at, updated_at)
VALUES
    -- PO1 — IT Equipment (TechSupply)
    (UUID(), @ORG_ID, @PO1_ID, '650e8400-e29b-41d4-a716-446655440004', 'USB Keyboard',
     10, 850.00,  8500.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO1_ID, '650e8400-e29b-41d4-a716-446655440005', 'Optical USB Mouse',
     10, 450.00,  4500.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO1_ID, '650e8400-e29b-41d4-a716-446655440006', 'HDMI Cable 1.8m',
     10, 320.00,  3200.00, NOW(), NOW()),

    -- PO2 — Office Supplies (OfficeWorld)
    (UUID(), @ORG_ID, @PO2_ID, '650e8400-e29b-41d4-a716-446655440001', 'A4 Copy Paper',
     100, 210.00, 21000.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO2_ID, '650e8400-e29b-41d4-a716-446655440002', 'Ballpoint Pen (Blue)',
     10,   95.00,   950.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO2_ID, '650e8400-e29b-41d4-a716-446655440016', 'Tea Bags (100 pack)',
     20,  120.00,  2400.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO2_ID, '650e8400-e29b-41d4-a716-446655440015', 'Instant Coffee 200g',
     12,  195.00,  2340.00, NOW(), NOW()),

    -- PO3 — Cleaning Supplies (CleanPro)
    (UUID(), @ORG_ID, @PO3_ID, '650e8400-e29b-41d4-a716-446655440009', 'Multi-surface Cleaner 1L',
     48, 165.00,   7920.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO3_ID, '650e8400-e29b-41d4-a716-446655440010', 'Microfibre Cloth Pack',
     10, 280.00,   2800.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO3_ID, '650e8400-e29b-41d4-a716-446655440011', 'Disposable Face Mask (50 pack)',
     20, 420.00,   8400.00, NOW(), NOW()),

    -- PO4 — Furniture (FurniturePlus)
    (UUID(), @ORG_ID, @PO4_ID, '650e8400-e29b-41d4-a716-446655440007', 'Ergonomic Office Chair',
     20,  8500.00, 170000.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO4_ID, '650e8400-e29b-41d4-a716-446655440008', 'Office Desk 120cm',
     20, 12000.00, 240000.00, NOW(), NOW()),

    -- PO5 — Printer Consumables (PrintMaster)
    (UUID(), @ORG_ID, @PO5_ID, '650e8400-e29b-41d4-a716-446655440013', 'Black Toner Cartridge',
     8,  1950.00,  15600.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @PO5_ID, '650e8400-e29b-41d4-a716-446655440014', 'Colour Ink Cartridge Set',
     3,  2400.00,   7200.00, NOW(), NOW());

-- PO status history
INSERT IGNORE INTO purchase_order_history
    (history_id, organization_id, purchase_order_id,
     from_status, to_status, remarks, changed_by, changed_at)
VALUES
    -- PO1 full lifecycle
    (UUID(), @ORG_ID, @PO1_ID, NULL,        'CREATED',   'PO raised from winning quotation',  @PM_ALICE_ID, '2026-10-14 11:00:00'),
    (UUID(), @ORG_ID, @PO1_ID, 'CREATED',   'APPROVED',  'Approved by procurement manager',   @PM_ALICE_ID, '2026-10-14 15:00:00'),
    (UUID(), @ORG_ID, @PO1_ID, 'APPROVED',  'ACCEPTED',  'Vendor confirmed order',            @V1_USER_ID,  '2026-10-15 09:00:00'),
    (UUID(), @ORG_ID, @PO1_ID, 'ACCEPTED',  'DELIVERED', 'Goods delivered to warehouse',      @IM_DAN_ID,   '2026-10-19 14:00:00'),
    (UUID(), @ORG_ID, @PO1_ID, 'DELIVERED', 'COMPLETED', 'Inspection passed and invoice paid', @FM_FRANK_ID,'2026-10-22 16:00:00'),

    -- PO2 (DELIVERED)
    (UUID(), @ORG_ID, @PO2_ID, NULL,        'CREATED',   'PO raised from winning quotation',  @PM_CAROL_ID, '2026-10-17 09:00:00'),
    (UUID(), @ORG_ID, @PO2_ID, 'CREATED',   'APPROVED',  'Approved by procurement manager',   @PM_CAROL_ID, '2026-10-17 11:00:00'),
    (UUID(), @ORG_ID, @PO2_ID, 'APPROVED',  'ACCEPTED',  'Vendor acknowledged',               @V2_USER_ID,  '2026-10-17 13:00:00'),
    (UUID(), @ORG_ID, @PO2_ID, 'ACCEPTED',  'DELIVERED', 'Delivery confirmed by warehouse',   @IM_EVE_ID,   '2026-10-21 12:00:00'),

    -- PO3 (APPROVED)
    (UUID(), @ORG_ID, @PO3_ID, NULL,        'CREATED',   'PO raised for cleaning supplies',   @PM_ALICE_ID, '2026-10-15 14:00:00'),
    (UUID(), @ORG_ID, @PO3_ID, 'CREATED',   'APPROVED',  'Approved by procurement manager',   @PM_ALICE_ID, '2026-10-16 10:00:00'),

    -- PO4 (ACCEPTED)
    (UUID(), @ORG_ID, @PO4_ID, NULL,        'CREATED',   'PO raised for 3rd floor fit-out',   @PM_BOB_ID,   '2026-10-18 10:00:00'),
    (UUID(), @ORG_ID, @PO4_ID, 'CREATED',   'APPROVED',  'Approved by procurement manager',   @PM_BOB_ID,   '2026-10-18 12:00:00'),
    (UUID(), @ORG_ID, @PO4_ID, 'APPROVED',  'ACCEPTED',  'Penguin House India confirmed order',@V3_USER_ID,  '2026-10-19 09:00:00'),

    -- PO5 (CREATED)
    (UUID(), @ORG_ID, @PO5_ID, NULL,        'CREATED',   'PO raised for printer consumables', @PM_BOB_ID,   '2026-10-20 11:00:00');


-- ============================================================
-- DATABASE 4 — inventory_db
-- ============================================================
USE procurex_inventory;

-- ------------------------------------------------------------
-- WAREHOUSES  (2 warehouses)
-- ------------------------------------------------------------
SET @WH1_ID = 'cc333333-0000-0000-0000-000000000001';  -- Main warehouse
SET @WH2_ID = 'cc333333-0000-0000-0000-000000000002';  -- Secondary warehouse

INSERT IGNORE INTO warehouses
    (warehouse_id, organization_id, warehouse_name, location, capacity, created_at, updated_at)
VALUES
    (@WH1_ID, @ORG_ID, 'Main Store',       'Ground Floor, Block A, Bengaluru Campus', 5000, NOW(), NOW()),
    (@WH2_ID, @ORG_ID, 'Secondary Store',  '2nd Floor, Block B, Bengaluru Campus',    2000, NOW(), NOW());

-- ------------------------------------------------------------
-- INVENTORY  (pre-existing stock levels)
-- ------------------------------------------------------------
INSERT IGNORE INTO inventory
    (inventory_id, organization_id, warehouse_id, product_id,
     quantity_on_hand, quantity_reserved, version, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440001', 200, 0,  0, NOW(), NOW()),  -- A4 Paper
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440002',  45, 0,  0, NOW(), NOW()),  -- Pens
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440003',  60, 0,  0, NOW(), NOW()),  -- Sticky Notes
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440004',  15, 0,  0, NOW(), NOW()),  -- Keyboards
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440005',  12, 0,  0, NOW(), NOW()),  -- Mice
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440006',  18, 0,  0, NOW(), NOW()),  -- HDMI Cables
    (UUID(), @ORG_ID, @WH2_ID, '650e8400-e29b-41d4-a716-446655440007',  30, 0,  0, NOW(), NOW()),  -- Chairs
    (UUID(), @ORG_ID, @WH2_ID, '650e8400-e29b-41d4-a716-446655440008',  25, 0,  0, NOW(), NOW()),  -- Desks
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440013',   3, 0,  0, NOW(), NOW()),  -- Black Toner
    (UUID(), @ORG_ID, @WH1_ID, '650e8400-e29b-41d4-a716-446655440014',   2, 0,  0, NOW(), NOW()); -- Colour Ink

-- ------------------------------------------------------------
-- GRNs  (for PO1 which is COMPLETED and PO2 which is DELIVERED)
-- ------------------------------------------------------------
SET @GRN1_ID = 'dd444444-0000-0000-0000-000000000001';  -- for PO1 (CLOSED after inspection)
SET @GRN2_ID = 'dd444444-0000-0000-0000-000000000002';  -- for PO2 (INSPECTED)

INSERT IGNORE INTO goods_receipt_notes
    (grn_id, organization_id, purchase_order_id, warehouse_id, grn_number,
     status, received_by, received_at, created_at, updated_at)
VALUES
    (@GRN1_ID, @ORG_ID, @PO1_ID, @WH1_ID, 'GRN-2026-00001',
     'CLOSED', @IM_DAN_ID, '2026-10-19 14:00:00', '2026-10-19 14:00:00', '2026-10-20 10:00:00'),

    (@GRN2_ID, @ORG_ID, @PO2_ID, @WH1_ID, 'GRN-2026-00002',
     'INSPECTED', @IM_EVE_ID, '2026-10-21 12:00:00', '2026-10-21 12:00:00', '2026-10-22 09:00:00');

-- GRN items
INSERT IGNORE INTO grn_items
    (grn_item_id, organization_id, grn_id, product_id, product_name,
     quantity_ordered, quantity_received, created_at, updated_at)
VALUES
    -- GRN1 (PO1 — IT Equipment)
    (UUID(), @ORG_ID, @GRN1_ID, '650e8400-e29b-41d4-a716-446655440004', 'USB Keyboard',        10, 10, NOW(), NOW()),
    (UUID(), @ORG_ID, @GRN1_ID, '650e8400-e29b-41d4-a716-446655440005', 'Optical USB Mouse',   10, 10, NOW(), NOW()),
    (UUID(), @ORG_ID, @GRN1_ID, '650e8400-e29b-41d4-a716-446655440006', 'HDMI Cable 1.8m',     10,  9, NOW(), NOW()),  -- 1 short

    -- GRN2 (PO2 — Office Supplies)
    (UUID(), @ORG_ID, @GRN2_ID, '650e8400-e29b-41d4-a716-446655440001', 'A4 Copy Paper',      100, 100, NOW(), NOW()),
    (UUID(), @ORG_ID, @GRN2_ID, '650e8400-e29b-41d4-a716-446655440002', 'Ballpoint Pen (Blue)', 10,  10, NOW(), NOW()),
    (UUID(), @ORG_ID, @GRN2_ID, '650e8400-e29b-41d4-a716-446655440016', 'Tea Bags (100 pack)',  20,  20, NOW(), NOW()),
    (UUID(), @ORG_ID, @GRN2_ID, '650e8400-e29b-41d4-a716-446655440015', 'Instant Coffee 200g',  12,  12, NOW(), NOW());

-- ------------------------------------------------------------
-- QUALITY INSPECTIONS
-- ------------------------------------------------------------
SET @INSP1_ID = 'ee555555-0000-0000-0000-000000000001';  -- for GRN1 (PASSED)
SET @INSP2_ID = 'ee555555-0000-0000-0000-000000000002';  -- for GRN2 (PARTIAL)

INSERT IGNORE INTO quality_inspections
    (inspection_id, organization_id, grn_id, status,
     inspected_by, inspected_at, created_at, updated_at)
VALUES
    (@INSP1_ID, @ORG_ID, @GRN1_ID, 'PASSED',
     @IM_DAN_ID, '2026-10-20 10:00:00', '2026-10-20 09:30:00', '2026-10-20 10:00:00'),

    (@INSP2_ID, @ORG_ID, @GRN2_ID, 'PARTIAL',
     @IM_EVE_ID, '2026-10-22 09:00:00', '2026-10-22 08:30:00', '2026-10-22 09:00:00');

-- Inspection items
INSERT IGNORE INTO inspection_items
    (inspection_item_id, organization_id, inspection_id, product_id,
     accepted_quantity, rejected_quantity, reason_for_rejection)
VALUES
    -- INSP1 (PASSED — IT Equipment, 1 HDMI cable rejected)
    (UUID(), @ORG_ID, @INSP1_ID, '650e8400-e29b-41d4-a716-446655440004', 10, 0,  NULL),
    (UUID(), @ORG_ID, @INSP1_ID, '650e8400-e29b-41d4-a716-446655440005', 10, 0,  NULL),
    (UUID(), @ORG_ID, @INSP1_ID, '650e8400-e29b-41d4-a716-446655440006',  9, 1,  'Packaging damaged, connector bent'),

    -- INSP2 (PARTIAL — office supplies, some sticky notes damaged)
    (UUID(), @ORG_ID, @INSP2_ID, '650e8400-e29b-41d4-a716-446655440001', 100, 0, NULL),
    (UUID(), @ORG_ID, @INSP2_ID, '650e8400-e29b-41d4-a716-446655440002',  10, 0, NULL),
    (UUID(), @ORG_ID, @INSP2_ID, '650e8400-e29b-41d4-a716-446655440016',  20, 0, NULL),
    (UUID(), @ORG_ID, @INSP2_ID, '650e8400-e29b-41d4-a716-446655440015',  10, 2, 'Seals broken, risk of moisture contamination');

-- Stock transactions (generated after inspection pass)
INSERT IGNORE INTO stock_transactions
    (transaction_id, organization_id, product_id, warehouse_id,
     transaction_type, quantity, reference_id, reference_type,
     remarks, performed_by, transaction_at)
VALUES
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440004', @WH1_ID,
     'INCOMING', 10, @GRN1_ID, 'GRN', 'USB Keyboards from PO-2026-00001', @IM_DAN_ID, '2026-10-20 10:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440005', @WH1_ID,
     'INCOMING', 10, @GRN1_ID, 'GRN', 'Optical Mice from PO-2026-00001',  @IM_DAN_ID, '2026-10-20 10:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440006', @WH1_ID,
     'INCOMING',  9, @GRN1_ID, 'GRN', '9 of 10 HDMI cables accepted',     @IM_DAN_ID, '2026-10-20 10:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440006', @WH1_ID,
     'DAMAGED',   1, @GRN1_ID, 'GRN', '1 HDMI cable with bent connector', @IM_DAN_ID, '2026-10-20 10:05:00'),

    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440001', @WH1_ID,
     'INCOMING', 100, @GRN2_ID, 'GRN', 'A4 paper from PO-2026-00002',      @IM_EVE_ID, '2026-10-22 09:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440002', @WH1_ID,
     'INCOMING',  10, @GRN2_ID, 'GRN', 'Pens from PO-2026-00002',          @IM_EVE_ID, '2026-10-22 09:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440016', @WH1_ID,
     'INCOMING',  20, @GRN2_ID, 'GRN', 'Tea bags from PO-2026-00002',      @IM_EVE_ID, '2026-10-22 09:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440015', @WH1_ID,
     'INCOMING',  10, @GRN2_ID, 'GRN', '10 of 12 coffee jars accepted',    @IM_EVE_ID, '2026-10-22 09:05:00'),
    (UUID(), @ORG_ID, '650e8400-e29b-41d4-a716-446655440015', @WH1_ID,
     'DAMAGED',    2, @GRN2_ID, 'GRN', '2 jars with broken seals',         @IM_EVE_ID, '2026-10-22 09:05:00');


-- ============================================================
-- DATABASE 5 — procurex_finance
-- ============================================================
USE procurex_finance;

-- ------------------------------------------------------------
-- BUDGETS  (5 department budgets for FY 2026)
-- ------------------------------------------------------------
INSERT IGNORE INTO budgets
    (budget_id, organization_id, department_name, fiscal_year,
     allocated_amount, used_amount, committed_amount, version, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'Information Technology',  2026, 1000000.00, 16200.00,  0.00,  1, NOW(), NOW()),
    (UUID(), @ORG_ID, 'Operations',               2026,  500000.00, 47140.00,  0.00,  2, NOW(), NOW()),
    (UUID(), @ORG_ID, 'Facilities Management',    2026,  800000.00, 14340.00, 410000.00, 2, NOW(), NOW()),
    (UUID(), @ORG_ID, 'Human Resources',          2026,  200000.00,     0.00,  0.00,  0, NOW(), NOW()),
    (UUID(), @ORG_ID, 'Finance',                  2026,  300000.00,  22800.00, 0.00,  1, NOW(), NOW());

-- ------------------------------------------------------------
-- INVOICES  (vendors submit invoices against delivered/completed POs)
-- ------------------------------------------------------------
SET @INV1_ID = 'ff666666-0000-0000-0000-000000000001';  -- for PO1 — APPROVED (payment pending)
SET @INV2_ID = 'ff666666-0000-0000-0000-000000000002';  -- for PO2 — VERIFIED (awaiting approval)

INSERT IGNORE INTO invoices
    (invoice_id, organization_id, purchase_order_id, vendor_id,
     invoice_number, invoice_amount, status,
     submitted_at, verified_at, verified_by, approved_at, approved_by,
     created_at, updated_at)
VALUES
    -- INV1: PO1 fully paid (COMPLETED lifecycle)
    (@INV1_ID, @ORG_ID, @PO1_ID, @V1_VENDOR_ID,
     'INV-ACME-2026-0041', 16200.00, 'APPROVED',
     '2026-10-21 09:00:00', '2026-10-21 14:00:00', @FM_FRANK_ID,
     '2026-10-22 10:00:00', @FM_FRANK_ID,
     '2026-10-21 09:00:00', '2026-10-22 10:00:00'),

    -- INV2: PO2 office supplies — verified, awaiting approval
    (@INV2_ID, @ORG_ID, @PO2_ID, @V2_VENDOR_ID,
     'INV-MORI-2026-0088', 32800.00, 'VERIFIED',
     '2026-10-22 10:00:00', '2026-10-23 11:00:00', @FM_GRACE_ID,
     NULL, NULL,
     '2026-10-22 10:00:00', '2026-10-23 11:00:00');

-- Invoice line items
INSERT IGNORE INTO invoice_items
    (invoice_item_id, organization_id, invoice_id, product_id, product_name,
     quantity, unit_price, total_price, created_at, updated_at)
VALUES
    -- INV1 items
    (UUID(), @ORG_ID, @INV1_ID, '650e8400-e29b-41d4-a716-446655440004', 'USB Keyboard',
     10, 850.00,  8500.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @INV1_ID, '650e8400-e29b-41d4-a716-446655440005', 'Optical USB Mouse',
     10, 450.00,  4500.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @INV1_ID, '650e8400-e29b-41d4-a716-446655440006', 'HDMI Cable 1.8m',
     10, 320.00,  3200.00, NOW(), NOW()),

    -- INV2 items
    (UUID(), @ORG_ID, @INV2_ID, '650e8400-e29b-41d4-a716-446655440001', 'A4 Copy Paper',
     100, 210.00, 21000.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @INV2_ID, '650e8400-e29b-41d4-a716-446655440002', 'Ballpoint Pen (Blue)',
     10,   95.00,   950.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @INV2_ID, '650e8400-e29b-41d4-a716-446655440016', 'Tea Bags (100 pack)',
     20,  120.00,  2400.00, NOW(), NOW()),
    (UUID(), @ORG_ID, @INV2_ID, '650e8400-e29b-41d4-a716-446655440015', 'Instant Coffee 200g',
     12,  195.00,  2340.00, NOW(), NOW());

-- Invoice status history
INSERT IGNORE INTO invoice_history
    (history_id, organization_id, invoice_id, from_status, to_status,
     remarks, changed_by, changed_at)
VALUES
    -- INV1 trail
    (UUID(), @ORG_ID, @INV1_ID, NULL,                   'PENDING_VERIFICATION', 'Invoice submitted by vendor',         @V1_USER_ID,  '2026-10-21 09:00:00'),
    (UUID(), @ORG_ID, @INV1_ID, 'PENDING_VERIFICATION', 'VERIFIED',             '3-way match passed: PO + GRN + Inv',  @FM_FRANK_ID, '2026-10-21 14:00:00'),
    (UUID(), @ORG_ID, @INV1_ID, 'VERIFIED',             'APPROVED',             'Approved for payment',                @FM_FRANK_ID, '2026-10-22 10:00:00'),

    -- INV2 trail
    (UUID(), @ORG_ID, @INV2_ID, NULL,                   'PENDING_VERIFICATION', 'Invoice submitted by vendor',         @V2_USER_ID,  '2026-10-22 10:00:00'),
    (UUID(), @ORG_ID, @INV2_ID, 'PENDING_VERIFICATION', 'VERIFIED',             '3-way match passed: PO + GRN + Inv',  @FM_GRACE_ID, '2026-10-23 11:00:00');

-- ------------------------------------------------------------
-- PAYMENTS  (one completed payment for INV1)
-- ------------------------------------------------------------
INSERT IGNORE INTO payments
    (payment_id, organization_id, invoice_id, amount, payment_method,
     transaction_reference, status,
     initiated_at, completed_at, created_at, updated_at)
VALUES
    (UUID(), @ORG_ID, @INV1_ID, 16200.00, 'WIRE',
     'WIRE-20261022-001234', 'COMPLETED',
     '2026-10-22 11:00:00', '2026-10-22 15:00:00',
     '2026-10-22 11:00:00', '2026-10-22 15:00:00');


-- ============================================================
-- DATABASE 6 — procurex_notification
-- ============================================================
USE procurex_notification;

-- ------------------------------------------------------------
-- NOTIFICATION PREFERENCES  (one per user)
-- ------------------------------------------------------------
INSERT IGNORE INTO notification_preferences
    (preference_id, user_id, organization_id, email_enabled, in_app_enabled,
     created_at, updated_at)
VALUES
    (UUID(), @ADMIN_ID,    @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @PM_ALICE_ID, @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @PM_BOB_ID,   @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @PM_CAROL_ID, @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @IM_DAN_ID,   @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @IM_EVE_ID,   @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @FM_FRANK_ID, @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @FM_GRACE_ID, @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @V1_USER_ID,  @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @V2_USER_ID,  @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @V3_USER_ID,  @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @V4_USER_ID,  @ORG_ID, TRUE, TRUE, NOW(), NOW()),
    (UUID(), @V6_USER_ID,  @ORG_ID, TRUE, TRUE, NOW(), NOW());

-- ------------------------------------------------------------
-- NOTIFICATIONS  (5+ in-app notifications across roles)
-- ------------------------------------------------------------
INSERT IGNORE INTO notifications
    (notification_id, organization_id, recipient_id, recipient_email,
     event_type, title, message, channel, status, sent_at, created_at)
VALUES
    -- Vendor approved → vendor receives notification
    (UUID(), @ORG_ID, @V1_USER_ID, 'sales@acmesupplier.com',
     'VENDOR_APPROVED', 'Your account has been approved',
     'Congratulations! Your vendor account for Acme Industrial Supplies has been approved. You can now log in and start responding to RFQs.',
     'IN_APP', 'SENT', NOW(), '2026-10-02 10:00:00'),

    (UUID(), @ORG_ID, @V2_USER_ID, 'query@morisakibooks.com',
     'VENDOR_APPROVED', 'Your account has been approved',
     'Congratulations! Your vendor account for MoriSaki Bookshop has been approved.',
     'IN_APP', 'SENT', NOW(), '2026-10-02 10:15:00'),

    -- RFQ invitation → vendor receives invitation
    (UUID(), @ORG_ID, @V1_USER_ID, 'sales@acmesupplier.com',
     'RFQ_INVITATION', 'New RFQ Invitation: RFQ-2026-0001',
     'You have been invited to submit a quotation for RFQ-2026-0001 (IT Equipment for New Hires). Closing date: 13 Oct 2026.',
     'IN_APP', 'SENT', NOW(), '2026-10-06 10:05:00'),

    (UUID(), @ORG_ID, @V6_USER_ID, 'learn@courses.com',
     'RFQ_INVITATION', 'New RFQ Invitation: RFQ-2026-0001',
     'You have been invited to submit a quotation for RFQ-2026-0001 (IT Equipment for New Hires). Closing date: 13 Oct 2026.',
     'IN_APP', 'SENT', NOW(), '2026-10-06 10:05:00'),

    -- PO approved → vendor receives PO
    (UUID(), @ORG_ID, @V1_USER_ID, 'sales@acmesupplier.com',
     'PO_APPROVED', 'Purchase Order PO-2026-00001 Approved',
     'Purchase Order PO-2026-00001 has been approved and issued to you. Please confirm acceptance at the earliest.',
     'IN_APP', 'SENT', NOW(), '2026-10-14 15:00:00'),

    -- Payment completed → vendor notified
    (UUID(), @ORG_ID, @V1_USER_ID, 'sales@acmesupplier.com',
     'PAYMENT_COMPLETED', 'Payment Received: INV-ACME-2026-0041',
     'Payment of INR 16,200 for invoice INV-ACME-2026-0041 has been completed via wire transfer. Transaction ref: WIRE-20261022-001234.',
     'IN_APP', 'SENT', NOW(), '2026-10-22 15:05:00'),

    -- Manager notified when RFQ quotations arrive
    (UUID(), @ORG_ID, @PM_ALICE_ID, 'sarah.procurement@procurex.com',
     'QUOTATION_SUBMITTED', 'New Quotation for RFQ-2026-0001',
     'Acme Industrial Supplies has submitted a quotation for RFQ-2026-0001. Total amount: INR 16,200. Please review.',
     'IN_APP', 'SENT', NOW(), '2026-10-10 12:00:00'),

    -- Finance manager notified when invoice submitted
    (UUID(), @ORG_ID, @FM_FRANK_ID, 'bruce.finance@procurex.com',
     'INVOICE_SUBMITTED', 'New Invoice for PO-2026-00001',
     'Acme Industrial Supplies has submitted invoice INV-ACME-2026-0041 for INR 16,200 against PO-2026-00001. Verification pending.',
     'IN_APP', 'SENT', NOW(), '2026-10-21 09:05:00');


-- ============================================================
-- DATABASE 7 — analytics_db
-- ============================================================
USE procurex_analytics;

-- ------------------------------------------------------------
-- VENDOR RATING CARDS  (one per approved vendor with PO history)
-- These are normally auto-calculated by ScorecardScheduler,
-- but we seed realistic baseline values for testing the UI.
-- ------------------------------------------------------------
INSERT IGNORE INTO vendor_rating_cards
    (rating_card_id, organization_id, vendor_id, vendor_name,
     total_deliveries, on_time_deliveries,
     total_inspected_items, total_accepted_items,
     on_time_ratio, quality_ratio, performance_score,
     calculated_at, updated_at)
VALUES
    -- TechSupply Co. — excellent performance
    (UUID(), @ORG_ID, @V1_VENDOR_ID, 'TechSupply Co.',
     5, 5, 150, 148, 1.00, 0.99, 4.9, NOW(), NOW()),

    -- OfficeWorld — good performance, minor quality issue
    (UUID(), @ORG_ID, @V2_VENDOR_ID, 'OfficeWorld',
     8, 7, 420, 415, 0.88, 0.99, 4.2, NOW(), NOW()),

    -- FurniturePlus — in progress, limited data
    (UUID(), @ORG_ID, @V3_VENDOR_ID, 'FurniturePlus',
     2, 2, 30, 29, 1.00, 0.97, 3.9, NOW(), NOW()),

    -- CleanPro — reliable but slower deliveries
    (UUID(), @ORG_ID, @V4_VENDOR_ID, 'CleanPro',
     6, 5, 200, 198, 0.83, 0.99, 4.1, NOW(), NOW()),

    -- PrintMaster — newer vendor, some delays
    (UUID(), @ORG_ID, @V6_VENDOR_ID, 'PrintMaster',
     3, 2, 60, 58, 0.67, 0.97, 3.7, NOW(), NOW());

-- ------------------------------------------------------------
-- DASHBOARD METRICS  (KPI counters for the analytics page)
-- These are normally written by RabbitMQ events. We seed
-- realistic values so the KPI cards show real numbers.
-- ------------------------------------------------------------
INSERT IGNORE INTO dashboard_metrics
    (metric_id, organization_id, metric_key, metric_value, metric_type,
     calculated_at, updated_at)
VALUES
    (UUID(), @ORG_ID, 'TOTAL_PO_COUNT',      '5',           'COUNT', NOW(), NOW()),
    (UUID(), @ORG_ID, 'TOTAL_PO_VALUE_MTD',  '487500.00',   'AMOUNT', NOW(), NOW()),
    (UUID(), @ORG_ID, 'TOTAL_GRN_COUNT',     '2',           'COUNT', NOW(), NOW()),
    (UUID(), @ORG_ID, 'OPEN_RFQ_COUNT',      '3',           'COUNT', NOW(), NOW()),
    (UUID(), @ORG_ID, 'TOTAL_PAYMENTS_MTD',  '125000.00',   'AMOUNT', NOW(), NOW()),
    (UUID(), @ORG_ID, 'TOTAL_INSPECTIONS',   '2',           'COUNT', NOW(), NOW());


-- ============================================================
-- END OF SEED SCRIPT
-- ============================================================
-- Summary of seeded data:
--   procurex_identity  : 8 audit log entries
--   procurex_vendor    : 6 vendors, 25 vendor-product mappings, 5 contracts
--   procurex_procurement: 5 PRs, 3 RFQs, 3 quotations, 5 POs with items & history
--   inventory_db       : 2 warehouses, 10 inventory records, 2 GRNs,
--                        2 inspections, 9 stock transactions
--   procurex_finance   : 5 budgets, 2 invoices with items & history, 1 payment
--   procurex_notification: 13 preferences, 8 notifications
--   analytics_db       : 5 vendor rating cards
-- ============================================================
