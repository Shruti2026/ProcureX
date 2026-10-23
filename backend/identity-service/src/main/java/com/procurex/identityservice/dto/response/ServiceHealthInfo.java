package com.procurex.identityservice.dto.response;

/**
 * Holds the aggregated health status of a single microservice or infrastructure component,
 * including its overall status, latency, category, and sub-components.
 */
public record ServiceHealthInfo(
        String serviceName,
        String serviceKey,
        String category,       // "MICROSERVICE" or "INFRASTRUCTURE"
        int    port,
        String status,
        long   responseTimeMs,
        String dbStatus,
        String rabbitStatus,
        String detailsJson,
        String checkedAt
) {}
