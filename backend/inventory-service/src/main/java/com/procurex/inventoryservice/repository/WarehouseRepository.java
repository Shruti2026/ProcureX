package com.procurex.inventoryservice.repository;

import com.procurex.inventoryservice.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {

    List<Warehouse> findByOrganizationId(UUID organizationId);

    Optional<Warehouse> findByWarehouseIdAndOrganizationId(UUID warehouseId, UUID organizationId);
}
