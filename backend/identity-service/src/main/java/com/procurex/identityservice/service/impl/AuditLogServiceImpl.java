package com.procurex.identityservice.service.impl;

import com.procurex.identityservice.dto.response.AuditLogResponse;
import com.procurex.identityservice.entity.AuditLog;
import com.procurex.identityservice.entity.User;
import com.procurex.identityservice.repository.AuditLogRepository;
import com.procurex.identityservice.repository.UserRepository;
import com.procurex.identityservice.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation for reading audit log entries.
 * Actor name and email are resolved in bulk to avoid N+1 queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository     userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(
            String        action,
            UUID          userId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable      pageable) {

        Page<AuditLog> page = auditLogRepository.findByFilters(action, userId, from, to, pageable);

        // Collect all distinct actor IDs from this page, then bulk-fetch them
        Set<UUID> actorIds = page.stream()
                .map(AuditLog::getUserId)
                .collect(Collectors.toSet());

        Map<UUID, User> actorMap = userRepository.findAllById(actorIds)
                .stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));

        return page.map(log -> {
            User actor = actorMap.get(log.getUserId());
            return new AuditLogResponse(
                    log.getAuditLogId(),
                    log.getOrganizationId(),
                    log.getUserId(),
                    actor != null ? actor.getFullName()  : null,
                    actor != null ? actor.getEmail()     : null,
                    log.getAction(),
                    log.getEntityName(),
                    log.getEntityId(),
                    log.getOldValue(),
                    log.getNewValue(),
                    log.getCreatedAt()
            );
        });
    }
}
