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
@Table(name = "quotations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"rfq", "items"})
@EqualsAndHashCode(exclude = {"rfq", "items"})
public class Quotation {

    @Id
    @UuidGenerator
    @Column(name = "quotation_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID quotationId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    private RFQ rfq;

    @Column(name = "vendor_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID vendorId;

    @Column(name = "company_name", length = 150, nullable = false)
    private String companyName;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "delivery_days", nullable = false)
    private Integer deliveryDays;

    @Column(name = "payment_terms", length = 150)
    private String paymentTerms;

    @Column(name = "validity_date", nullable = false)
    private LocalDate validityDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private QuotationStatus status;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuotationItem> items = new ArrayList<>();

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.submittedAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = QuotationStatus.SUBMITTED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
