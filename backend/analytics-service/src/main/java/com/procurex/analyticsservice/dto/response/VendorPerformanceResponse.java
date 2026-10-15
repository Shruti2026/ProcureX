package com.procurex.analyticsservice.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record VendorPerformanceResponse(
        UUID vendorId,
        BigDecimal onTimeRatio,
        BigDecimal qualityRatio,
        BigDecimal performanceScore,
        int totalDeliveries,
        int totalInspectedItems,
        int totalAcceptedItems
) {}
