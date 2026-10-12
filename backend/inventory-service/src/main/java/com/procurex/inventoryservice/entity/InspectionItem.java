package com.procurex.inventoryservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "inspection_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "inspection")
@EqualsAndHashCode(exclude = "inspection")
public class InspectionItem {

    @Id
    @UuidGenerator
    @Column(name = "inspection_item_id", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID inspectionItemId;

    @Column(name = "organization_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private QualityInspection inspection;

    @Column(name = "product_id", columnDefinition = "CHAR(36)", nullable = false)
    private UUID productId;

    @Column(name = "accepted_quantity", nullable = false)
    private Integer acceptedQuantity;

    @Column(name = "rejected_quantity", nullable = false)
    private Integer rejectedQuantity;

    @Column(name = "reason_for_rejection", columnDefinition = "TEXT")
    private String reasonForRejection;
}
