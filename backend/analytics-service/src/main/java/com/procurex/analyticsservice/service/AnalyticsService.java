package com.procurex.analyticsservice.service;

import com.procurex.analyticsservice.entity.DashboardMetric;
import com.procurex.analyticsservice.entity.VendorRatingCard;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AnalyticsService {
    void upsertMetric(UUID orgId, String key, String type, String value);
    void incrementMetricCount(UUID orgId, String key);
    void addToMetricAmount(UUID orgId, String key, BigDecimal amount);
    void updateVendorRatingCard(UUID vendorId, UUID orgId, int accepted, int rejected);
    List<VendorRatingCard> getVendorRatingCards(UUID orgId);
    List<DashboardMetric> getDashboardMetrics(UUID orgId);
}
