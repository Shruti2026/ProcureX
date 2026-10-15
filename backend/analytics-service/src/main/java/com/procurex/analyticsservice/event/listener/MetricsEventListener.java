package com.procurex.analyticsservice.event.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MetricsEventListener {

    private final AnalyticsService analyticsService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "analytics.po.approved.queue")
    public void onPOApproved(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID organizationId = UUID.fromString(node.get("organizationId").asText());
            BigDecimal totalAmount = new BigDecimal(node.get("totalAmount").asText("0"));
            analyticsService.incrementMetricCount(organizationId, "TOTAL_PO_COUNT");
            analyticsService.addToMetricAmount(organizationId, "TOTAL_PO_VALUE_MTD", totalAmount);
        } catch (Exception e) {
            log.error("Error processing PO approved event: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = "analytics.grn.created.queue")
    public void onGrnCreated(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID organizationId = UUID.fromString(node.get("organizationId").asText());
            analyticsService.incrementMetricCount(organizationId, "TOTAL_GRN_COUNT");
        } catch (Exception e) {
            log.error("Error processing GRN created event: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = "analytics.inspection.completed.queue")
    public void onInspectionCompleted(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID organizationId = UUID.fromString(node.get("organizationId").asText());
            UUID vendorId = UUID.fromString(node.get("vendorId").asText());
            int totalAccepted = node.get("totalAccepted").asInt(0);
            int totalRejected = node.get("totalRejected").asInt(0);
            analyticsService.updateVendorRatingCard(vendorId, organizationId, totalAccepted, totalRejected);
            analyticsService.incrementMetricCount(organizationId, "TOTAL_INSPECTIONS");
        } catch (Exception e) {
            log.error("Error processing inspection completed event: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = "analytics.payment.completed.queue")
    public void onPaymentCompleted(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID organizationId = UUID.fromString(node.get("organizationId").asText());
            BigDecimal amount = new BigDecimal(node.get("amount").asText("0"));
            analyticsService.addToMetricAmount(organizationId, "TOTAL_PAYMENTS_MTD", amount);
        } catch (Exception e) {
            log.error("Error processing payment completed event: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = "analytics.rfq.created.queue")
    public void onRfqCreated(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID organizationId = UUID.fromString(node.get("organizationId").asText());
            analyticsService.incrementMetricCount(organizationId, "OPEN_RFQ_COUNT");
        } catch (Exception e) {
            log.error("Error processing RFQ created event: {}", e.getMessage(), e);
        }
    }
}
