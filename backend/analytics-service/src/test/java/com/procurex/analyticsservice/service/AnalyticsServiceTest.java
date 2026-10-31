package com.procurex.analyticsservice.service;

import com.procurex.analyticsservice.entity.DashboardMetric;
import com.procurex.analyticsservice.entity.VendorRatingCard;
import com.procurex.analyticsservice.repository.DashboardMetricRepository;
import com.procurex.analyticsservice.repository.VendorRatingCardRepository;
import com.procurex.analyticsservice.service.impl.AnalyticsServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private DashboardMetricRepository dashboardMetricRepository;

    @Mock
    private VendorRatingCardRepository vendorRatingCardRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    // -----------------------------------------------------------------------
    // incrementMetricCount
    // -----------------------------------------------------------------------

    @Test
    void incrementMetricCount_existingMetric_incrementsValue() {
        UUID orgId = UUID.randomUUID();
        String key  = "TOTAL_ORDERS";

        DashboardMetric existing = DashboardMetric.builder()
                .metricId(UUID.randomUUID())
                .organizationId(orgId)
                .metricKey(key)
                .metricType("COUNT")
                .metricValue("5")
                .build();

        when(dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key))
                .thenReturn(Optional.of(existing))   // first call — in incrementMetricCount
                .thenReturn(Optional.of(existing));  // second call — in upsertMetric

        when(dashboardMetricRepository.save(any(DashboardMetric.class))).thenAnswer(inv -> inv.getArgument(0));

        analyticsService.incrementMetricCount(orgId, key);

        ArgumentCaptor<DashboardMetric> captor = ArgumentCaptor.forClass(DashboardMetric.class);
        verify(dashboardMetricRepository, atLeastOnce()).save(captor.capture());
        DashboardMetric saved = captor.getValue();

        assertThat(saved.getMetricValue()).isEqualTo("6");
    }

    @Test
    void incrementMetricCount_newMetric_createsWithOne() {
        UUID orgId = UUID.randomUUID();
        String key  = "NEW_METRIC";

        when(dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key))
                .thenReturn(Optional.empty());

        when(dashboardMetricRepository.save(any(DashboardMetric.class))).thenAnswer(inv -> inv.getArgument(0));

        analyticsService.incrementMetricCount(orgId, key);

        ArgumentCaptor<DashboardMetric> captor = ArgumentCaptor.forClass(DashboardMetric.class);
        verify(dashboardMetricRepository, atLeastOnce()).save(captor.capture());
        DashboardMetric saved = captor.getValue();

        assertThat(saved.getMetricValue()).isEqualTo("1");
        assertThat(saved.getMetricType()).isEqualTo("COUNT");
        assertThat(saved.getOrganizationId()).isEqualTo(orgId);
        assertThat(saved.getMetricKey()).isEqualTo(key);
    }

    // -----------------------------------------------------------------------
    // addToMetricAmount
    // -----------------------------------------------------------------------

    @Test
    void addToMetricAmount_existingMetric_addsAmount() {
        UUID orgId = UUID.randomUUID();
        String key  = "TOTAL_SPEND";

        DashboardMetric existing = DashboardMetric.builder()
                .metricId(UUID.randomUUID())
                .organizationId(orgId)
                .metricKey(key)
                .metricType("AMOUNT")
                .metricValue("100.00")
                .build();

        when(dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key))
                .thenReturn(Optional.of(existing))
                .thenReturn(Optional.of(existing));

        when(dashboardMetricRepository.save(any(DashboardMetric.class))).thenAnswer(inv -> inv.getArgument(0));

        analyticsService.addToMetricAmount(orgId, key, new BigDecimal("50.00"));

        ArgumentCaptor<DashboardMetric> captor = ArgumentCaptor.forClass(DashboardMetric.class);
        verify(dashboardMetricRepository, atLeastOnce()).save(captor.capture());
        DashboardMetric saved = captor.getValue();

        assertThat(new BigDecimal(saved.getMetricValue())).isEqualByComparingTo(new BigDecimal("150.00"));
    }

    @Test
    void addToMetricAmount_newMetric_createsWithAmount() {
        UUID orgId = UUID.randomUUID();
        String key  = "NEW_SPEND";

        when(dashboardMetricRepository.findByOrganizationIdAndMetricKey(orgId, key))
                .thenReturn(Optional.empty());

        when(dashboardMetricRepository.save(any(DashboardMetric.class))).thenAnswer(inv -> inv.getArgument(0));

        analyticsService.addToMetricAmount(orgId, key, new BigDecimal("75.50"));

        ArgumentCaptor<DashboardMetric> captor = ArgumentCaptor.forClass(DashboardMetric.class);
        verify(dashboardMetricRepository, atLeastOnce()).save(captor.capture());
        DashboardMetric saved = captor.getValue();

        assertThat(new BigDecimal(saved.getMetricValue())).isEqualByComparingTo(new BigDecimal("75.50"));
        assertThat(saved.getMetricType()).isEqualTo("AMOUNT");
    }

    // -----------------------------------------------------------------------
    // updateVendorRatingCard
    // -----------------------------------------------------------------------

    @Test
    void updateVendorRatingCard_newCard_createsCard() {
        UUID vendorId = UUID.randomUUID();
        UUID orgId    = UUID.randomUUID();

        when(vendorRatingCardRepository.findByVendorId(vendorId)).thenReturn(Optional.empty());
        when(vendorRatingCardRepository.save(any(VendorRatingCard.class))).thenAnswer(inv -> inv.getArgument(0));

        analyticsService.updateVendorRatingCard(vendorId, orgId, "Test Vendor", 8, 2);

        ArgumentCaptor<VendorRatingCard> captor = ArgumentCaptor.forClass(VendorRatingCard.class);
        verify(vendorRatingCardRepository).save(captor.capture());
        VendorRatingCard saved = captor.getValue();

        assertThat(saved.getVendorId()).isEqualTo(vendorId);
        assertThat(saved.getOrganizationId()).isEqualTo(orgId);
        // accepted=8, rejected=2 → totalInspectedItems = 0+8+2 = 10
        assertThat(saved.getTotalInspectedItems()).isEqualTo(10);
        // totalAcceptedItems = 0+8 = 8
        assertThat(saved.getTotalAcceptedItems()).isEqualTo(8);
        // accepted>0 → totalDeliveries=1, onTimeDeliveries=1
        assertThat(saved.getTotalDeliveries()).isEqualTo(1);
        assertThat(saved.getOnTimeDeliveries()).isEqualTo(1);
    }

    @Test
    void updateVendorRatingCard_existingCard_updatesCard() {
        UUID vendorId = UUID.randomUUID();
        UUID orgId    = UUID.randomUUID();

        VendorRatingCard existing = VendorRatingCard.builder()
                .ratingCardId(UUID.randomUUID())
                .vendorId(vendorId)
                .vendorName("Existing Vendor")
                .organizationId(orgId)
                .totalDeliveries(5)
                .onTimeDeliveries(4)
                .totalInspectedItems(50)
                .totalAcceptedItems(45)
                .build();

        when(vendorRatingCardRepository.findByVendorId(vendorId)).thenReturn(Optional.of(existing));
        when(vendorRatingCardRepository.save(any(VendorRatingCard.class))).thenAnswer(inv -> inv.getArgument(0));

        analyticsService.updateVendorRatingCard(vendorId, orgId, "Test Vendor", 10, 0);

        ArgumentCaptor<VendorRatingCard> captor = ArgumentCaptor.forClass(VendorRatingCard.class);
        verify(vendorRatingCardRepository).save(captor.capture());
        VendorRatingCard saved = captor.getValue();

        // totalInspectedItems = 50+10+0 = 60
        assertThat(saved.getTotalInspectedItems()).isEqualTo(60);
        // totalAcceptedItems = 45+10 = 55
        assertThat(saved.getTotalAcceptedItems()).isEqualTo(55);
        // accepted>0 → totalDeliveries=6, onTimeDeliveries=5
        assertThat(saved.getTotalDeliveries()).isEqualTo(6);
        assertThat(saved.getOnTimeDeliveries()).isEqualTo(5);
    }
}
