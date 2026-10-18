package com.procurex.analyticsservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "A single KPI metric for the analytics dashboard")
public record DashboardMetricResponse(

        @Schema(description = "Metric identifier key", example = "TOTAL_PO_VALUE_MTD")
        String metricKey,

        @Schema(description = "Current value of the metric (stored as string to support both counts and amounts)", example = "1250000.00")
        String metricValue,

        @Schema(description = "Type of metric", example = "AMOUNT",
                allowableValues = {"COUNT", "AMOUNT", "RATIO"})
        String metricType,

        @Schema(description = "Timestamp when this metric was last calculated")
        LocalDateTime calculatedAt

) {}
