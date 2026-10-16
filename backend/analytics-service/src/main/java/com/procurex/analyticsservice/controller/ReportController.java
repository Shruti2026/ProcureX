package com.procurex.analyticsservice.controller;

import com.procurex.analyticsservice.dto.response.DashboardMetricResponse;
import com.procurex.analyticsservice.dto.response.ProcurementSummaryResponse;
import com.procurex.analyticsservice.dto.response.VendorPerformanceResponse;
import com.procurex.analyticsservice.entity.DashboardMetric;
import com.procurex.analyticsservice.repository.DashboardMetricRepository;
import com.procurex.analyticsservice.service.AnalyticsService;
import com.procurex.analyticsservice.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Analytics", description = "Procurement reports and analytics — procurement summary, vendor performance, dashboard metrics, and spend analysis")
public class ReportController {

    private final AnalyticsService analyticsService;
    private final DashboardMetricRepository dashboardMetricRepository;

    @GetMapping("/procurement-summary")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER')")
    @Operation(summary = "Get a high-level procurement summary for the organization")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Procurement summary retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<ProcurementSummaryResponse>> getProcurementSummary(
            @RequestHeader("X-Organization-Id") String orgId) {

        UUID organizationId = UUID.fromString(orgId);
        long totalPOCount = parseCount(dashboardMetricRepository.findByOrganizationIdAndMetricKey(organizationId, "TOTAL_PO_COUNT"));
        BigDecimal totalPOValueMTD = parseAmount(dashboardMetricRepository.findByOrganizationIdAndMetricKey(organizationId, "TOTAL_PO_VALUE_MTD"));
        long totalGrnCount = parseCount(dashboardMetricRepository.findByOrganizationIdAndMetricKey(organizationId, "TOTAL_GRN_COUNT"));
        long openRfqCount = parseCount(dashboardMetricRepository.findByOrganizationIdAndMetricKey(organizationId, "OPEN_RFQ_COUNT"));

        ProcurementSummaryResponse summary = new ProcurementSummaryResponse(
                totalPOCount, totalPOValueMTD, totalGrnCount, openRfqCount);
        return ResponseEntity.ok(ApiResponse.success("Procurement summary retrieved successfully", summary));
    }

    @GetMapping("/vendor-performance")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER')")
    @Operation(summary = "Get vendor performance scores and delivery metrics for the organization")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Vendor performance data retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<List<VendorPerformanceResponse>>> getVendorPerformance(
            @RequestHeader("X-Organization-Id") String orgId) {

        UUID organizationId = UUID.fromString(orgId);
        List<VendorPerformanceResponse> responses = analyticsService.getVendorRatingCards(organizationId).stream()
                .map(card -> new VendorPerformanceResponse(
                        card.getVendorId(),
                        card.getOnTimeRatio(),
                        card.getQualityRatio(),
                        card.getPerformanceScore(),
                        card.getTotalDeliveries(),
                        card.getTotalInspectedItems(),
                        card.getTotalAcceptedItems()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Vendor performance retrieved successfully", responses));
    }

    @GetMapping("/dashboard-metrics")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','FINANCE_MANAGER')")
    @Operation(summary = "Get all dashboard KPI metrics for the organization")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Dashboard metrics retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<List<DashboardMetricResponse>>> getDashboardMetrics(
            @RequestHeader("X-Organization-Id") String orgId) {

        UUID organizationId = UUID.fromString(orgId);
        List<DashboardMetricResponse> responses = analyticsService.getDashboardMetrics(organizationId).stream()
                .map(m -> new DashboardMetricResponse(
                        m.getMetricKey(), m.getMetricValue(), m.getMetricType(), m.getCalculatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics retrieved successfully", responses));
    }

    @GetMapping("/spend-by-department")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE_MANAGER')")
    @Operation(summary = "Get spend breakdown by department for the current month-to-date")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Spend by department retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<Map<String, String>>> getSpendByDepartment(
            @RequestHeader("X-Organization-Id") String orgId) {

        UUID organizationId = UUID.fromString(orgId);
        Map<String, String> spendMap = new LinkedHashMap<>();
        dashboardMetricRepository.findByOrganizationIdAndMetricKey(organizationId, "TOTAL_PO_VALUE_MTD")
                .ifPresent(m -> spendMap.put("TOTAL_PO_VALUE_MTD", m.getMetricValue()));
        dashboardMetricRepository.findByOrganizationIdAndMetricKey(organizationId, "TOTAL_PAYMENTS_MTD")
                .ifPresent(m -> spendMap.put("TOTAL_PAYMENTS_MTD", m.getMetricValue()));
        return ResponseEntity.ok(ApiResponse.success("Spend by department retrieved successfully", spendMap));
    }

    private long parseCount(Optional<DashboardMetric> metric) {
        return metric.map(m -> {
            try {
                return Long.parseLong(m.getMetricValue());
            } catch (Exception e) {
                return 0L;
            }
        }).orElse(0L);
    }

    private BigDecimal parseAmount(Optional<DashboardMetric> metric) {
        return metric.map(m -> {
            try {
                return new BigDecimal(m.getMetricValue());
            } catch (Exception e) {
                return BigDecimal.ZERO;
            }
        }).orElse(BigDecimal.ZERO);
    }
}
