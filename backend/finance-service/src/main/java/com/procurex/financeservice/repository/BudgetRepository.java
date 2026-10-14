package com.procurex.financeservice.repository;

import com.procurex.financeservice.entity.Budget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    Optional<Budget> findByOrganizationIdAndDepartmentNameAndFiscalYear(
            UUID orgId, String departmentName, int fiscalYear);

    List<Budget> findByOrganizationId(UUID orgId);

    Page<Budget> findByOrganizationId(UUID orgId, Pageable pageable);
}
