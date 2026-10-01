-- V1: Create vendor catalog tables and seed categories

-- ============================================================
-- TABLE: categories (no FK dependencies, created first)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id       CHAR(36)     NOT NULL,
    organization_id   CHAR(36)     NOT NULL,
    category_name     VARCHAR(100) NOT NULL,
    description       TEXT,
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL,
    updated_at        DATETIME     NOT NULL,
    CONSTRAINT pk_categories PRIMARY KEY (category_id),
    CONSTRAINT uq_categories_name_org UNIQUE (organization_id, category_name)
);

-- ============================================================
-- TABLE: vendors
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id         CHAR(36)     NOT NULL,
    organization_id   CHAR(36)     NOT NULL,
    user_id           CHAR(36),
    company_name      VARCHAR(200) NOT NULL,
    contact_person    VARCHAR(100),
    email             VARCHAR(100),
    phone_number      VARCHAR(20),
    address           VARCHAR(255),
    city              VARCHAR(100),
    state             VARCHAR(100),
    country           VARCHAR(100),
    postal_code       VARCHAR(20),
    gst_number        VARCHAR(30),
    vendor_status     VARCHAR(20)  NOT NULL DEFAULT 'INACTIVE',
    rating            DECIMAL(3,2) DEFAULT 0.00,
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL,
    updated_at        DATETIME     NOT NULL,
    CONSTRAINT pk_vendors PRIMARY KEY (vendor_id)
);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    product_id        CHAR(36)     NOT NULL,
    category_id       CHAR(36)     NOT NULL,
    product_name      VARCHAR(150) NOT NULL,
    description       TEXT,
    unit_of_measure   VARCHAR(30)  NOT NULL,
    minimum_stock     INT          NOT NULL DEFAULT 0,
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL,
    updated_at        DATETIME     NOT NULL,
    CONSTRAINT pk_products PRIMARY KEY (product_id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (category_id)
);

-- ============================================================
-- TABLE: vendor_products (junction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_products (
    vendor_product_id CHAR(36)     NOT NULL,
    vendor_id         CHAR(36)     NOT NULL,
    product_id        CHAR(36)     NOT NULL,
    unit_price        DECIMAL(15,2),
    lead_time_days    INT,
    mapping_status    VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL,
    updated_at        DATETIME     NOT NULL,
    CONSTRAINT pk_vendor_products PRIMARY KEY (vendor_product_id),
    CONSTRAINT uq_vendor_product UNIQUE (vendor_id, product_id),
    CONSTRAINT fk_vp_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id),
    CONSTRAINT fk_vp_product FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- ============================================================
-- TABLE: contracts
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
    contract_id       CHAR(36)     NOT NULL,
    vendor_id         CHAR(36)     NOT NULL,
    organization_id   CHAR(36)     NOT NULL,
    contract_number   VARCHAR(50)  NOT NULL,
    start_date        DATE,
    end_date          DATE,
    total_value       DECIMAL(15,2),
    contract_status   VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    notes             TEXT,
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL,
    updated_at        DATETIME     NOT NULL,
    CONSTRAINT pk_contracts PRIMARY KEY (contract_id),
    CONSTRAINT uq_contract_number UNIQUE (contract_number),
    CONSTRAINT fk_contracts_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)
);

-- ============================================================
-- SEED: categories (hardcoded UUIDs, fixed organization_id)
-- ============================================================
INSERT INTO categories (category_id, organization_id, category_name, description, is_deleted, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Office Supplies',       'Pens, paper, stationery and general office items',          0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'IT Equipment',          'Computers, laptops, peripherals and networking hardware',    0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Furniture',             'Office furniture including desks, chairs and cabinets',      0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Cleaning Supplies',     'Janitorial and cleaning materials for office maintenance',   0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Safety Equipment',      'Personal protective equipment and safety gear',              0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'Electrical Supplies',   'Cables, connectors, switches and electrical components',     0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'Printing & Imaging',    'Printers, ink cartridges, toners and imaging consumables',   0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', 'Pantry & Cafeteria',    'Tea, coffee, snacks and cafeteria supplies',                 0, NOW(), NOW());
