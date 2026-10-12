package com.procurex.inventoryservice.repository;

import com.procurex.inventoryservice.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, UUID> {

    List<Inventory> findByOrganizationId(UUID organizationId);

    Optional<Inventory> findByWarehouse_WarehouseIdAndProductId(UUID warehouseId, UUID productId);

    Page<Inventory> findByOrganizationId(UUID organizationId, Pageable pageable);
}
