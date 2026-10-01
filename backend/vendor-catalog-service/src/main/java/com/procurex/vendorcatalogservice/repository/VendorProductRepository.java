package com.procurex.vendorcatalogservice.repository;

import com.procurex.vendorcatalogservice.entity.VendorProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VendorProductRepository extends JpaRepository<VendorProduct, UUID> {
}
