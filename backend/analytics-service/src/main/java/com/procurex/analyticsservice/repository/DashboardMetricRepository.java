package com.procurex.analyticsservice.repository;

import com.procurex.analyticsservice.entity.DashboardMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DashboardMetricRepository extends JpaRepository<DashboardMetric, UUID> {
    Optional<DashboardMetric> findByOrganizationIdAndMetricKey(UUID organizationId, String metricKey);
    List<DashboardMetric> findByOrganizationId(UUID organizationId);
}
