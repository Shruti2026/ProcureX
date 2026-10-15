package com.procurex.inventoryservice.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.inventoryservice.client.POItemData;
import com.procurex.inventoryservice.client.ProcurementServiceClient;
import com.procurex.inventoryservice.client.PurchaseOrderClientResponse;
import com.procurex.inventoryservice.dto.request.CreateGrnRequest;
import com.procurex.inventoryservice.dto.request.GrnItemRequest;
import com.procurex.inventoryservice.dto.response.GrnItemResponse;
import com.procurex.inventoryservice.dto.response.GrnResponse;
import com.procurex.inventoryservice.entity.GoodsReceiptNote;
import com.procurex.inventoryservice.entity.GrnItem;
import com.procurex.inventoryservice.entity.OutboxEvent;
import com.procurex.inventoryservice.entity.Warehouse;
import com.procurex.inventoryservice.enums.GrnStatus;
import com.procurex.inventoryservice.exception.ConflictException;
import com.procurex.inventoryservice.exception.ResourceNotFoundException;
import com.procurex.inventoryservice.exception.ValidationException;
import com.procurex.inventoryservice.repository.GoodsReceiptNoteRepository;
import com.procurex.inventoryservice.repository.OutboxEventRepository;
import com.procurex.inventoryservice.repository.WarehouseRepository;
import com.procurex.inventoryservice.service.GRNService;
import com.procurex.inventoryservice.util.GRNNumberGenerator;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GRNServiceImpl implements GRNService {

    private final GoodsReceiptNoteRepository grnRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProcurementServiceClient procurementClient;
    private final GRNNumberGenerator grnNumberGenerator;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public GrnResponse create(CreateGrnRequest request, UsernamePasswordAuthenticationToken auth) {
        // 1. Extract org and user from auth
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        UUID orgId = UUID.fromString((String) details.get("organizationId"));
        UUID userId = UUID.fromString(auth.getName());

        // 2. Load and validate warehouse
        Warehouse warehouse = warehouseRepository
                .findByWarehouseIdAndOrganizationId(request.warehouseId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Warehouse not found with id: " + request.warehouseId()));

        // 3. Fetch purchase order via Feign
        PurchaseOrderClientResponse poResponse;
        try {
            poResponse = procurementClient.getPurchaseOrder(request.purchaseOrderId(), orgId.toString());
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException(
                    "Purchase order not found with id: " + request.purchaseOrderId());
        }

        if (poResponse.data() == null || !"APPROVED".equalsIgnoreCase(poResponse.data().status())) {
            throw new ValidationException(
                    "Purchase order must be in APPROVED status to create a GRN");
        }

        // 4. Check for duplicate GRN for this purchase order
        if (grnRepository.existsByPurchaseOrderId(request.purchaseOrderId())) {
            throw new ConflictException(
                    "A GRN already exists for purchase order: " + request.purchaseOrderId());
        }

        // 5. Build PO items map for lookup
        Map<UUID, POItemData> poItemMap = poResponse.data().items().stream()
                .collect(Collectors.toMap(POItemData::productId, item -> item));

        // 6. Validate GRN items against PO
        List<GrnItem> grnItems = new ArrayList<>();
        for (GrnItemRequest itemReq : request.items()) {
            POItemData poItem = poItemMap.get(itemReq.productId());
            if (poItem == null) {
                throw new ValidationException(
                        "Product " + itemReq.productId() + " is not part of purchase order " + request.purchaseOrderId());
            }
            if (itemReq.quantityReceived() > poItem.quantity()) {
                throw new ValidationException(
                        "Quantity received (" + itemReq.quantityReceived() + ") exceeds ordered quantity ("
                                + poItem.quantity() + ") for product " + itemReq.productId());
            }

            grnItems.add(GrnItem.builder()
                    .organizationId(orgId)
                    .productId(itemReq.productId())
                    .productName(poItem.productName())
                    .quantityOrdered(poItem.quantity())
                    .quantityReceived(itemReq.quantityReceived())
                    .build());
        }

        // 7. Generate GRN number
        String grnNumber = grnNumberGenerator.generate();

        // 8. Build and save GRN
        GoodsReceiptNote grn = GoodsReceiptNote.builder()
                .organizationId(orgId)
                .purchaseOrderId(request.purchaseOrderId())
                .warehouse(warehouse)
                .grnNumber(grnNumber)
                .receivedBy(userId)
                .build();

        // Wire items to GRN
        for (GrnItem item : grnItems) {
            item.setGrn(grn);
            grn.getItems().add(item);
        }

        grn = grnRepository.save(grn);
        log.debug("Created GRN {} for org {}", grn.getGrnNumber(), orgId);

        try {
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .eventType("inventory.grn.created")
                    .aggregateType("GRN")
                    .aggregateId(grn.getGrnId())
                    .payload(objectMapper.writeValueAsString(Map.of(
                            "grnId", grn.getGrnId().toString(),
                            "purchaseOrderId", grn.getPurchaseOrderId().toString(),
                            "organizationId", grn.getOrganizationId().toString()
                    )))
                    .status(OutboxEvent.Status.PENDING)
                    .build();
            outboxEventRepository.save(outboxEvent);
        } catch (Exception e) {
            log.error("Failed to write inventory.grn.created outbox event: {}", e.getMessage());
        }

        return toResponse(grn);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GrnResponse> getAll(UUID orgId, GrnStatus status, Pageable pageable) {
        Page<GoodsReceiptNote> page = status == null
                ? grnRepository.findByOrganizationId(orgId, pageable)
                : grnRepository.findByOrganizationIdAndStatus(orgId, status, pageable);
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public GrnResponse getById(UUID grnId, UUID orgId) {
        return grnRepository.findByGrnIdAndOrganizationId(grnId, orgId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "GRN not found with id: " + grnId));
    }

    private GrnResponse toResponse(GoodsReceiptNote grn) {
        List<GrnItemResponse> itemResponses = grn.getItems().stream()
                .map(item -> new GrnItemResponse(
                        item.getGrnItemId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantityOrdered(),
                        item.getQuantityReceived()
                ))
                .collect(Collectors.toList());

        return new GrnResponse(
                grn.getGrnId(),
                grn.getGrnNumber(),
                grn.getPurchaseOrderId(),
                grn.getWarehouse().getWarehouseId(),
                grn.getWarehouse().getWarehouseName(),
                grn.getStatus(),
                grn.getReceivedBy(),
                grn.getReceivedAt(),
                itemResponses
        );
    }
}
