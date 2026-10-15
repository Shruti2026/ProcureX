package com.procurex.analyticsservice.dto.response;

import java.time.LocalDateTime;

public record DashboardMetricResponse(
        String metricKey,
        String metricValue,
        String metricType,
        LocalDateTime calculatedAt
) {}
