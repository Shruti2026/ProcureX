package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.response.ServiceHistoryPoint;
import com.procurex.identityservice.dto.response.SystemHealthPoint;
import com.procurex.identityservice.dto.response.SystemHealthResponse;

import java.util.List;

/**
 * Contract for aggregating health data from all ProcureX microservices and infrastructure,
 * plus historical telemetry.
 */
public interface SystemHealthService {

    /**
     * Checks all microservices and infrastructure components in parallel, persists a snapshot,
     * and returns the current {@link SystemHealthResponse}.
     */
    SystemHealthResponse fetchSystemHealth();

    /**
     * Captures and persists a health snapshot (invoked by scheduler).
     */
    void recordHealthSnapshot();

    /**
     * Returns system-wide health snapshots within the specified time range.
     *
     * @param range "1h", "24h", or "7d"
     */
    List<SystemHealthPoint> getSystemHealthHistory(String range);

    /**
     * Returns historical health metrics for a specific service or infrastructure key.
     *
     * @param serviceKey e.g. "inventory-service", "mysql", "rabbitmq"
     * @param range      "1h", "24h", or "7d"
     */
    List<ServiceHistoryPoint> getServiceHistory(String serviceKey, String range);
}
