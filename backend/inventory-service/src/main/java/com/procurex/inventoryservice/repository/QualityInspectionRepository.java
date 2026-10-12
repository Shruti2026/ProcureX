package com.procurex.inventoryservice.repository;

import com.procurex.inventoryservice.entity.QualityInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QualityInspectionRepository extends JpaRepository<QualityInspection, UUID> {

    Optional<QualityInspection> findByGrn_GrnId(UUID grnId);
}
