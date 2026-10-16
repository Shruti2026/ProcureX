package com.procurex.financeservice.controller;

import com.procurex.financeservice.dto.request.SubmitInvoiceRequest;
import com.procurex.financeservice.dto.response.InvoiceResponse;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.service.InvoiceService;
import com.procurex.financeservice.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Invoices", description = "Manage vendor invoices — submit, list, retrieve, run three-way match, approve, and reject")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VENDOR','ADMIN')")
    @Operation(summary = "Submit a new invoice against a purchase order")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Invoice submitted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — vendor or admin role required")
    })
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
    @Operation(summary = "List all invoices for the organization with optional status filter")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoices retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
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
    @Operation(summary = "Get a single invoice by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(
            @PathVariable UUID id, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        InvoiceResponse response = invoiceService.getById(id, orgId);
        return ResponseEntity.ok(ApiResponse.success("Invoice retrieved", response));
    }

    @PostMapping("/{id}/match")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "Run three-way match (PO, GRN, and invoice) for an invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Three-way match completed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Invoice is not in a matchable state")
    })
    public ResponseEntity<ApiResponse<InvoiceResponse>> runMatch(
            @PathVariable UUID id, Authentication auth) {
        UUID orgId  = extractOrgId(auth);
        UUID userId = UUID.fromString(auth.getName());
        InvoiceResponse response = invoiceService.runThreeWayMatch(id, orgId, userId);
        return ResponseEntity.ok(ApiResponse.success("Three-way match completed", response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "Approve an invoice for payment")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice approved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Invoice cannot be approved in its current state")
    })
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
    @Operation(summary = "Reject an invoice with optional remarks")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice rejected successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Invoice cannot be rejected in its current state")
    })
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
