package com.procurex.procurementservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "purchase_order_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "purchaseOrder")
@EqualsAndHashCode(exclude = "purchaseOrder")
public class PurchaseOrderHistory {

    @Id
    @UuidGenerator
    @Column(name = "history_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID historyId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private POStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false)
    private POStatus toStatus;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "changed_by", columnDefinition = "CHAR(36)", nullable = false)
    private UUID changedBy;

    @Column(name = "changed_at")
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        this.changedAt = LocalDateTime.now();
    }
}
