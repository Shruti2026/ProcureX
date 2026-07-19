-- ============================================================
-- V1 - Identity Service: Create tables and seed default roles
-- ============================================================

CREATE TABLE roles (
    role_id     CHAR(36)        NOT NULL,
    role_name   VARCHAR(50)     NOT NULL,
    description TEXT,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id),
    UNIQUE KEY uk_roles_role_name (role_name)
);

CREATE TABLE users (
    user_id                CHAR(36)                               NOT NULL,
    organization_id        CHAR(36)                               NOT NULL,
    full_name              VARCHAR(100)                           NOT NULL,
    email                  VARCHAR(100)                           NOT NULL,
    password               VARCHAR(255)                           NOT NULL,
    phone_number           VARCHAR(15),
    role_id                CHAR(36),
    account_status         ENUM('ACTIVE','INACTIVE','LOCKED')     NOT NULL DEFAULT 'INACTIVE',
    failed_login_attempts  INT                                    NOT NULL DEFAULT 0,
    last_login             TIMESTAMP                              NULL,
    created_by             CHAR(36),
    updated_by             CHAR(36),
    created_at             TIMESTAMP                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP                              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

CREATE TABLE refresh_tokens (
    token_id   CHAR(36)     NOT NULL,
    user_id    CHAR(36)     NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (token_id),
    UNIQUE KEY uk_refresh_tokens_user_id (user_id),
    UNIQUE KEY uk_refresh_tokens_token  (token),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE audit_logs (
    audit_log_id    CHAR(36)     NOT NULL,
    organization_id CHAR(36)     NOT NULL,
    user_id         CHAR(36)     NOT NULL,
    action          VARCHAR(50)  NOT NULL,
    entity_name     VARCHAR(100) NOT NULL,
    entity_id       CHAR(36),
    old_value       TEXT,
    new_value       TEXT,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_log_id),
    INDEX idx_audit_logs_user_id         (user_id),
    INDEX idx_audit_logs_organization_id (organization_id),
    INDEX idx_audit_logs_entity_name     (entity_name),
    INDEX idx_audit_logs_created_at      (created_at)
);

-- ============================================================
-- Seed default roles
-- ============================================================
INSERT INTO roles (role_id, role_name, description, created_at, updated_at) VALUES
    (UUID(), 'ADMIN',                'System administrator with full access',          NOW(), NOW()),
    (UUID(), 'PROCUREMENT_MANAGER',  'Manages the complete procurement lifecycle',     NOW(), NOW()),
    (UUID(), 'INVENTORY_MANAGER',    'Manages warehouse operations and stock levels',  NOW(), NOW()),
    (UUID(), 'FINANCE_MANAGER',      'Manages invoices, budgets and payments',         NOW(), NOW()),
    (UUID(), 'VENDOR',               'External vendor registered with the platform',   NOW(), NOW());
