package com.procurex.financeservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @UuidGenerator
    private UUID invoiceId;

    private UUID organizationId;
    private UUID purchaseOrderId;
    private UUID vendorId;
    private String vendorName;
    private String invoiceNumber;

    @Column(precision = 15, scale = 2)
    private BigDecimal invoiceAmount;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    @OrderBy("changedAt ASC")
    @Builder.Default
    private List<InvoiceHistory> history = new ArrayList<>();

    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private UUID verifiedBy;
    private LocalDateTime approvedAt;
    private UUID approvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = submittedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = InvoiceStatus.PENDING_VERIFICATION;
        if (vendorName == null) vendorName = "";
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
