package com.procurex.identityservice.dto.response;

/**
 * Holds the aggregated health status of a single microservice,
 * including its overall status and the status of key sub-components.
 *
 * @param serviceName  human-readable display name, e.g. "Identity Service"
 * @param serviceKey   machine-friendly key, e.g. "identity-service"
 * @param port         the port the service listens on, e.g. 8081
 * @param status       overall actuator status: "UP", "DOWN", or "UNKNOWN"
 * @param dbStatus     database component status: "UP", "DOWN", or "N/A"
 * @param rabbitStatus RabbitMQ component status: "UP", "DOWN", or "N/A"
 * @param checkedAt    ISO-8601 timestamp of when the check was performed
 */
public record ServiceHealthInfo(
        String serviceName,
        String serviceKey,
        int    port,
        String status,
        String dbStatus,
        String rabbitStatus,
        String checkedAt
) {}
