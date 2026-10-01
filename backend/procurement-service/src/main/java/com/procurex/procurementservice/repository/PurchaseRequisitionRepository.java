package com.procurex.procurementservice.repository;

import com.procurex.procurementservice.entity.PurchaseRequisition;
import com.procurex.procurementservice.entity.RequisitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, UUID> {

    Page<PurchaseRequisition> findByOrganizationId(UUID organizationId, Pageable pageable);

    Page<PurchaseRequisition> findByOrganizationIdAndStatus(UUID organizationId, RequisitionStatus status, Pageable pageable);

    long countByRequisitionNumberStartingWith(String prefix);
}
