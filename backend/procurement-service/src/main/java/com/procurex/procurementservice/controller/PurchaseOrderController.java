package com.procurex.procurementservice.controller;

import com.procurex.procurementservice.dto.request.CreatePurchaseOrderRequest;
import com.procurex.procurementservice.dto.response.ApiResponse;
import com.procurex.procurementservice.dto.response.PurchaseOrderResponse;
import com.procurex.procurementservice.entity.POStatus;
import com.procurex.procurementservice.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/procurement/orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    /**
     * Create a purchase order from a selected quotation.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> createPurchaseOrder(
            @Valid @RequestBody CreatePurchaseOrderRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId) {

        PurchaseOrderResponse response = purchaseOrderService.createFromQuotation(
                request,
                UUID.fromString(userId),
                UUID.fromString(orgId));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase order created successfully", response));
    }

    /**
     * List purchase orders for the organization, optionally filtered by status.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderResponse>>> getAllPurchaseOrders(
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) POStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PurchaseOrderResponse> result = purchaseOrderService.getAll(
                UUID.fromString(orgId), status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved successfully", result));
    }

    /**
     * Get a single purchase order by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getPurchaseOrderById(
            @PathVariable UUID id,
            @RequestHeader("X-Organization-Id") String orgId) {

        PurchaseOrderResponse response = purchaseOrderService.getById(id, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Purchase order retrieved successfully", response));
    }

    /**
     * Approve a purchase order.
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> approvePurchaseOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) String remarks) {

        PurchaseOrderResponse response = purchaseOrderService.approve(
                id,
                UUID.fromString(orgId),
                UUID.fromString(userId),
                remarks);

        return ResponseEntity.ok(ApiResponse.success("Purchase order approved successfully", response));
    }

    /**
     * Cancel a purchase order.
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancelPurchaseOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) String remarks) {

        PurchaseOrderResponse response = purchaseOrderService.cancel(
                id,
                UUID.fromString(orgId),
                UUID.fromString(userId),
                remarks);

        return ResponseEntity.ok(ApiResponse.success("Purchase order cancelled successfully", response));
    }
}
