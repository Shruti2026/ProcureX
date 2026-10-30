-- Speeds up the OutboxPoller query that runs every 5 seconds:
--   findTop20ByStatusOrderByCreatedAtAsc(PENDING)
-- Without this index MySQL performs a full table scan on every poll.
CREATE INDEX idx_outbox_status_created
    ON outbox_events (status, created_at);
