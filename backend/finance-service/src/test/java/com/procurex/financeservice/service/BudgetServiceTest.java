package com.procurex.financeservice.service;

import com.procurex.financeservice.dto.request.CreateBudgetRequest;
import com.procurex.financeservice.dto.response.BudgetResponse;
import com.procurex.financeservice.entity.Budget;
import com.procurex.financeservice.exception.ConflictException;
import com.procurex.financeservice.repository.BudgetRepository;
import com.procurex.financeservice.service.impl.BudgetServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private BudgetServiceImpl budgetService;

    private static final UUID ORG_ID    = UUID.randomUUID();
    private static final UUID BUDGET_ID = UUID.randomUUID();

    // ------------------------------------------------------------------
    // createBudget
    // ------------------------------------------------------------------

    @Test
    void createBudget_validRequest_savesWithZeroUsedAndCommitted() {
        CreateBudgetRequest request = new CreateBudgetRequest(
                "Engineering",
                2025,
                new BigDecimal("100000.00")
        );

        when(budgetRepository.findByOrganizationIdAndDepartmentNameAndFiscalYear(
                ORG_ID, "Engineering", 2025))
                .thenReturn(Optional.empty());

        // thenAnswer so the returned entity reflects what was passed to save()
        when(budgetRepository.save(any(Budget.class)))
                .thenAnswer(invocation -> {
                    Budget b = invocation.getArgument(0);
                    b.setBudgetId(UUID.randomUUID());
                    return b;
                });

        BudgetResponse response = budgetService.create(request, ORG_ID);

        assertThat(response.usedAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.committedAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.allocatedAmount()).isEqualByComparingTo(new BigDecimal("100000.00"));
    }

    @Test
    void createBudget_duplicate_throwsConflictException() {
        CreateBudgetRequest request = new CreateBudgetRequest(
                "Engineering",
                2025,
                new BigDecimal("100000.00")
        );

        Budget existing = Budget.builder()
                .budgetId(BUDGET_ID)
                .organizationId(ORG_ID)
                .departmentName("Engineering")
                .fiscalYear(2025)
                .allocatedAmount(new BigDecimal("80000.00"))
                .usedAmount(BigDecimal.ZERO)
                .committedAmount(BigDecimal.ZERO)
                .build();

        when(budgetRepository.findByOrganizationIdAndDepartmentNameAndFiscalYear(
                ORG_ID, "Engineering", 2025))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> budgetService.create(request, ORG_ID))
                .isInstanceOf(ConflictException.class);
    }

    // ------------------------------------------------------------------
    // updateBudget
    // ------------------------------------------------------------------

    @Test
    void updateBudget_newAmountBelowMinRequired_throwsIllegalStateException() {
        // usedAmount=30000, committedAmount=20000 → minRequired=50000
        Budget existing = Budget.builder()
                .budgetId(BUDGET_ID)
                .organizationId(ORG_ID)
                .departmentName("Finance")
                .fiscalYear(2025)
                .allocatedAmount(new BigDecimal("100000.00"))
                .usedAmount(new BigDecimal("30000.00"))
                .committedAmount(new BigDecimal("20000.00"))
                .build();

        when(budgetRepository.findById(BUDGET_ID))
                .thenReturn(Optional.of(existing));

        // allocatedAmount=40000 < minRequired=50000 → must throw
        CreateBudgetRequest updateRequest = new CreateBudgetRequest(
                "Finance",
                2025,
                new BigDecimal("40000.00")
        );

        assertThatThrownBy(() -> budgetService.update(BUDGET_ID, updateRequest, ORG_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("50000");
    }

    @Test
    void updateBudget_validAmount_updatesSuccessfully() {
        // usedAmount=20000, committedAmount=10000 → minRequired=30000
        Budget existing = Budget.builder()
                .budgetId(BUDGET_ID)
                .organizationId(ORG_ID)
                .departmentName("Operations")
                .fiscalYear(2025)
                .allocatedAmount(new BigDecimal("80000.00"))
                .usedAmount(new BigDecimal("20000.00"))
                .committedAmount(new BigDecimal("10000.00"))
                .build();

        when(budgetRepository.findById(BUDGET_ID))
                .thenReturn(Optional.of(existing));

        when(budgetRepository.save(any(Budget.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // allocatedAmount=60000 > minRequired=30000 → valid
        CreateBudgetRequest updateRequest = new CreateBudgetRequest(
                "Operations",
                2025,
                new BigDecimal("60000.00")
        );

        budgetService.update(BUDGET_ID, updateRequest, ORG_ID);

        verify(budgetRepository).save(any(Budget.class));
    }
}
