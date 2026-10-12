package com.procurex.inventoryservice.entity;

import com.procurex.inventoryservice.enums.InspectionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quality_inspections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QualityInspection {

    @Id
    @UuidGenerator
    @Column(name = "inspection_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID inspectionId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false, unique = true)
    private GoodsReceiptNote grn;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InspectionItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    private InspectionStatus status;

    @Column(name = "inspected_by", columnDefinition = "CHAR(36)")
    private UUID inspectedBy;

    @Column(name = "inspected_at")
    private LocalDateTime inspectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (status == null) {
            status = InspectionStatus.PENDING;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
