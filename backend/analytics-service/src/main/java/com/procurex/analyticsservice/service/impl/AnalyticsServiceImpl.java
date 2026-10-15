package com.procurex.analyticsservice.service.impl;

import com.procurex.analyticsservice.entity.DashboardMetric;
import com.procurex.analyticsservice.entity.VendorRatingCard;
import com.procurex.analyticsservice.repository.DashboardMetricRepository;
import com.procurex.analyticsservice.repository.VendorRatingCardRepository;
import com.procurex.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final DashboardMetricRepository dashboardMetricRepository;
    private final VendorRatingCardRepository vendorRatingCardRepository;

    @Override
    @Transactional
    public void upsertMetric(UUID orgId, String key, String type, String value) {
        Optional<DashboardMetric> existing = dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key);
        if (existing.isPresent()) {
            DashboardMetric metric = existing.get();
            metric.setMetricValue(value);
            dashboardMetricRepository.save(metric);
        } else {
            DashboardMetric metric = DashboardMetric.builder()
                .organizationId(orgId)
                .metricKey(key)
                .metricType(type)
                .metricValue(value)
                .build();
            dashboardMetricRepository.save(metric);
        }
    }

    @Override
    @Transactional
    public void incrementMetricCount(UUID orgId, String key) {
        Optional<DashboardMetric> existing = dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key);
        long currentValue = existing.map(m -> {
            try { return Long.parseLong(m.getMetricValue()); } catch (NumberFormatException e) { return 0L; }
        }).orElse(0L);
        upsertMetric(orgId, key, "COUNT", String.valueOf(currentValue + 1));
    }

    @Override
    @Transactional
    public void addToMetricAmount(UUID orgId, String key, BigDecimal amount) {
        Optional<DashboardMetric> existing = dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key);
        BigDecimal currentValue = existing.map(m -> {
            try { return new BigDecimal(m.getMetricValue()); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
        }).orElse(BigDecimal.ZERO);
        upsertMetric(orgId, key, "AMOUNT", currentValue.add(amount).toPlainString());
    }

    @Override
    @Transactional
    public void updateVendorRatingCard(UUID vendorId, UUID orgId, int accepted, int rejected) {
        VendorRatingCard card = vendorRatingCardRepository.findByVendorId(vendorId)
            .orElse(VendorRatingCard.builder()
                .vendorId(vendorId)
                .organizationId(orgId)
                .totalDeliveries(0)
                .onTimeDeliveries(0)
                .totalInspectedItems(0)
                .totalAcceptedItems(0)
                .build());
        card.setTotalInspectedItems(card.getTotalInspectedItems() + accepted + rejected);
        card.setTotalAcceptedItems(card.getTotalAcceptedItems() + accepted);
        if (accepted > 0) {
            card.setTotalDeliveries(card.getTotalDeliveries() + 1);
            card.setOnTimeDeliveries(card.getOnTimeDeliveries() + 1);
        }
        vendorRatingCardRepository.save(card);
    }

    @Override
    public List<VendorRatingCard> getVendorRatingCards(UUID orgId) {
        return vendorRatingCardRepository.findByOrganizationId(orgId);
    }

    @Override
    public List<DashboardMetric> getDashboardMetrics(UUID orgId) {
        return dashboardMetricRepository.findByOrganizationId(orgId);
    }
}
