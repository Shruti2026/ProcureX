package com.procurex.procurementservice.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.procurementservice.dto.request.CreatePurchaseOrderRequest;
import com.procurex.procurementservice.dto.response.PurchaseOrderHistoryResponse;
import com.procurex.procurementservice.dto.response.PurchaseOrderItemResponse;
import com.procurex.procurementservice.dto.response.PurchaseOrderResponse;
import com.procurex.procurementservice.entity.OutboxEvent;
import com.procurex.procurementservice.entity.POStatus;
import com.procurex.procurementservice.entity.PurchaseOrder;
import com.procurex.procurementservice.entity.PurchaseOrderHistory;
import com.procurex.procurementservice.entity.PurchaseOrderItem;
import com.procurex.procurementservice.entity.Quotation;
import com.procurex.procurementservice.entity.QuotationStatus;
import com.procurex.procurementservice.entity.RFQStatus;
import com.procurex.procurementservice.exception.ResourceNotFoundException;
import com.procurex.procurementservice.repository.OutboxEventRepository;
import com.procurex.procurementservice.repository.PurchaseOrderRepository;
import com.procurex.procurementservice.repository.QuotationRepository;
import com.procurex.procurementservice.repository.RFQRepository;
import com.procurex.procurementservice.service.PurchaseOrderService;
import com.procurex.procurementservice.util.PONumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final QuotationRepository quotationRepository;
    private final RFQRepository rfqRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final PONumberGenerator poNumberGenerator;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PurchaseOrderResponse createFromQuotation(CreatePurchaseOrderRequest request,
                                                      UUID createdBy, UUID orgId) {
        // 1. Load quotation
        Quotation quotation = quotationRepository.findById(request.quotationId())
                .filter(q -> q.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Quotation not found with id: " + request.quotationId()));

        // 2. Quotation must be SUBMITTED
        if (quotation.getStatus() != QuotationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Quotation is not in SUBMITTED status");
        }

        // 3. RFQ must be OPEN
        if (quotation.getRfq().getStatus() != RFQStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "RFQ has already been awarded or closed");
        }

        // 4a. Set winning quotation to SELECTED
        quotation.setStatus(QuotationStatus.SELECTED);
        quotationRepository.save(quotation);

        // 4b. Reject all other quotations for same RFQ
        List<Quotation> othersToReject = quotationRepository
                .findByRfq_RfqIdAndStatusNot(quotation.getRfq().getRfqId(), QuotationStatus.SELECTED);
        othersToReject.forEach(q -> q.setStatus(QuotationStatus.REJECTED));
        quotationRepository.saveAll(othersToReject);

        // 4c. Award RFQ
        quotation.getRfq().setStatus(RFQStatus.AWARDED);
        rfqRepository.save(quotation.getRfq());

        // 4d. Generate PO number
        String poNumber = poNumberGenerator.generate();

        // 4e. Build purchase order items from quotation items
        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .organizationId(orgId)
                .poNumber(poNumber)
                .quotationId(quotation.getQuotationId())
                .vendorId(quotation.getVendorId())
                .companyName(quotation.getCompanyName())
                .orderDate(LocalDate.now())
                .expectedDelivery(request.expectedDelivery())
                .totalAmount(quotation.getTotalAmount())
                .createdBy(createdBy)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();

        // Copy quotation items to PO items
        quotation.getItems().forEach(qi -> {
            PurchaseOrderItem poItem = PurchaseOrderItem.builder()
                    .organizationId(orgId)
                    .purchaseOrder(purchaseOrder)
                    .productId(qi.getProductId())
                    .productName(qi.getProductName())
                    .quantity(qi.getQuantity())
                    .unitPrice(qi.getUnitPrice())
                    .totalPrice(qi.getTotalPrice())
                    .build();
            purchaseOrder.getItems().add(poItem);
        });

        // 4h. Add initial history entry
        PurchaseOrderHistory initialHistory = PurchaseOrderHistory.builder()
                .organizationId(orgId)
                .purchaseOrder(purchaseOrder)
                .fromStatus(null)
                .toStatus(POStatus.CREATED)
                .changedBy(createdBy)
                .build();
        purchaseOrder.getHistory().add(initialHistory);

        // 4i. Save PO (cascades items and history)
        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);

        log.info("Created PO {} for org {}", saved.getPoNumber(), orgId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> getAll(UUID orgId, POStatus status, Pageable pageable) {
        Page<PurchaseOrder> page;
        if (status != null) {
            page = purchaseOrderRepository.findByOrganizationIdAndStatus(orgId, status, pageable);
        } else {
            page = purchaseOrderRepository.findByOrganizationId(orgId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(UUID poId, UUID orgId) {
        PurchaseOrder po = purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order not found with id: " + poId));
        return toResponse(po);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse approve(UUID poId, UUID orgId, UUID managerId, String remarks) {
        // 1. Load PO
        PurchaseOrder po = purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order not found with id: " + poId));

        // 2. Must be CREATED
        if (po.getStatus() != POStatus.CREATED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Purchase order is not in CREATED status");
        }

        POStatus previousStatus = po.getStatus();

        // 3. Update PO
        po.setStatus(POStatus.APPROVED);
        po.setApprovedBy(managerId);
        po.setUpdatedBy(managerId);

        // 4. Add history entry
        PurchaseOrderHistory historyEntry = PurchaseOrderHistory.builder()
                .organizationId(orgId)
                .purchaseOrder(po)
                .fromStatus(previousStatus)
                .toStatus(POStatus.APPROVED)
                .remarks(remarks)
                .changedBy(managerId)
                .build();
        po.getHistory().add(historyEntry);

        // 5 & 6. Build and save OutboxEvent in same transaction
        String payload = buildPoApprovedPayload(po);
        OutboxEvent outboxEvent = OutboxEvent.builder()
                .eventType("procurement.po.approved")
                .aggregateType("PURCHASE_ORDER")
                .aggregateId(po.getPurchaseOrderId())
                .payload(payload)
                .build();
        outboxEventRepository.save(outboxEvent);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Approved PO {} by manager {}", saved.getPoNumber(), managerId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse cancel(UUID poId, UUID orgId, UUID managerId, String remarks) {
        // 1. Load PO
        PurchaseOrder po = purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order not found with id: " + poId));

        // 2. Must be CREATED or APPROVED
        if (po.getStatus() != POStatus.CREATED && po.getStatus() != POStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Purchase order cannot be cancelled in its current status: " + po.getStatus());
        }

        POStatus previousStatus = po.getStatus();

        // 3. Update PO
        po.setStatus(POStatus.CANCELLED);
        po.setUpdatedBy(managerId);

        // 4. Add history entry
        PurchaseOrderHistory historyEntry = PurchaseOrderHistory.builder()
                .organizationId(orgId)
                .purchaseOrder(po)
                .fromStatus(previousStatus)
                .toStatus(POStatus.CANCELLED)
                .remarks(remarks)
                .changedBy(managerId)
                .build();
        po.getHistory().add(historyEntry);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Cancelled PO {} by manager {}", saved.getPoNumber(), managerId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse accept(UUID poId, UUID orgId, UUID vendorUserId, String remarks) {
        // 1. Load PO
        PurchaseOrder po = purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order not found with id: " + poId));

        // 2. Must be APPROVED
        if (po.getStatus() != POStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Purchase order is not in APPROVED status");
        }

        POStatus previousStatus = po.getStatus();

        // 3. Update PO
        po.setStatus(POStatus.ACCEPTED);
        po.setUpdatedBy(vendorUserId);

        // 4. Add history entry
        PurchaseOrderHistory historyEntry = PurchaseOrderHistory.builder()
                .organizationId(orgId)
                .purchaseOrder(po)
                .fromStatus(previousStatus)
                .toStatus(POStatus.ACCEPTED)
                .remarks(remarks)
                .changedBy(vendorUserId)
                .build();
        po.getHistory().add(historyEntry);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Vendor accepted PO {}", saved.getPoNumber());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse decline(UUID poId, UUID orgId, UUID vendorUserId, String reason) {
        // 1. Load PO
        PurchaseOrder po = purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order not found with id: " + poId));

        // 2. Must be APPROVED
        if (po.getStatus() != POStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Purchase order is not in APPROVED status");
        }

        POStatus previousStatus = po.getStatus();

        // 3. Update PO
        po.setStatus(POStatus.CANCELLED);
        po.setUpdatedBy(vendorUserId);

        // 4. Add history entry (reason stored in remarks)
        PurchaseOrderHistory historyEntry = PurchaseOrderHistory.builder()
                .organizationId(orgId)
                .purchaseOrder(po)
                .fromStatus(previousStatus)
                .toStatus(POStatus.CANCELLED)
                .remarks(reason)
                .changedBy(vendorUserId)
                .build();
        po.getHistory().add(historyEntry);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Vendor declined PO {}: {}", saved.getPoNumber(), reason);
        return toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String buildPoApprovedPayload(PurchaseOrder po) {
        try {
            List<Map<String, Object>> itemsList = po.getItems().stream()
                    .map(item -> {
                        Map<String, Object> itemMap = new LinkedHashMap<>();
                        itemMap.put("productId", item.getProductId().toString());
                        itemMap.put("quantity", item.getQuantity());
                        itemMap.put("unitPrice", item.getUnitPrice());
                        return itemMap;
                    })
                    .toList();

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("poId", po.getPurchaseOrderId().toString());
            payload.put("vendorId", po.getVendorId().toString());
            payload.put("organizationId", po.getOrganizationId().toString());
            payload.put("totalAmount", po.getTotalAmount());
            payload.put("items", itemsList);

            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize PO approved payload for PO {}: {}", po.getPurchaseOrderId(), e.getMessage());
            return "{}";
        }
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        List<PurchaseOrderItemResponse> itemResponses = po.getItems().stream()
                .map(item -> new PurchaseOrderItemResponse(
                        item.getPoItemId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTotalPrice()
                ))
                .toList();

        List<PurchaseOrderHistoryResponse> historyResponses = po.getHistory().stream()
                .map(h -> new PurchaseOrderHistoryResponse(
                        h.getFromStatus(),
                        h.getToStatus(),
                        h.getRemarks(),
                        h.getChangedBy(),
                        h.getChangedAt()
                ))
                .toList();

        return new PurchaseOrderResponse(
                po.getPurchaseOrderId(),
                po.getPoNumber(),
                po.getVendorId(),
                po.getCompanyName(),
                po.getOrderDate(),
                po.getExpectedDelivery(),
                po.getTotalAmount(),
                po.getStatus(),
                po.getApprovedBy(),
                itemResponses,
                historyResponses,
                po.getCreatedAt(),
                po.getUpdatedAt()
        );
    }
}
