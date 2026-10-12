package com.procurex.procurementservice.repository;

import com.procurex.procurementservice.entity.Quotation;
import com.procurex.procurementservice.entity.QuotationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, UUID> {

    List<Quotation> findByRfq_RfqIdAndOrganizationId(UUID rfqId, UUID organizationId);

    Page<Quotation> findByVendorIdAndOrganizationId(UUID vendorId, UUID organizationId, Pageable pageable);

    boolean existsByRfq_RfqIdAndVendorId(UUID rfqId, UUID vendorId);

    List<Quotation> findByRfq_RfqIdAndStatusNot(UUID rfqId, QuotationStatus status);
}
