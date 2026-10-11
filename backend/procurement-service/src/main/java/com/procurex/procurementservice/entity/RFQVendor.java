package com.procurex.procurementservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rfq_vendors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQVendor {

    @Id
    @UuidGenerator
    @Column(name = "rfq_vendor_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID rfqVendorId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    private RFQ rfq;

    @Column(name = "vendor_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID vendorId;

    @Column(name = "company_name", length = 150, nullable = false)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(name = "invitation_status", nullable = false)
    private InvitationStatus invitationStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.invitationStatus == null) {
            this.invitationStatus = InvitationStatus.SENT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
