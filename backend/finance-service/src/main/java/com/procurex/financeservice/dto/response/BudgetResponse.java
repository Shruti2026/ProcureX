package com.procurex.financeservice.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BudgetResponse(
        UUID budgetId,
        String departmentName,
        int fiscalYear,
        BigDecimal allocatedAmount,
        BigDecimal usedAmount,
        BigDecimal committedAmount,
        BigDecimal availableAmount,
        LocalDateTime createdAt
) {}
