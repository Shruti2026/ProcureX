package com.procurex.financeservice.controller;

import com.procurex.financeservice.dto.request.InitiatePaymentRequest;
import com.procurex.financeservice.dto.response.PaymentResponse;
import com.procurex.financeservice.service.PaymentService;
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
@RequestMapping("/api/v1/finance/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Manage payments — initiate payments against approved invoices, list, and retrieve by invoice")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "Initiate a payment against an approved invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Payment initiated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — finance manager or admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Invoice is not in an approved state")
    })
    public ResponseEntity<ApiResponse<PaymentResponse>> initiate(
            @Valid @RequestBody InitiatePaymentRequest request, Authentication auth) {
        UUID orgId  = extractOrgId(auth);
        UUID userId = UUID.fromString(auth.getName());
        PaymentResponse response = paymentService.initiatePayment(request, orgId, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment initiated", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "List all payments for the organization (paginated)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payments retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        UUID orgId = extractOrgId(auth);
        Page<PaymentResponse> result = paymentService.getAll(orgId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved", result));
    }

    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN','VENDOR')")
    @Operation(summary = "Get the payment record for a specific invoice")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payment retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Payment not found for the given invoice")
    })
    public ResponseEntity<ApiResponse<PaymentResponse>> getByInvoice(
            @PathVariable UUID invoiceId, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        PaymentResponse response = paymentService.getByInvoiceId(invoiceId, orgId);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", response));
    }

    @SuppressWarnings("unchecked")
    private UUID extractOrgId(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        return UUID.fromString((String) details.get("organizationId"));
    }
}
