package com.procurex.financeservice.service;

import com.procurex.financeservice.dto.request.CreateBudgetRequest;
import com.procurex.financeservice.dto.response.BudgetResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BudgetService {

    BudgetResponse create(CreateBudgetRequest request, UUID orgId);

    Page<BudgetResponse> getAll(UUID orgId, Pageable pageable);

    BudgetResponse getById(UUID budgetId, UUID orgId);

    BudgetResponse update(UUID budgetId, CreateBudgetRequest request, UUID orgId);
}
