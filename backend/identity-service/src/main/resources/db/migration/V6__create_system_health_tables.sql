-- Flyway migration V6: Create system health snapshot and service health record tables

CREATE TABLE system_health_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recorded_at DATETIME NOT NULL,
    services_online INT NOT NULL,
    services_offline INT NOT NULL,
    total_services INT NOT NULL,
    uptime_rate DECIMAL(5,2) NOT NULL,
    INDEX idx_shs_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE service_health_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    snapshot_id BIGINT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    service_key VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'MICROSERVICE', -- 'MICROSERVICE' or 'INFRASTRUCTURE'
    port INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms BIGINT NOT NULL DEFAULT 0,
    db_status VARCHAR(20) NOT NULL DEFAULT 'N/A',
    rabbit_status VARCHAR(20) NOT NULL DEFAULT 'N/A',
    details_json TEXT NULL,
    recorded_at DATETIME NOT NULL,
    CONSTRAINT fk_shr_snapshot FOREIGN KEY (snapshot_id) REFERENCES system_health_snapshots (id) ON DELETE CASCADE,
    INDEX idx_shr_service_key_recorded_at (service_key, recorded_at),
    INDEX idx_shr_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
