package com.procurex.procurementservice.controller;

import com.procurex.procurementservice.dto.request.SubmitQuotationRequest;
import com.procurex.procurementservice.dto.response.ApiResponse;
import com.procurex.procurementservice.dto.response.QuotationResponse;
import com.procurex.procurementservice.service.QuotationService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/procurement/quotations")
@RequiredArgsConstructor
@Tag(name = "Quotations", description = "Manage vendor quotations — submit against RFQs, list by RFQ, and view own submissions")
public class QuotationController {

    private final QuotationService quotationService;

    /**
     * Submit a quotation for an RFQ (vendor only).
     */
    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Submit a quotation for an RFQ (vendor only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Quotation submitted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — vendor role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "RFQ is not open for quotations")
    })
    public ResponseEntity<ApiResponse<QuotationResponse>> submitQuotation(
            @Valid @RequestBody SubmitQuotationRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId) {

        QuotationResponse response = quotationService.submit(
                request,
                UUID.fromString(userId),
                UUID.fromString(orgId));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quotation submitted successfully", response));
    }

    /**
     * Get all quotations for a given RFQ (procurement manager / admin).
     */
    @GetMapping("/rfq/{rfqId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    @Operation(summary = "Get all quotations submitted for a given RFQ")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Quotations retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "RFQ not found")
    })
    public ResponseEntity<ApiResponse<List<QuotationResponse>>> getByRFQ(
            @PathVariable UUID rfqId,
            @RequestHeader("X-Organization-Id") String orgId) {

        List<QuotationResponse> responses = quotationService.getByRFQ(rfqId, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Quotations retrieved successfully", responses));
    }

    /**
     * Get the authenticated vendor's own submitted quotations (paginated).
     */
    @GetMapping("/my-quotations")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Get the authenticated vendor's own submitted quotations (paginated)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Quotations retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — vendor role required")
    })
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> getMyQuotations(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt"));
        Page<QuotationResponse> responses = quotationService.getMyQuotations(
                UUID.fromString(userId),
                UUID.fromString(orgId),
                pageable);

        return ResponseEntity.ok(ApiResponse.success("Quotations retrieved successfully", responses));
    }
}
