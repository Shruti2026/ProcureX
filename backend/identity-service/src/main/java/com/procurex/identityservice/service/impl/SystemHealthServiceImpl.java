package com.procurex.identityservice.service.impl;

import com.procurex.identityservice.dto.response.ServiceHealthInfo;
import com.procurex.identityservice.dto.response.SystemHealthResponse;
import com.procurex.identityservice.service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Parallel health aggregator that queries the {@code /actuator/health} endpoint
 * of every registered ProcureX microservice and consolidates the results.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemHealthServiceImpl implements SystemHealthService {

    private final RestTemplate restTemplate;

    // -------------------------------------------------------------------------
    // Service registry
    // -------------------------------------------------------------------------

    /**
     * Lightweight descriptor for each microservice that should be health-checked.
     *
     * @param name      human-readable display name
     * @param key       machine-friendly identifier
     * @param port      direct (non-gateway) port
     * @param hasDb     whether the service exposes a {@code db} actuator component
     * @param hasRabbit whether the service exposes a {@code rabbit} actuator component
     */
    private record ServiceDefinition(String name, String key, int port, boolean hasDb, boolean hasRabbit) {}

    private static final List<ServiceDefinition> SERVICES = List.of(
            new ServiceDefinition("API Gateway",       "api-gateway",       8080, false, false),
            new ServiceDefinition("Identity Service",  "identity-service",  8081, true,  true),
            new ServiceDefinition("Vendor Catalog",    "vendor-catalog",    8082, true,  true),
            new ServiceDefinition("Procurement",       "procurement",       8083, true,  true),
            new ServiceDefinition("Inventory",         "inventory",         8084, true,  true),
            new ServiceDefinition("Finance",           "finance",           8085, true,  true),
            new ServiceDefinition("Notification",      "notification",      8086, true,  true),
            new ServiceDefinition("Analytics",         "analytics",         8087, true,  false),
            new ServiceDefinition("Eureka Server",     "eureka-server",     8761, false, false)
    );

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    @Override
    public SystemHealthResponse fetchSystemHealth() {
        // Fire all health checks in parallel
        List<CompletableFuture<ServiceHealthInfo>> futures = SERVICES.stream()
                .map(svc -> CompletableFuture.supplyAsync(() -> checkService(svc)))
                .toList();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        List<ServiceHealthInfo> results = futures.stream()
                .map(CompletableFuture::join)
                .toList();

        long upCount   = results.stream().filter(s -> "UP".equals(s.status())).count();
        int  total     = results.size();
        int  downCount = total - (int) upCount;

        return new SystemHealthResponse((int) upCount, downCount, total, results);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Performs a single HTTP GET to {@code http://<host>:{port}/actuator/health}
     * and maps the response into a {@link ServiceHealthInfo}.
     * Tries the service key as host first (Docker network hostname), falling back to localhost.
     * Any exception (connection refused, timeout, etc.) results in a "DOWN" status.
     */
    @SuppressWarnings("unchecked")
    private ServiceHealthInfo checkService(ServiceDefinition svc) {
        String checkedAt = Instant.now().toString();

        // 1. Try Docker container / service hostname first (unless it's self on 8081)
        List<String> candidateHosts = "identity-service".equals(svc.key())
                ? List.of("localhost", svc.key())
                : List.of(svc.key(), "localhost");

        for (String host : candidateHosts) {
            String url = "http://" + host + ":" + svc.port() + "/actuator/health";
            try {
                Map<String, Object> body = restTemplate.getForObject(url, Map.class);
                if (body != null) {
                    String status = (String) body.getOrDefault("status", "UNKNOWN");
                    Map<String, Object> components = (Map<String, Object>) body.get("components");

                    String dbStatus     = extractComponentStatus(components, "db");
                    String rabbitStatus = extractComponentStatus(components, "rabbit");

                    if (!"UP".equals(status)) {
                        log.warn("Service '{}' on {}:{} reported status: {}", svc.name(), host, svc.port(), status);
                    }

                    return buildInfo(svc, status, dbStatus, rabbitStatus, checkedAt);
                }
            } catch (Exception ex) {
                log.debug("Health check failed for '{}' at {}: {}", svc.name(), url, ex.getMessage());
            }
        }

        log.warn("Health check failed for '{}' across candidate hosts on port {}", svc.name(), svc.port());
        return buildInfo(svc, "DOWN", "N/A", "N/A", checkedAt);
    }

    /**
     * Safely extracts the {@code status} field from a named component map.
     *
     * @param components the parsed {@code components} object from the actuator response
     * @param key        component name, e.g. {@code "db"} or {@code "rabbit"}
     * @return the component's status string, or {@code "N/A"} if absent
     */
    @SuppressWarnings("unchecked")
    private String extractComponentStatus(Map<String, Object> components, String key) {
        if (components == null || !components.containsKey(key)) {
            return "N/A";
        }
        Map<String, Object> component = (Map<String, Object>) components.get(key);
        if (component == null) {
            return "N/A";
        }
        return (String) component.getOrDefault("status", "N/A");
    }

    private ServiceHealthInfo buildInfo(ServiceDefinition svc,
                                        String status,
                                        String dbStatus,
                                        String rabbitStatus,
                                        String checkedAt) {
        return new ServiceHealthInfo(
                svc.name(),
                svc.key(),
                svc.port(),
                status,
                dbStatus,
                rabbitStatus,
                checkedAt
        );
    }
}
