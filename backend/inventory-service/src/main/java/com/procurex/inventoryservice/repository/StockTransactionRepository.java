package com.procurex.inventoryservice.repository;

import com.procurex.inventoryservice.entity.StockTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, UUID> {

    Page<StockTransaction> findByOrganizationIdOrderByTransactionAtDesc(UUID organizationId, Pageable pageable);

    Page<StockTransaction> findByOrganizationIdAndProductIdOrderByTransactionAtDesc(
            UUID organizationId, UUID productId, Pageable pageable);
}
