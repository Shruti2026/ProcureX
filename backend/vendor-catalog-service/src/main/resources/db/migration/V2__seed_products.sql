-- V2: Seed products using subqueries to resolve category_id by name (no hardcoded category UUIDs)

INSERT INTO products (product_id, category_id, product_name, description, unit_of_measure, minimum_stock, is_deleted, created_at, updated_at)
VALUES
    -- Office Supplies
    ('650e8400-e29b-41d4-a716-446655440001',
     (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
     'A4 Copy Paper', '80 GSM A4 white copy paper, 500 sheets per ream', 'Ream', 50, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440002',
     (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
     'Ballpoint Pen (Blue)', 'Medium tip ballpoint pen, blue ink', 'Box', 20, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440003',
     (SELECT category_id FROM categories WHERE category_name = 'Office Supplies' LIMIT 1),
     'Sticky Notes 3x3', 'Self-adhesive notes, 100 sheets per pad, yellow', 'Pack', 30, 0, NOW(), NOW()),

    -- IT Equipment
    ('650e8400-e29b-41d4-a716-446655440004',
     (SELECT category_id FROM categories WHERE category_name = 'IT Equipment' LIMIT 1),
     'USB Keyboard', 'Wired USB standard keyboard, QWERTY layout', 'Unit', 10, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440005',
     (SELECT category_id FROM categories WHERE category_name = 'IT Equipment' LIMIT 1),
     'Optical USB Mouse', 'Wired optical USB mouse with scroll wheel', 'Unit', 10, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440006',
     (SELECT category_id FROM categories WHERE category_name = 'IT Equipment' LIMIT 1),
     'HDMI Cable 1.8m', '1.8 metre HDMI to HDMI cable, supports 4K', 'Unit', 15, 0, NOW(), NOW()),

    -- Furniture
    ('650e8400-e29b-41d4-a716-446655440007',
     (SELECT category_id FROM categories WHERE category_name = 'Furniture' LIMIT 1),
     'Ergonomic Office Chair', 'Adjustable lumbar support office chair', 'Unit', 5, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440008',
     (SELECT category_id FROM categories WHERE category_name = 'Furniture' LIMIT 1),
     'Office Desk 120cm', 'Rectangular office desk, 120x60 cm work surface', 'Unit', 3, 0, NOW(), NOW()),

    -- Cleaning Supplies
    ('650e8400-e29b-41d4-a716-446655440009',
     (SELECT category_id FROM categories WHERE category_name = 'Cleaning Supplies' LIMIT 1),
     'Multi-surface Cleaner 1L', 'All-purpose spray cleaner for office surfaces', 'Bottle', 24, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440010',
     (SELECT category_id FROM categories WHERE category_name = 'Cleaning Supplies' LIMIT 1),
     'Microfibre Cloth Pack', 'Pack of 10 microfibre cleaning cloths', 'Pack', 20, 0, NOW(), NOW()),

    -- Safety Equipment
    ('650e8400-e29b-41d4-a716-446655440011',
     (SELECT category_id FROM categories WHERE category_name = 'Safety Equipment' LIMIT 1),
     'Disposable Face Mask (50 pack)', 'Type IIR surgical face masks, box of 50', 'Box', 10, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440012',
     (SELECT category_id FROM categories WHERE category_name = 'Safety Equipment' LIMIT 1),
     'Nitrile Gloves (Medium)', 'Powder-free nitrile examination gloves, medium, box of 100', 'Box', 10, 0, NOW(), NOW()),

    -- Printing & Imaging
    ('650e8400-e29b-41d4-a716-446655440013',
     (SELECT category_id FROM categories WHERE category_name = 'Printing & Imaging' LIMIT 1),
     'Black Toner Cartridge', 'Compatible black toner cartridge, high yield', 'Unit', 5, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440014',
     (SELECT category_id FROM categories WHERE category_name = 'Printing & Imaging' LIMIT 1),
     'Colour Ink Cartridge Set', 'CMY colour ink cartridge set for inkjet printers', 'Set', 5, 0, NOW(), NOW()),

    -- Pantry & Cafeteria
    ('650e8400-e29b-41d4-a716-446655440015',
     (SELECT category_id FROM categories WHERE category_name = 'Pantry & Cafeteria' LIMIT 1),
     'Instant Coffee 200g', 'Instant coffee granules, 200g jar', 'Jar', 12, 0, NOW(), NOW()),

    ('650e8400-e29b-41d4-a716-446655440016',
     (SELECT category_id FROM categories WHERE category_name = 'Pantry & Cafeteria' LIMIT 1),
     'Tea Bags (100 pack)', 'Black tea bags, individually wrapped, pack of 100', 'Pack', 10, 0, NOW(), NOW());
