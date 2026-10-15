package com.procurex.analyticsservice.dto.response;

import java.math.BigDecimal;

public record ProcurementSummaryResponse(
        long totalPOCount,
        BigDecimal totalPOValueMTD,
        long totalGrnCount,
        long openRfqCount
) {}
