package com.procurex.financeservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "Department budget details including utilization breakdown")
public record BudgetResponse(

        @Schema(description = "Unique identifier of the budget record")
        UUID budgetId,

        @Schema(description = "Department name this budget belongs to", example = "Engineering")
        String departmentName,

        @Schema(description = "Fiscal year this budget covers", example = "2026")
        int fiscalYear,

        @Schema(description = "Total amount allocated to this department in INR", example = "500000.00")
        BigDecimal allocatedAmount,

        @Schema(description = "Amount already spent (paid invoices)", example = "120000.00")
        BigDecimal usedAmount,

        @Schema(description = "Amount reserved for approved but not yet paid POs", example = "80000.00")
        BigDecimal committedAmount,

        @Schema(description = "Remaining available amount (allocated − used − committed)", example = "300000.00")
        BigDecimal availableAmount,

        @Schema(description = "Timestamp when the budget was created")
        LocalDateTime createdAt

) {}
