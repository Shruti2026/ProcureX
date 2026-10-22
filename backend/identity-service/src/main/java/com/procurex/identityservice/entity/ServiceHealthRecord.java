package com.procurex.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "service_health_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceHealthRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private SystemHealthSnapshot snapshot;

    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "service_key", nullable = false, length = 100)
    private String serviceKey;

    @Column(name = "category", nullable = false, length = 30)
    private String category;

    @Column(name = "port", nullable = false)
    private int port;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "response_time_ms", nullable = false)
    private long responseTimeMs;

    @Column(name = "db_status", nullable = false, length = 20)
    private String dbStatus;

    @Column(name = "rabbit_status", nullable = false, length = 20)
    private String rabbitStatus;

    @Column(name = "details_json", columnDefinition = "TEXT")
    private String detailsJson;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
