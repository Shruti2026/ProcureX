package com.procurex.identityservice.dto.response;

import java.time.Instant;

public record ServiceHistoryPoint(
        Long id,
        String serviceName,
        String serviceKey,
        String category,
        int port,
        String status,
        long responseTimeMs,
        String dbStatus,
        String rabbitStatus,
        String detailsJson,
        Instant recordedAt
) {}
