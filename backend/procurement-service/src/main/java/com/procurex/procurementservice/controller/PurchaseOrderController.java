package com.procurex.procurementservice.controller;

import com.procurex.procurementservice.dto.request.CreatePurchaseOrderRequest;
import com.procurex.procurementservice.dto.response.ApiResponse;
import com.procurex.procurementservice.dto.response.PurchaseOrderResponse;
import com.procurex.procurementservice.entity.POStatus;
import com.procurex.procurementservice.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Purchase Orders", description = "Manage purchase orders — create from quotations, list, retrieve, approve, and cancel")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    /**
     * Create a purchase order from a selected quotation.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    @Operation(summary = "Create a purchase order from a selected quotation")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Purchase order created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Quotation not in a selectable state")
    })
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
    @Operation(summary = "List purchase orders for the organization with optional status filter")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purchase orders retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
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
    @Operation(summary = "Get a single purchase order by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purchase order retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purchase order not found")
    })
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
    @Operation(summary = "Approve a purchase order")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purchase order approved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purchase order not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Purchase order cannot be approved in its current state")
    })
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
    @Operation(summary = "Cancel a purchase order")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purchase order cancelled successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purchase order not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Purchase order cannot be cancelled in its current state")
    })
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

    /**
     * Vendor accepts a purchase order.
     */
    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Vendor accepts a purchase order")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purchase order accepted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purchase order not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Purchase order is not in APPROVED status")
    })
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> acceptPurchaseOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) String remarks) {

        PurchaseOrderResponse response = purchaseOrderService.accept(
                id,
                UUID.fromString(orgId),
                UUID.fromString(userId),
                remarks);

        return ResponseEntity.ok(ApiResponse.success("Purchase order accepted", response));
    }

    /**
     * Vendor declines a purchase order.
     */
    @PatchMapping("/{id}/decline")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Vendor declines a purchase order")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Purchase order declined successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Purchase order not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Purchase order is not in APPROVED status")
    })
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> declinePurchaseOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) String reason) {

        PurchaseOrderResponse response = purchaseOrderService.decline(
                id,
                UUID.fromString(orgId),
                UUID.fromString(userId),
                reason);

        return ResponseEntity.ok(ApiResponse.success("Purchase order declined", response));
    }

    /**
     * Vendor-scoped list of purchase orders assigned to the calling vendor.
     */
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "List purchase orders assigned to the calling vendor")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Your purchase orders retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<Page<PurchaseOrderResponse>>> getMyOrders(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(required = false) POStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PurchaseOrderResponse> result = purchaseOrderService.getMyOrders(
                UUID.fromString(userId), status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Your purchase orders retrieved successfully", result));
    }
}
