package com.procurex.financeservice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateBudgetRequest(
        @NotBlank String departmentName,
        @NotNull @Min(2020) Integer fiscalYear,
        @NotNull @DecimalMin("0.01") BigDecimal allocatedAmount
) {}
