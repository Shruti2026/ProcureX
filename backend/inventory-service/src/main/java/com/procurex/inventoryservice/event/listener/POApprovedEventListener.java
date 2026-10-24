package com.procurex.inventoryservice.event.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.inventoryservice.repository.GoodsReceiptNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Consumes {@code procurement.po.approved} events from {@code inventory.queue}.
 * <p>
 * When a PO is approved this listener checks whether a GRN already exists for it.
 * If not, it logs that the PO is ready for GRN creation — actual GRN creation
 * requires warehouse selection by the inventory manager and therefore cannot be
 * automated here.
 * </p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class POApprovedEventListener {

    private final GoodsReceiptNoteRepository goodsReceiptNoteRepository;
    private final ObjectMapper               objectMapper;

    @RabbitListener(queues = "inventory.queue")
    public void handlePOApproved(String payload) {
        try {
            Map<String, Object> event = objectMapper.readValue(payload, Map.class);

            UUID poId           = UUID.fromString((String) event.get("poId"));
            UUID organizationId = UUID.fromString((String) event.get("organizationId"));
            UUID vendorId       = UUID.fromString((String) event.get("vendorId"));

            if (goodsReceiptNoteRepository.existsByPurchaseOrderId(poId)) {
                log.info("GRN already exists for PO {} (org {}), skipping.", poId, organizationId);
                return;
            }

            log.info(
                "PO {} (org {}, vendor {}) is approved and available for GRN creation.",
                poId, organizationId, vendorId
            );
        } catch (Exception e) {
            log.error("Failed to process procurement.po.approved event: {}", e.getMessage(), e);
        }
    }
}
