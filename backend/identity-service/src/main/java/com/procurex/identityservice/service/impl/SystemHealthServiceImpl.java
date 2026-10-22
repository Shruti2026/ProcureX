package com.procurex.identityservice.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.identityservice.dto.response.ServiceHealthInfo;
import com.procurex.identityservice.dto.response.ServiceHistoryPoint;
import com.procurex.identityservice.dto.response.SystemHealthPoint;
import com.procurex.identityservice.dto.response.SystemHealthResponse;
import com.procurex.identityservice.entity.ServiceHealthRecord;
import com.procurex.identityservice.entity.SystemHealthSnapshot;
import com.procurex.identityservice.repository.ServiceHealthRecordRepository;
import com.procurex.identityservice.repository.SystemHealthSnapshotRepository;
import com.procurex.identityservice.service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemHealthServiceImpl implements SystemHealthService {

    private final RestTemplate restTemplate;
    private final DataSource dataSource;
    private final ConnectionFactory rabbitConnectionFactory;
    private final SystemHealthSnapshotRepository snapshotRepository;
    private final ServiceHealthRecordRepository recordRepository;
    private final ObjectMapper objectMapper;

    private record ServiceDefinition(String name, String key, String category, int port, boolean hasDb, boolean hasRabbit) {}

    private static final List<ServiceDefinition> MICROSERVICES = List.of(
            new ServiceDefinition("API Gateway",       "api-gateway",              "MICROSERVICE", 8080, false, false),
            new ServiceDefinition("Identity Service",  "identity-service",         "MICROSERVICE", 8081, true,  true),
            new ServiceDefinition("Vendor Catalog",    "vendor-catalog-service",   "MICROSERVICE", 8082, true,  true),
            new ServiceDefinition("Procurement",       "procurement-service",      "MICROSERVICE", 8083, true,  true),
            new ServiceDefinition("Inventory",         "inventory-service",        "MICROSERVICE", 8084, true,  true),
            new ServiceDefinition("Finance",           "finance-service",          "MICROSERVICE", 8085, true,  true),
            new ServiceDefinition("Notification",      "notification-service",     "MICROSERVICE", 8086, true,  true),
            new ServiceDefinition("Analytics",         "analytics-service",        "MICROSERVICE", 8087, true,  false),
            new ServiceDefinition("Eureka Server",     "eureka-server",            "MICROSERVICE", 8761, false, false)
    );

    @Override
    @Transactional
    public SystemHealthResponse fetchSystemHealth() {
        List<ServiceHealthInfo> results = runAllHealthChecks();

        long upCount   = results.stream().filter(s -> "UP".equals(s.status())).count();
        int  total     = results.size();
        int  downCount = total - (int) upCount;

        return new SystemHealthResponse((int) upCount, downCount, total, results);
    }

    @Override
    @Transactional
    public void recordHealthSnapshot() {
        List<ServiceHealthInfo> results = runAllHealthChecks();
        saveSnapshotAndRecords(results);
    }

    private List<ServiceHealthInfo> runAllHealthChecks() {
        List<CompletableFuture<ServiceHealthInfo>> futures = new ArrayList<>();

        for (ServiceDefinition svc : MICROSERVICES) {
            futures.add(CompletableFuture.supplyAsync(() -> checkMicroservice(svc)));
        }

        // Direct Infrastructure checks
        futures.add(CompletableFuture.supplyAsync(this::checkMySQL));
        futures.add(CompletableFuture.supplyAsync(this::checkRabbitMQ));

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        return futures.stream().map(CompletableFuture::join).toList();
    }

    private void saveSnapshotAndRecords(List<ServiceHealthInfo> results) {
        try {
            LocalDateTime now = LocalDateTime.now();
            long upCount = results.stream().filter(s -> "UP".equals(s.status())).count();
            int total = results.size();
            int downCount = total - (int) upCount;

            BigDecimal uptime = total > 0
                    ? BigDecimal.valueOf((double) upCount / total * 100.0).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            SystemHealthSnapshot snapshot = SystemHealthSnapshot.builder()
                    .recordedAt(now)
                    .servicesOnline((int) upCount)
                    .servicesOffline(downCount)
                    .totalServices(total)
                    .uptimeRate(uptime)
                    .build();

            snapshot = snapshotRepository.save(snapshot);

            List<ServiceHealthRecord> records = new ArrayList<>();
            for (ServiceHealthInfo info : results) {
                records.add(ServiceHealthRecord.builder()
                        .snapshot(snapshot)
                        .serviceName(info.serviceName())
                        .serviceKey(info.serviceKey())
                        .category(info.category())
                        .port(info.port())
                        .status(info.status())
                        .responseTimeMs(info.responseTimeMs())
                        .dbStatus(info.dbStatus())
                        .rabbitStatus(info.rabbitStatus())
                        .detailsJson(info.detailsJson())
                        .recordedAt(now)
                        .build());
            }

            recordRepository.saveAll(records);
            log.debug("Persisted health snapshot with {} records", records.size());
        } catch (Exception e) {
            log.error("Failed to save health snapshot: {}", e.getMessage(), e);
        }
    }

    @Override
    public List<SystemHealthPoint> getSystemHealthHistory(String range) {
        LocalDateTime cutoff = resolveCutoff(range);
        return snapshotRepository.findByRecordedAtAfterOrderByRecordedAtAsc(cutoff)
                .stream()
                .map(s -> new SystemHealthPoint(
                        s.getId(),
                        s.getRecordedAt().atZone(java.time.ZoneOffset.UTC).toInstant(),
                        s.getServicesOnline(),
                        s.getServicesOffline(),
                        s.getTotalServices(),
                        s.getUptimeRate()
                ))
                .toList();
    }

    @Override
    public List<ServiceHistoryPoint> getServiceHistory(String serviceKey, String range) {
        LocalDateTime cutoff = resolveCutoff(range);
        return recordRepository.findByServiceKeyAndRecordedAtAfterOrderByRecordedAtAsc(serviceKey, cutoff)
                .stream()
                .map(r -> new ServiceHistoryPoint(
                        r.getId(),
                        r.getServiceName(),
                        r.getServiceKey(),
                        r.getCategory(),
                        r.getPort(),
                        r.getStatus(),
                        r.getResponseTimeMs(),
                        r.getDbStatus(),
                        r.getRabbitStatus(),
                        r.getDetailsJson(),
                        r.getRecordedAt().atZone(java.time.ZoneOffset.UTC).toInstant()
                ))
                .toList();
    }

    private LocalDateTime resolveCutoff(String range) {
        LocalDateTime now = LocalDateTime.now();
        if ("1h".equalsIgnoreCase(range)) {
            return now.minusHours(1);
        } else if ("7d".equalsIgnoreCase(range)) {
            return now.minusDays(7);
        }
        return now.minusHours(24); // default 24h
    }

    @SuppressWarnings("unchecked")
    private ServiceHealthInfo checkMicroservice(ServiceDefinition svc) {
        String checkedAt = Instant.now().toString();
        long start = System.currentTimeMillis();

        List<String> candidateHosts = "identity-service".equals(svc.key())
                ? List.of("localhost", svc.key())
                : List.of(svc.key(), "localhost");

        for (String host : candidateHosts) {
            String url = "http://" + host + ":" + svc.port() + "/actuator/health";
            try {
                Map<String, Object> body = restTemplate.getForObject(url, Map.class);
                long latency = System.currentTimeMillis() - start;
                if (body != null) {
                    String status = (String) body.getOrDefault("status", "UNKNOWN");
                    Map<String, Object> components = (Map<String, Object>) body.get("components");

                    String dbStatus = extractComponentStatus(components, "db");
                    String rabbitStatus = extractComponentStatus(components, "rabbit");
                    String detailsJson = null;
                    try {
                        detailsJson = objectMapper.writeValueAsString(body);
                    } catch (Exception ignored) {}

                    return new ServiceHealthInfo(
                            svc.name(),
                            svc.key(),
                            svc.category(),
                            svc.port(),
                            status,
                            latency,
                            dbStatus,
                            rabbitStatus,
                            detailsJson,
                            checkedAt
                    );
                }
            } catch (Exception ex) {
                log.debug("Health check failed for '{}' at {}: {}", svc.name(), url, ex.getMessage());
            }
        }

        long latency = System.currentTimeMillis() - start;
        return new ServiceHealthInfo(
                svc.name(),
                svc.key(),
                svc.category(),
                svc.port(),
                "DOWN",
                latency,
                "N/A",
                "N/A",
                null,
                checkedAt
        );
    }

    private ServiceHealthInfo checkMySQL() {
        String checkedAt = Instant.now().toString();
        long start = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            long latency = System.currentTimeMillis() - start;
            return new ServiceHealthInfo(
                    "MySQL Database",
                    "mysql",
                    "INFRASTRUCTURE",
                    3306,
                    "UP",
                    latency,
                    "UP",
                    "N/A",
                    "{\"type\":\"MySQL 8.0\",\"database\":\"procurex_identity\",\"status\":\"Connected\"}",
                    checkedAt
            );
        } catch (Exception ex) {
            long latency = System.currentTimeMillis() - start;
            log.warn("Direct MySQL health check failed: {}", ex.getMessage());
            return new ServiceHealthInfo(
                    "MySQL Database",
                    "mysql",
                    "INFRASTRUCTURE",
                    3306,
                    "DOWN",
                    latency,
                    "DOWN",
                    "N/A",
                    "{\"error\":\"" + ex.getMessage() + "\"}",
                    checkedAt
            );
        }
    }

    private ServiceHealthInfo checkRabbitMQ() {
        String checkedAt = Instant.now().toString();
        long start = System.currentTimeMillis();
        try {
            org.springframework.amqp.rabbit.connection.Connection connection = rabbitConnectionFactory.createConnection();
            boolean isOpen = connection.isOpen();
            connection.close();
            long latency = System.currentTimeMillis() - start;
            return new ServiceHealthInfo(
                    "RabbitMQ Broker",
                    "rabbitmq",
                    "INFRASTRUCTURE",
                    5672,
                    isOpen ? "UP" : "DOWN",
                    latency,
                    "N/A",
                    isOpen ? "UP" : "DOWN",
                    "{\"host\":\"" + rabbitConnectionFactory.getHost() + "\",\"port\":" + rabbitConnectionFactory.getPort() + ",\"status\":\"Connected\"}",
                    checkedAt
            );
        } catch (Exception ex) {
            long latency = System.currentTimeMillis() - start;
            log.warn("Direct RabbitMQ health check failed: {}", ex.getMessage());
            return new ServiceHealthInfo(
                    "RabbitMQ Broker",
                    "rabbitmq",
                    "INFRASTRUCTURE",
                    5672,
                    "DOWN",
                    latency,
                    "N/A",
                    "DOWN",
                    "{\"error\":\"" + ex.getMessage() + "\"}",
                    checkedAt
            );
        }
    }

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
}
