package com.procurex.procurementservice.controller;

import com.procurex.procurementservice.dto.request.CreateRequisitionRequest;
import com.procurex.procurementservice.dto.request.UpdateRequisitionRequest;
import com.procurex.procurementservice.dto.response.ApiResponse;
import com.procurex.procurementservice.dto.response.RequisitionResponse;
import com.procurex.procurementservice.entity.RequisitionStatus;
import com.procurex.procurementservice.service.RequisitionService;
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
@RequestMapping("/api/v1/procurement/requisitions")
@RequiredArgsConstructor
@Tag(name = "Requisitions", description = "Manage purchase requisitions throughout their lifecycle — create, list, retrieve, and update")
public class RequisitionController {

    private final RequisitionService requisitionService;

    /**
     * Create a new purchase requisition.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    @Operation(summary = "Create a new purchase requisition")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Requisition created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<RequisitionResponse>> create(
            @Valid @RequestBody CreateRequisitionRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId) {

        RequisitionResponse response = requisitionService.create(
                request,
                UUID.fromString(userId),
                UUID.fromString(orgId)
        );
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Requisition created successfully", response));
    }

    /**
     * List requisitions for the requesting organization, with optional status filter.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    @Operation(summary = "List requisitions for the organization with optional status filter")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Requisitions retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<Page<RequisitionResponse>>> getAll(
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) RequisitionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<RequisitionResponse> result = requisitionService.getAll(
                UUID.fromString(orgId), status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Requisitions retrieved successfully", result));
    }

    /**
     * Get a single requisition by ID.
     */
    @GetMapping("/{requisitionId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a single requisition by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Requisition retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Requisition not found")
    })
    public ResponseEntity<ApiResponse<RequisitionResponse>> getById(
            @PathVariable UUID requisitionId) {

        RequisitionResponse response = requisitionService.getById(requisitionId);
        return ResponseEntity.ok(ApiResponse.success("Requisition retrieved successfully", response));
    }

    /**
     * Update an existing requisition (only allowed while status is CREATED).
     */
    @PutMapping("/{requisitionId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    @Operation(summary = "Update an existing requisition (only while status is CREATED)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Requisition updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Requisition cannot be updated in its current status")
    })
    public ResponseEntity<ApiResponse<RequisitionResponse>> update(
            @PathVariable UUID requisitionId,
            @Valid @RequestBody UpdateRequisitionRequest request,
            @RequestHeader("X-User-Id") String userId) {

        RequisitionResponse response = requisitionService.update(
                requisitionId, request, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("Requisition updated successfully", response));
    }
}
