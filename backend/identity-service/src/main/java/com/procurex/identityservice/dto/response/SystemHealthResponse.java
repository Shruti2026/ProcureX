package com.procurex.identityservice.dto.response;

import java.util.List;

/**
 * Aggregated system-wide health report returned by the admin health endpoint.
 *
 * @param servicesUp    number of services whose status is "UP"
 * @param servicesDown  number of services whose status is not "UP"
 * @param totalServices total number of services checked
 * @param services      per-service health details
 */
public record SystemHealthResponse(
        int                     servicesUp,
        int                     servicesDown,
        int                     totalServices,
        List<ServiceHealthInfo> services
) {}
