package com.procurex.financeservice.controller;

import com.procurex.financeservice.dto.request.CreateBudgetRequest;
import com.procurex.financeservice.dto.response.BudgetResponse;
import com.procurex.financeservice.service.BudgetService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<BudgetResponse>> create(
            @Valid @RequestBody CreateBudgetRequest request, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        BudgetResponse response = budgetService.create(request, orgId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Budget created", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<BudgetResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        UUID orgId = extractOrgId(auth);
        Page<BudgetResponse> result = budgetService.getAll(orgId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Budgets retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<BudgetResponse>> getById(
            @PathVariable UUID id, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        BudgetResponse response = budgetService.getById(id, orgId);
        return ResponseEntity.ok(ApiResponse.success("Budget retrieved", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateBudgetRequest request,
            Authentication auth) {
        UUID orgId = extractOrgId(auth);
        BudgetResponse response = budgetService.update(id, request, orgId);
        return ResponseEntity.ok(ApiResponse.success("Budget updated", response));
    }

    @SuppressWarnings("unchecked")
    private UUID extractOrgId(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        return UUID.fromString((String) details.get("organizationId"));
    }
}
