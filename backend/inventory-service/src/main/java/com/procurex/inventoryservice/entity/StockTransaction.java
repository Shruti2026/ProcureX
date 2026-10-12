package com.procurex.inventoryservice.entity;

import com.procurex.inventoryservice.enums.TransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "stock_transactions")
@Immutable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransaction {

    @Id
    @UuidGenerator
    @Column(name = "transaction_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID transactionId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @Column(name = "product_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType transactionType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "reference_id", columnDefinition = "CHAR(36)")
    private String referenceId;

    @Column(name = "reference_type", length = 20)
    private String referenceType;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "performed_by", columnDefinition = "CHAR(36)")
    private UUID performedBy;

    @Column(name = "transaction_at", nullable = false)
    private LocalDateTime transactionAt;

    @PrePersist
    protected void onCreate() {
        if (transactionAt == null) {
            transactionAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }
}
