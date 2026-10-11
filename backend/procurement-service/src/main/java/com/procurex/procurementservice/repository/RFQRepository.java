package com.procurex.procurementservice.repository;

import com.procurex.procurementservice.entity.RFQ;
import com.procurex.procurementservice.entity.RFQStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RFQRepository extends JpaRepository<RFQ, UUID> {

    Page<RFQ> findByOrganizationId(UUID organizationId, Pageable pageable);

    Page<RFQ> findByOrganizationIdAndStatus(UUID organizationId, RFQStatus status, Pageable pageable);

    long countByRfqNumberStartingWith(String prefix);

    Optional<RFQ> findByRfqIdAndOrganizationId(UUID rfqId, UUID organizationId);
}
