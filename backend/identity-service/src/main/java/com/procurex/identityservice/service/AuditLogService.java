package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.response.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for retrieving audit log entries.
 * Write operations are performed directly by AuthService and AdminUserService.
 */
public interface AuditLogService {

    /**
     * Returns a paginated, filtered page of audit log entries enriched with actor details.
     *
     * @param action   optional action filter (exact match)
     * @param userId   optional actor UUID filter
     * @param from     optional range start (inclusive)
     * @param to       optional range end (inclusive)
     * @param pageable pagination and sort directives
     */
    Page<AuditLogResponse> getAuditLogs(
            String        action,
            UUID          userId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable      pageable
    );
}
