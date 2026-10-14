package com.procurex.financeservice.service.impl;

import com.procurex.financeservice.dto.request.CreateBudgetRequest;
import com.procurex.financeservice.dto.response.BudgetResponse;
import com.procurex.financeservice.entity.Budget;
import com.procurex.financeservice.exception.ConflictException;
import com.procurex.financeservice.exception.ResourceNotFoundException;
import com.procurex.financeservice.repository.BudgetRepository;
import com.procurex.financeservice.service.BudgetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;

    @Override
    @Transactional
    public BudgetResponse create(CreateBudgetRequest request, UUID orgId) {
        budgetRepository.findByOrganizationIdAndDepartmentNameAndFiscalYear(
                orgId, request.departmentName(), request.fiscalYear())
                .ifPresent(b -> {
                    throw new ConflictException(
                            "Budget already exists for department '" + request.departmentName()
                            + "' in fiscal year " + request.fiscalYear());
                });

        Budget budget = Budget.builder()
                .organizationId(orgId)
                .departmentName(request.departmentName())
                .fiscalYear(request.fiscalYear())
                .allocatedAmount(request.allocatedAmount())
                .usedAmount(BigDecimal.ZERO)
                .committedAmount(BigDecimal.ZERO)
                .build();

        Budget saved = budgetRepository.save(budget);
        log.info("Budget created: id={}, dept={}, year={}", saved.getBudgetId(),
                request.departmentName(), request.fiscalYear());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BudgetResponse> getAll(UUID orgId, Pageable pageable) {
        return budgetRepository.findByOrganizationId(orgId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getById(UUID budgetId, UUID orgId) {
        Budget budget = budgetRepository.findById(budgetId)
                .filter(b -> b.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found: " + budgetId));
        return toResponse(budget);
    }

    @Override
    @Transactional
    public BudgetResponse update(UUID budgetId, CreateBudgetRequest request, UUID orgId) {
        Budget budget = budgetRepository.findById(budgetId)
                .filter(b -> b.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found: " + budgetId));

        BigDecimal minRequired = budget.getUsedAmount().add(budget.getCommittedAmount());
        if (request.allocatedAmount().compareTo(minRequired) < 0) {
            throw new IllegalStateException(
                    "Cannot reduce allocated amount below committed + used spend ("
                    + minRequired + ")");
        }

        budget.setAllocatedAmount(request.allocatedAmount());
        budget.setDepartmentName(request.departmentName());
        Budget saved = budgetRepository.save(budget);
        return toResponse(saved);
    }

    private BudgetResponse toResponse(Budget b) {
        BigDecimal available = b.getAllocatedAmount()
                .subtract(b.getUsedAmount())
                .subtract(b.getCommittedAmount());
        return new BudgetResponse(
                b.getBudgetId(),
                b.getDepartmentName(),
                b.getFiscalYear(),
                b.getAllocatedAmount(),
                b.getUsedAmount(),
                b.getCommittedAmount(),
                available,
                b.getCreatedAt()
        );
    }
}
