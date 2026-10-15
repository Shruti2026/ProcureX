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
 * Handles finance.payment.completed events.
 * Payload: { paymentId, invoiceId, poId, vendorId, orgId, amount, method, transactionRef }
 * Vendor email is NOT in this payload — in-app only for Day 6.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentCompletedEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper        objectMapper;

    @RabbitListener(queues = "notification.payment.completed.queue")
    public void handlePaymentCompleted(String payload) {
        try {
            Map<String, Object> event = objectMapper.readValue(payload, Map.class);

            UUID   orgId         = UUID.fromString((String) event.get("orgId"));
            String invoiceId     = (String) event.get("invoiceId");
            String amount        = event.get("amount") != null ? event.get("amount").toString() : "N/A";
            String transactionRef = (String) event.get("transactionRef");

            String title   = "Payment Completed";
            String message = "Payment of " + amount + " for invoice " + invoiceId
                    + " has been completed. Transaction reference: " + transactionRef;

            // In-app only — vendor email not available in this event payload
            notificationService.saveInApp(
                    null, "", orgId,
                    "finance.payment.completed", title, message
            );

            log.info("Payment completed in-app notification saved for org={}", orgId);
        } catch (Exception e) {
            log.error("Failed to process payment completed event: {}", e.getMessage(), e);
        }
    }
}
