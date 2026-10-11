package com.procurex.procurementservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rfqs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQ {

    @Id
    @UuidGenerator
    @Column(name = "rfq_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID rfqId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", nullable = false)
    private PurchaseRequisition requisition;

    @Column(name = "rfq_number", length = 20, unique = true, nullable = false)
    private String rfqNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "closing_date", nullable = false)
    private LocalDate closingDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RFQStatus status;

    @OneToMany(mappedBy = "rfq", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RFQVendor> invitedVendors = new ArrayList<>();

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
        if (this.issueDate == null) {
            this.issueDate = LocalDate.now();
        }
        if (this.status == null) {
            this.status = RFQStatus.OPEN;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
