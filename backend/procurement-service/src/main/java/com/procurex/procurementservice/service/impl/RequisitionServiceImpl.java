package com.procurex.procurementservice.service.impl;

import com.procurex.procurementservice.client.ProductApiResponse;
import com.procurex.procurementservice.client.ProductSummary;
import com.procurex.procurementservice.client.VendorCatalogClient;
import com.procurex.procurementservice.dto.request.CreateRequisitionRequest;
import com.procurex.procurementservice.dto.request.RequisitionItemRequest;
import com.procurex.procurementservice.dto.request.UpdateRequisitionRequest;
import com.procurex.procurementservice.dto.response.RequisitionItemResponse;
import com.procurex.procurementservice.dto.response.RequisitionResponse;
import com.procurex.procurementservice.entity.PurchaseRequisition;
import com.procurex.procurementservice.entity.RequisitionItem;
import com.procurex.procurementservice.entity.RequisitionStatus;
import com.procurex.procurementservice.exception.ProductNotFoundException;
import com.procurex.procurementservice.exception.ResourceNotFoundException;
import com.procurex.procurementservice.repository.PurchaseRequisitionRepository;
import com.procurex.procurementservice.service.RequisitionService;
import com.procurex.procurementservice.util.RequisitionNumberGenerator;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequisitionServiceImpl implements RequisitionService {

    private final PurchaseRequisitionRepository requisitionRepository;
    private final VendorCatalogClient vendorCatalogClient;
    private final RequisitionNumberGenerator requisitionNumberGenerator;

    @Override
    @Transactional
    public RequisitionResponse create(CreateRequisitionRequest request, UUID userId, UUID orgId) {
        List<RequisitionItem> items = buildItems(request.items(), orgId);

        String requisitionNumber = requisitionNumberGenerator.generate();

        PurchaseRequisition requisition = PurchaseRequisition.builder()
                .organizationId(orgId)
                .requisitionNumber(requisitionNumber)
                .title(request.title())
                .description(request.description())
                .requiredDate(request.requiredDate())
                .status(RequisitionStatus.CREATED)
                .createdBy(userId)
                .updatedBy(userId)
                .items(new ArrayList<>())
                .build();

        // Link each item back to the parent
        for (RequisitionItem item : items) {
            item.setRequisition(requisition);
            requisition.getItems().add(item);
        }

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        log.info("Created requisition {} for org {}", saved.getRequisitionNumber(), orgId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RequisitionResponse> getAll(UUID orgId, RequisitionStatus status, Pageable pageable) {
        Page<PurchaseRequisition> page;
        if (status != null) {
            page = requisitionRepository.findByOrganizationIdAndStatus(orgId, status, pageable);
        } else {
            page = requisitionRepository.findByOrganizationId(orgId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public RequisitionResponse getById(UUID requisitionId) {
        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Requisition not found with id: " + requisitionId));
        return toResponse(requisition);
    }

    @Override
    @Transactional
    public RequisitionResponse update(UUID requisitionId, UpdateRequisitionRequest request, UUID userId) {
        PurchaseRequisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Requisition not found with id: " + requisitionId));

        if (requisition.getStatus() != RequisitionStatus.CREATED) {
            throw new IllegalStateException(
                    "Cannot edit a requisition that is no longer in CREATED status");
        }

        List<RequisitionItem> newItems = buildItems(request.items(), requisition.getOrganizationId());

        requisition.setTitle(request.title());
        requisition.setDescription(request.description());
        requisition.setRequiredDate(request.requiredDate());
        requisition.setUpdatedBy(userId);

        // Clear and rebuild items (orphanRemoval=true handles deletes)
        requisition.getItems().clear();
        for (RequisitionItem item : newItems) {
            item.setRequisition(requisition);
            requisition.getItems().add(item);
        }

        PurchaseRequisition saved = requisitionRepository.save(requisition);
        log.info("Updated requisition {} by user {}", saved.getRequisitionNumber(), userId);
        return toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Validates each product via Feign and constructs item entities with
     * productName and unitOfMeasure stored from the catalog response.
     */
    private List<RequisitionItem> buildItems(
            List<RequisitionItemRequest> itemRequests, UUID orgId) {

        List<RequisitionItem> items = new ArrayList<>();
        for (RequisitionItemRequest itemReq : itemRequests) {
            ProductSummary product = fetchProduct(itemReq.productId());

            RequisitionItem item = RequisitionItem.builder()
                    .organizationId(orgId)
                    .productId(itemReq.productId())
                    .productName(product.productName())
                    .unitOfMeasure(product.unitOfMeasure())
                    .quantity(itemReq.quantity())
                    .remarks(itemReq.remarks())
                    .build();

            items.add(item);
        }
        return items;
    }

    /**
     * Fetches a product from vendor-catalog-service. Converts FeignException.NotFound
     * into ProductNotFoundException so GlobalExceptionHandler maps it to 422.
     */
    private ProductSummary fetchProduct(UUID productId) {
        try {
            ProductApiResponse response = vendorCatalogClient.getProduct(productId);
            if (response == null || response.data() == null) {
                throw new ProductNotFoundException(
                        "Product " + productId + " not found or unavailable");
            }
            return response.data();
        } catch (FeignException.NotFound e) {
            throw new ProductNotFoundException(
                    "Product " + productId + " not found or unavailable");
        }
    }

    private RequisitionResponse toResponse(PurchaseRequisition requisition) {
        List<RequisitionItemResponse> itemResponses = requisition.getItems().stream()
                .map(item -> new RequisitionItemResponse(
                        item.getRequisitionItemId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getUnitOfMeasure(),
                        item.getQuantity(),
                        item.getRemarks()
                ))
                .toList();

        return new RequisitionResponse(
                requisition.getRequisitionId(),
                requisition.getOrganizationId(),
                requisition.getRequisitionNumber(),
                requisition.getTitle(),
                requisition.getDescription(),
                requisition.getRequiredDate(),
                requisition.getStatus(),
                itemResponses,
                requisition.getCreatedBy(),
                requisition.getCreatedAt(),
                requisition.getUpdatedAt()
        );
    }
}
