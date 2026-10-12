package com.procurex.procurementservice.controller;

import com.procurex.procurementservice.dto.request.SubmitQuotationRequest;
import com.procurex.procurementservice.dto.response.ApiResponse;
import com.procurex.procurementservice.dto.response.QuotationResponse;
import com.procurex.procurementservice.service.QuotationService;
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
public class QuotationController {

    private final QuotationService quotationService;

    /**
     * Submit a quotation for an RFQ (vendor only).
     */
    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
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
