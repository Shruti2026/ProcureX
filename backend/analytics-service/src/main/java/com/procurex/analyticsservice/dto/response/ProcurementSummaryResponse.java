package com.procurex.analyticsservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Procurement overview KPIs for the current month-to-date period")
public record ProcurementSummaryResponse(

        @Schema(description = "Total number of Purchase Orders raised", example = "42")
        long totalPOCount,

        @Schema(description = "Total value of all POs raised this month in INR", example = "3750000.00")
        BigDecimal totalPOValueMTD,

        @Schema(description = "Total number of Goods Receipt Notes created", example = "38")
        long totalGrnCount,

        @Schema(description = "Number of RFQs currently in OPEN status", example = "5")
        long openRfqCount

) {}
