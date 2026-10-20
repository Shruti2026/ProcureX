package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.response.SystemHealthResponse;

/**
 * Contract for aggregating actuator health data from all ProcureX microservices.
 */
public interface SystemHealthService {

    /**
     * Checks the {@code /actuator/health} endpoint of every registered microservice
     * in parallel and returns a unified {@link SystemHealthResponse}.
     *
     * @return aggregated system health report
     */
    SystemHealthResponse fetchSystemHealth();
}
