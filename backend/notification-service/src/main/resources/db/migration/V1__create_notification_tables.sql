CREATE TABLE notification_preferences (
    preference_id   CHAR(36)  PRIMARY KEY,
    user_id         CHAR(36)  NOT NULL UNIQUE,
    organization_id CHAR(36)  NOT NULL,
    email_enabled   BOOLEAN   NOT NULL DEFAULT TRUE,
    in_app_enabled  BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    notification_id CHAR(36)     PRIMARY KEY,
    organization_id CHAR(36)     NOT NULL,
    recipient_id    CHAR(36)     NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT         NOT NULL,
    channel         ENUM('EMAIL','IN_APP') NOT NULL,
    status          ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
    error_message   TEXT,
    sent_at         TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
