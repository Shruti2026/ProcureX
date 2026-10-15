package com.procurex.notificationservice.event.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Handles procurement.po.approved events.
 * Payload: { poId, vendorId, organizationId, totalAmount, items:[...] }
 * Vendor email is NOT in this payload — in-app only for Day 6.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class POApprovedEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper        objectMapper;

    @RabbitListener(queues = "notification.po.approved.queue")
    public void handlePOApproved(String payload) {
        try {
            Map<String, Object> event = objectMapper.readValue(payload, Map.class);

            UUID   orgId   = UUID.fromString((String) event.get("organizationId"));
            String poId    = (String) event.get("poId");
            String amount  = event.get("totalAmount") != null
                    ? event.get("totalAmount").toString() : "N/A";

            String title   = "Purchase Order Approved";
            String message = "A purchase order (PO ID: " + poId + ") with amount " + amount
                    + " has been approved for your organization.";

            // In-app only — vendor email not available in this event payload
            notificationService.saveInApp(
                    null, "", orgId,
                    "procurement.po.approved", title, message
            );

            log.info("PO approved in-app notification saved for org={}", orgId);
        } catch (Exception e) {
            log.error("Failed to process PO approved event: {}", e.getMessage(), e);
        }
    }
}
