package com.procurex.inventoryservice.entity;

import com.procurex.inventoryservice.enums.GrnStatus;
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
@Table(name = "goods_receipt_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptNote {

    @Id
    @UuidGenerator
    @Column(name = "grn_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID grnId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @Column(name = "purchase_order_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID purchaseOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "grn_number", length = 30, unique = true, nullable = false)
    private String grnNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private GrnStatus status;

    @OneToMany(mappedBy = "grn", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GrnItem> items = new ArrayList<>();

    @Column(name = "received_by", columnDefinition = "CHAR(36)", nullable = false)
    private UUID receivedBy;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (status == null) {
            status = GrnStatus.PENDING_INSPECTION;
        }
        receivedAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
