package com.procurex.financeservice.controller;

import com.procurex.financeservice.dto.request.CreateBudgetRequest;
import com.procurex.financeservice.dto.response.BudgetResponse;
import com.procurex.financeservice.service.BudgetService;
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
@Tag(name = "Budgets", description = "Manage organizational budgets — create, list, retrieve, and update budget allocations")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "Create a new budget allocation for the organization")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Budget created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — finance manager or admin role required")
    })
    public ResponseEntity<ApiResponse<BudgetResponse>> create(
            @Valid @RequestBody CreateBudgetRequest request, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        BudgetResponse response = budgetService.create(request, orgId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Budget created", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "List all budgets for the organization (paginated)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Budgets retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions")
    })
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
    @Operation(summary = "Get a single budget by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Budget retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Budget not found")
    })
    public ResponseEntity<ApiResponse<BudgetResponse>> getById(
            @PathVariable UUID id, Authentication auth) {
        UUID orgId = extractOrgId(auth);
        BudgetResponse response = budgetService.getById(id, orgId);
        return ResponseEntity.ok(ApiResponse.success("Budget retrieved", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE_MANAGER','ADMIN')")
    @Operation(summary = "Update an existing budget allocation")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Budget updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized — authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden — insufficient permissions"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Budget not found")
    })
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
