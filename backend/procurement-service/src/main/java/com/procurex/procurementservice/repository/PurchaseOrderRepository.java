package com.procurex.procurementservice.repository;

import com.procurex.procurementservice.entity.POStatus;
import com.procurex.procurementservice.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    Page<PurchaseOrder> findByOrganizationId(UUID organizationId, Pageable pageable);

    Page<PurchaseOrder> findByOrganizationIdAndStatus(UUID organizationId, POStatus status, Pageable pageable);

    long countByPoNumberStartingWith(String prefix);

    Optional<PurchaseOrder> findByPurchaseOrderIdAndOrganizationId(UUID poId, UUID organizationId);

    Page<PurchaseOrder> findByVendorId(UUID vendorId, Pageable pageable);

    Page<PurchaseOrder> findByVendorIdAndStatus(UUID vendorId, POStatus status, Pageable pageable);
}
