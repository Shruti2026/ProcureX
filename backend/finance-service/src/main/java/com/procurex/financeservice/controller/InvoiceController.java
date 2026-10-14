package com.procurex.financeservice.controller;

import com.procurex.financeservice.dto.request.SubmitInvoiceRequest;
import com.procurex.financeservice.dto.response.InvoiceResponse;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.service.InvoiceService;
import com.procurex.financeservice.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VENDOR','ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> submit(
            @Valid @RequestBody SubmitInvoiceRequest request, Authentication auth) {
        UUID orgId  = extractOrgId(auth);
        UUID userId = UUID.fromString(auth.getName());
        InvoiceResponse response = invoiceService.submit(request, orgId, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice submitted", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getAll(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        UUID orgId = extractOrgId(auth);
        Page<InvoiceResponse> result = invoiceService.getAll(orgId, status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN','VENDOR')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(
            @PathVariable UUID id, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        InvoiceResponse response = invoiceService.getById(id, orgId);
        return ResponseEntity.ok(ApiResponse.success("Invoice retrieved", response));
    }

    @PostMapping("/{id}/match")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> runMatch(
            @PathVariable UUID id, Authentication auth) {
        UUID orgId  = extractOrgId(auth);
        UUID userId = UUID.fromString(auth.getName());
        InvoiceResponse response = invoiceService.runThreeWayMatch(id, orgId, userId);
        return ResponseEntity.ok(ApiResponse.success("Three-way match completed", response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> approve(
            @PathVariable UUID id,
            @RequestParam(required = false) String remarks,
            Authentication auth) {
        UUID orgId  = extractOrgId(auth);
        UUID userId = UUID.fromString(auth.getName());
        InvoiceResponse response = invoiceService.approve(id, orgId, userId, remarks);
        return ResponseEntity.ok(ApiResponse.success("Invoice approved", response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> reject(
            @PathVariable UUID id,
            @RequestParam(required = false) String remarks,
            Authentication auth) {
        UUID orgId  = extractOrgId(auth);
        UUID userId = UUID.fromString(auth.getName());
        InvoiceResponse response = invoiceService.reject(id, orgId, userId, remarks);
        return ResponseEntity.ok(ApiResponse.success("Invoice rejected", response));
    }

    @SuppressWarnings("unchecked")
    private UUID extractOrgId(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        return UUID.fromString((String) details.get("organizationId"));
    }
}
