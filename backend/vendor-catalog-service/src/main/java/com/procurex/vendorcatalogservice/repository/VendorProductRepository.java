package com.procurex.vendorcatalogservice.repository;

import com.procurex.vendorcatalogservice.entity.VendorProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorProductRepository extends JpaRepository<VendorProduct, UUID> {

    List<VendorProduct> findByVendor_VendorIdAndIsDeletedFalse(UUID vendorId);

    List<VendorProduct> findByProduct_ProductIdAndIsDeletedFalse(UUID productId);

    boolean existsByVendor_VendorIdAndProduct_ProductId(UUID vendorId, UUID productId);

    Optional<VendorProduct> findByVendorProductId(UUID vendorProductId);
}
