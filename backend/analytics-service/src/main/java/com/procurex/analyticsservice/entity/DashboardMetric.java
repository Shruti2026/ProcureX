package com.procurex.analyticsservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dashboard_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetric {
    @Id
    @UuidGenerator
    @Column(name = "metric_id", nullable = false, updatable = false)
    private UUID metricId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "metric_key", nullable = false)
    private String metricKey;

    @Column(name = "metric_value", nullable = false)
    private String metricValue;

    @Column(name = "metric_type", nullable = false)
    private String metricType;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
