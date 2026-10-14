package com.procurex.financeservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invoice_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceHistory {

    @Id
    @UuidGenerator
    private UUID historyId;

    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus fromStatus;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus toStatus;

    private String remarks;
    private UUID changedBy;
    private LocalDateTime changedAt;

    @PrePersist
    void prePersist() {
        changedAt = LocalDateTime.now();
    }
}
