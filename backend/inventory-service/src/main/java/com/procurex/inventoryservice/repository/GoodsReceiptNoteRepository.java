package com.procurex.inventoryservice.repository;

import com.procurex.inventoryservice.entity.GoodsReceiptNote;
import com.procurex.inventoryservice.enums.GrnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoodsReceiptNoteRepository extends JpaRepository<GoodsReceiptNote, UUID> {

    Page<GoodsReceiptNote> findByOrganizationId(UUID organizationId, Pageable pageable);

    Page<GoodsReceiptNote> findByOrganizationIdAndStatus(UUID organizationId, GrnStatus status, Pageable pageable);

    Optional<GoodsReceiptNote> findByGrnIdAndOrganizationId(UUID grnId, UUID organizationId);

    long countByGrnNumberStartingWith(String prefix);

    boolean existsByPurchaseOrderId(UUID purchaseOrderId);
}
