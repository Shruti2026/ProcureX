package com.procurex.procurementservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"items", "history"})
@EqualsAndHashCode(exclude = {"items", "history"})
public class PurchaseOrder {

    @Id
    @UuidGenerator
    @Column(name = "purchase_order_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID purchaseOrderId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @Column(name = "po_number", length = 30, unique = true, nullable = false)
    private String poNumber;

    @Column(name = "quotation_id", columnDefinition = "CHAR(36)")
    private UUID quotationId;

    @Column(name = "vendor_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID vendorId;

    @Column(name = "company_name", length = 150, nullable = false)
    private String companyName;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "expected_delivery", nullable = false)
    private LocalDate expectedDelivery;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private POStatus status;

    @Column(name = "approved_by", columnDefinition = "CHAR(36)")
    private UUID approvedBy;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseOrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL)
    @OrderBy("changedAt ASC")
    @Builder.Default
    private List<PurchaseOrderHistory> history = new ArrayList<>();

    @Column(name = "created_by", columnDefinition = "CHAR(36)", nullable = false)
    private UUID createdBy;

    @Column(name = "updated_by", columnDefinition = "CHAR(36)")
    private UUID updatedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = POStatus.CREATED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
