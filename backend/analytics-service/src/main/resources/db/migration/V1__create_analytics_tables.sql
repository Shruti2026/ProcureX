CREATE TABLE dashboard_metrics (
    metric_id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    metric_value VARCHAR(255) NOT NULL,
    metric_type VARCHAR(20) NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_org_metric (organization_id, metric_key)
);

CREATE TABLE vendor_rating_cards (
    rating_card_id CHAR(36) PRIMARY KEY,
    organization_id CHAR(36) NOT NULL,
    vendor_id CHAR(36) NOT NULL UNIQUE,
    total_deliveries INT DEFAULT 0,
    on_time_deliveries INT DEFAULT 0,
    total_inspected_items INT DEFAULT 0,
    total_accepted_items INT DEFAULT 0,
    on_time_ratio DECIMAL(3,2) DEFAULT 0.00,
    quality_ratio DECIMAL(3,2) DEFAULT 0.00,
    performance_score DECIMAL(2,1) DEFAULT 0.0,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
