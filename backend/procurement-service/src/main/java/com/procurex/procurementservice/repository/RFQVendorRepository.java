package com.procurex.procurementservice.repository;

import com.procurex.procurementservice.entity.RFQVendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RFQVendorRepository extends JpaRepository<RFQVendor, UUID> {

    List<RFQVendor> findByVendorId(UUID vendorId);

    @Query("SELECT rv FROM RFQVendor rv JOIN FETCH rv.rfq WHERE rv.vendorId = :vendorId")
    Page<RFQVendor> findByVendorIdWithRfq(@Param("vendorId") UUID vendorId, Pageable pageable);

    boolean existsByRfq_RfqIdAndVendorId(UUID rfqId, UUID vendorId);
}
