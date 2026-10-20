package com.procurex.identityservice.repository;

import com.procurex.identityservice.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Repository for managing audit log records.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Returns a paginated, filtered view of audit logs.
     * Any parameter may be null — null parameters are treated as "match all".
     *
     * @param action   optional action filter (e.g. "LOGIN", "APPROVE_VENDOR")
     * @param userId   optional actor UUID filter
     * @param from     optional range start (inclusive)
     * @param to       optional range end (inclusive)
     * @param pageable pagination and sort directives
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:action   IS NULL OR a.action   = :action)
              AND (:userId   IS NULL OR a.userId   = :userId)
              AND (:from     IS NULL OR a.createdAt >= :from)
              AND (:to       IS NULL OR a.createdAt <= :to)
            """)
    Page<AuditLog> findByFilters(
            @Param("action")  String        action,
            @Param("userId")  UUID          userId,
            @Param("from")    LocalDateTime from,
            @Param("to")      LocalDateTime to,
            Pageable          pageable
    );
}
