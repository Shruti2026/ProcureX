package com.procurex.financeservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "Request body for creating a department budget")
public record CreateBudgetRequest(

        @Schema(description = "Name of the department this budget is allocated to", example = "Engineering")
        @NotBlank
        String departmentName,

        @Schema(description = "Fiscal year for this budget (e.g. 2026 for FY 2026-27)", example = "2026")
        @NotNull
        @Min(2020)
        Integer fiscalYear,

        @Schema(description = "Total amount allocated to this department in INR (minimum ₹0.01)", example = "500000.00")
        @NotNull
        @DecimalMin("0.01")
        BigDecimal allocatedAmount

) {}
