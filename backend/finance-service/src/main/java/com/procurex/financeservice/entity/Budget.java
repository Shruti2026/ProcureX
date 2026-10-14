package com.procurex.financeservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budgets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @UuidGenerator
    private UUID budgetId;

    private UUID organizationId;
    private String departmentName;
    private Integer fiscalYear;

    @Column(precision = 15, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal usedAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal committedAmount;

    @Version
    private Integer version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = updatedAt = LocalDateTime.now();
        if (usedAmount == null)      usedAmount = BigDecimal.ZERO;
        if (committedAmount == null) committedAmount = BigDecimal.ZERO;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
