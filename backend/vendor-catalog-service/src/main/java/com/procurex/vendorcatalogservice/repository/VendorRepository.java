package com.procurex.vendorcatalogservice.repository;

import com.procurex.vendorcatalogservice.entity.Vendor;
import com.procurex.vendorcatalogservice.entity.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, UUID> {

    Optional<Vendor> findByUserId(UUID userId);

    Optional<Vendor> findByGstNumber(String gstNumber);

    List<Vendor> findAllByIsDeletedFalse();

    Page<Vendor> findAllByIsDeletedFalse(Pageable pageable);

    Page<Vendor> findAllByIsDeletedFalseAndVendorStatus(VendorStatus vendorStatus, Pageable pageable);
}
