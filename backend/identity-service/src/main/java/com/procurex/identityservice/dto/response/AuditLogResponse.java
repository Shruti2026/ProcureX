package com.procurex.identityservice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a single audit log entry returned to the admin UI.
 * actorName and actorEmail are resolved via a join — no separate lookup needed on the client.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuditLogResponse(
        UUID          auditLogId,
        UUID          organizationId,
        UUID          userId,
        String        actorName,       // resolved from users table
        String        actorEmail,      // resolved from users table
        String        action,
        String        entityName,
        UUID          entityId,
        String        oldValue,        // JSON snapshot of entity state before the action (may be null)
        String        newValue,        // JSON snapshot of entity state after the action (may be null)
        LocalDateTime createdAt
) {}
