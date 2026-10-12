package com.procurex.inventoryservice.service.impl;

import com.procurex.inventoryservice.dto.request.InspectionItemRequest;
import com.procurex.inventoryservice.dto.request.SubmitInspectionRequest;
import com.procurex.inventoryservice.dto.response.InspectionItemResponse;
import com.procurex.inventoryservice.dto.response.InspectionResponse;
import com.procurex.inventoryservice.entity.GoodsReceiptNote;
import com.procurex.inventoryservice.entity.GrnItem;
import com.procurex.inventoryservice.entity.Inventory;
import com.procurex.inventoryservice.entity.InspectionItem;
import com.procurex.inventoryservice.entity.QualityInspection;
import com.procurex.inventoryservice.entity.StockTransaction;
import com.procurex.inventoryservice.enums.GrnStatus;
import com.procurex.inventoryservice.enums.InspectionStatus;
import com.procurex.inventoryservice.enums.TransactionType;
import com.procurex.inventoryservice.exception.ConflictException;
import com.procurex.inventoryservice.exception.ResourceNotFoundException;
import com.procurex.inventoryservice.exception.ValidationException;
import com.procurex.inventoryservice.repository.GoodsReceiptNoteRepository;
import com.procurex.inventoryservice.repository.InventoryRepository;
import com.procurex.inventoryservice.repository.QualityInspectionRepository;
import com.procurex.inventoryservice.repository.StockTransactionRepository;
import com.procurex.inventoryservice.service.InspectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InspectionServiceImpl implements InspectionService {

    private static final int MAX_RETRY = 3;

    private final GoodsReceiptNoteRepository grnRepository;
    private final QualityInspectionRepository qualityInspectionRepository;
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Override
    @Transactional
    public InspectionResponse submitInspection(SubmitInspectionRequest request,
                                                UsernamePasswordAuthenticationToken auth) {
        // 1. Extract org and user
        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        UUID orgId = UUID.fromString((String) details.get("organizationId"));
        UUID userId = UUID.fromString(auth.getName());

        // 2. Load GRN
        GoodsReceiptNote grn = grnRepository.findByGrnIdAndOrganizationId(request.grnId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "GRN not found with id: " + request.grnId()));

        // 3. Validate GRN status
        if (grn.getStatus() != GrnStatus.PENDING_INSPECTION) {
            throw new ValidationException(
                    "GRN must be in PENDING_INSPECTION status to submit inspection. Current status: " + grn.getStatus());
        }

        // 4. Check no existing inspection
        if (qualityInspectionRepository.findByGrn_GrnId(request.grnId()).isPresent()) {
            throw new ConflictException(
                    "Inspection already exists for GRN: " + request.grnId());
        }

        // 5. Build GRN item lookup map
        Map<UUID, GrnItem> grnItemMap = grn.getItems().stream()
                .collect(Collectors.toMap(GrnItem::getProductId, item -> item));

        // 6. Validate inspection items
        for (InspectionItemRequest itemReq : request.items()) {
            GrnItem grnItem = grnItemMap.get(itemReq.productId());
            if (grnItem == null) {
                throw new ValidationException(
                        "Product " + itemReq.productId() + " is not part of this GRN");
            }
            int total = itemReq.acceptedQuantity() + itemReq.rejectedQuantity();
            if (total != grnItem.getQuantityReceived()) {
                throw new ValidationException(
                        "Accepted + Rejected quantities (" + total + ") must equal received quantity ("
                                + grnItem.getQuantityReceived() + ") for product " + itemReq.productId());
            }
        }

        // 7. Determine inspection status
        boolean allAccepted = request.items().stream()
                .allMatch(i -> i.rejectedQuantity() == 0);
        boolean allRejected = request.items().stream()
                .allMatch(i -> i.acceptedQuantity() == 0);
        InspectionStatus inspectionStatus = allAccepted ? InspectionStatus.PASSED
                : allRejected ? InspectionStatus.FAILED
                : InspectionStatus.PARTIAL;

        // 8. Build QualityInspection
        QualityInspection inspection = QualityInspection.builder()
                .organizationId(orgId)
                .grn(grn)
                .status(inspectionStatus)
                .inspectedBy(userId)
                .inspectedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        List<InspectionItem> inspectionItems = new ArrayList<>();
        List<StockTransaction> transactions = new ArrayList<>();

        for (InspectionItemRequest itemReq : request.items()) {
            InspectionItem inspItem = InspectionItem.builder()
                    .organizationId(orgId)
                    .inspection(inspection)
                    .productId(itemReq.productId())
                    .acceptedQuantity(itemReq.acceptedQuantity())
                    .rejectedQuantity(itemReq.rejectedQuantity())
                    .reasonForRejection(itemReq.reasonForRejection())
                    .build();
            inspectionItems.add(inspItem);
        }

        inspection.getItems().addAll(inspectionItems);
        qualityInspectionRepository.save(inspection);

        // 9. Update inventory with optimistic locking retry for accepted quantities
        for (InspectionItemRequest itemReq : request.items()) {
            if (itemReq.acceptedQuantity() <= 0) {
                continue;
            }

            boolean updated = false;
            for (int attempt = 0; attempt < MAX_RETRY && !updated; attempt++) {
                try {
                    Inventory inventory = inventoryRepository
                            .findByWarehouse_WarehouseIdAndProductId(
                                    grn.getWarehouse().getWarehouseId(), itemReq.productId())
                            .orElseGet(() -> {
                                Inventory newInv = Inventory.builder()
                                        .organizationId(orgId)
                                        .warehouse(grn.getWarehouse())
                                        .productId(itemReq.productId())
                                        .quantityOnHand(0)
                                        .quantityReserved(0)
                                        .build();
                                return inventoryRepository.save(newInv);
                            });

                    inventory.setQuantityOnHand(inventory.getQuantityOnHand() + itemReq.acceptedQuantity());
                    inventoryRepository.save(inventory);
                    updated = true;

                } catch (ObjectOptimisticLockingFailureException e) {
                    log.warn("Optimistic lock conflict updating inventory for product {}, attempt {}",
                            itemReq.productId(), attempt + 1);
                    if (attempt == MAX_RETRY - 1) {
                        throw e;
                    }
                }
            }

            // Record stock transaction
            StockTransaction tx = StockTransaction.builder()
                    .organizationId(orgId)
                    .productId(itemReq.productId())
                    .warehouse(grn.getWarehouse())
                    .transactionType(TransactionType.INCOMING)
                    .quantity(itemReq.acceptedQuantity())
                    .referenceId(grn.getGrnId().toString())
                    .referenceType("GRN")
                    .performedBy(userId)
                    .build();
            transactions.add(tx);
        }

        stockTransactionRepository.saveAll(transactions);

        // 10. Update GRN status
        grn.setStatus(GrnStatus.INSPECTED);
        grnRepository.save(grn);

        log.debug("Inspection {} submitted for GRN {} with status {}", inspection.getInspectionId(),
                grn.getGrnId(), inspectionStatus);

        return toResponse(inspection);
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionResponse getByGrn(UUID grnId, UsernamePasswordAuthenticationToken auth) {
        return qualityInspectionRepository.findByGrn_GrnId(grnId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection not found for GRN: " + grnId));
    }

    private InspectionResponse toResponse(QualityInspection inspection) {
        List<InspectionItemResponse> items = inspection.getItems().stream()
                .map(item -> new InspectionItemResponse(
                        item.getProductId(),
                        item.getAcceptedQuantity(),
                        item.getRejectedQuantity(),
                        item.getReasonForRejection()
                ))
                .collect(Collectors.toList());

        return new InspectionResponse(
                inspection.getInspectionId(),
                inspection.getGrn().getGrnId(),
                inspection.getStatus(),
                inspection.getInspectedBy(),
                inspection.getInspectedAt(),
                items
        );
    }
}
