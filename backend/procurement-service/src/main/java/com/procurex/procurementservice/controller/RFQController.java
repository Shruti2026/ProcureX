package com.procurex.procurementservice.controller;

import com.procurex.procurementservice.dto.request.CreateRFQRequest;
import com.procurex.procurementservice.dto.response.ApiResponse;
import com.procurex.procurementservice.dto.response.RFQResponse;
import com.procurex.procurementservice.service.RFQService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/procurement/rfqs")
@RequiredArgsConstructor
public class RFQController {

    private final RFQService rfqService;

    /**
     * Create a new RFQ from an approved requisition.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RFQResponse>> createRFQ(
            @Valid @RequestBody CreateRFQRequest request,
            @RequestHeader("X-Organization-Id") String organizationId,
            @RequestHeader("X-User-Id") String userId) {
        RFQResponse response = rfqService.create(
                request,
                UUID.fromString(organizationId),
                UUID.fromString(userId));
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("RFQ created successfully", response));
    }

    /**
     * List RFQs for the requesting organization, with optional status filter.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<RFQResponse>>> getAllRFQs(
            @RequestHeader("X-Organization-Id") String organizationId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<RFQResponse> page = rfqService.getAll(
                UUID.fromString(organizationId), status, pageable);
        return ResponseEntity.ok(ApiResponse.success("RFQs retrieved", page));
    }

    /**
     * Get a single RFQ by ID.
     */
    @GetMapping("/{rfqId}")
    public ResponseEntity<ApiResponse<RFQResponse>> getRFQById(
            @PathVariable UUID rfqId,
            @RequestHeader("X-Organization-Id") String organizationId) {
        return ResponseEntity.ok(ApiResponse.success("RFQ retrieved",
                rfqService.getById(rfqId, UUID.fromString(organizationId))));
    }

    /**
     * Get all RFQ invitations for the requesting vendor.
     */
    @GetMapping("/my-invitations")
    public ResponseEntity<ApiResponse<Page<RFQResponse>>> getMyInvitations(
            @RequestHeader("X-User-Id") String vendorId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Invitations retrieved",
                rfqService.getMyInvitations(UUID.fromString(vendorId), pageable)));
    }

    /**
     * Close an open RFQ.
     */
    @PatchMapping("/{rfqId}/close")
    public ResponseEntity<ApiResponse<RFQResponse>> closeRFQ(
            @PathVariable UUID rfqId,
            @RequestHeader("X-Organization-Id") String organizationId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success("RFQ closed",
                rfqService.close(rfqId, UUID.fromString(organizationId), UUID.fromString(userId))));
    }
}
