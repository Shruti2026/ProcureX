package com.procurex.analyticsservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vendor_rating_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorRatingCard {
    @Id
    @UuidGenerator
    @Column(name = "rating_card_id", nullable = false, updatable = false)
    private UUID ratingCardId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "vendor_id", nullable = false, unique = true)
    private UUID vendorId;

    @Column(name = "total_deliveries")
    private int totalDeliveries;

    @Column(name = "on_time_deliveries")
    private int onTimeDeliveries;

    @Column(name = "total_inspected_items")
    private int totalInspectedItems;

    @Column(name = "total_accepted_items")
    private int totalAcceptedItems;

    @Column(name = "on_time_ratio", precision = 3, scale = 2)
    private BigDecimal onTimeRatio;

    @Column(name = "quality_ratio", precision = 3, scale = 2)
    private BigDecimal qualityRatio;

    @Column(name = "performance_score", precision = 2, scale = 1)
    private BigDecimal performanceScore;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (onTimeRatio == null) onTimeRatio = BigDecimal.ZERO;
        if (qualityRatio == null) qualityRatio = BigDecimal.ZERO;
        if (performanceScore == null) performanceScore = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
