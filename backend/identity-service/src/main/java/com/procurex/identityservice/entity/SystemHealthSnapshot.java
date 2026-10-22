package com.procurex.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "system_health_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemHealthSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "services_online", nullable = false)
    private int servicesOnline;

    @Column(name = "services_offline", nullable = false)
    private int servicesOffline;

    @Column(name = "total_services", nullable = false)
    private int totalServices;

    @Column(name = "uptime_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal uptimeRate;

    @OneToMany(mappedBy = "snapshot", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ServiceHealthRecord> records = new ArrayList<>();
}
