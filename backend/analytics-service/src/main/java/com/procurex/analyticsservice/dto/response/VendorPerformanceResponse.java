package com.procurex.analyticsservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Vendor performance scorecard based on delivery and quality metrics")
public record VendorPerformanceResponse(

        @Schema(description = "Vendor's unique identifier")
        UUID vendorId,

        @Schema(description = "Vendor company name", example = "Acme Supplier Ltd.")
        String vendorName,

        @Schema(description = "Ratio of on-time deliveries to total deliveries (0.0–1.0)", example = "0.92")
        BigDecimal onTimeRatio,

        @Schema(description = "Ratio of accepted items to total inspected items (0.0–1.0)", example = "0.97")
        BigDecimal qualityRatio,

        @Schema(description = "Composite performance score (0.0–5.0, higher is better)", example = "4.3")
        BigDecimal performanceScore,

        @Schema(description = "Total number of PO deliveries made by this vendor", example = "24")
        int totalDeliveries,

        @Schema(description = "Total number of items inspected across all GRNs", example = "480")
        int totalInspectedItems,

        @Schema(description = "Total number of items accepted after quality inspection", example = "466")
        int totalAcceptedItems

) {}
