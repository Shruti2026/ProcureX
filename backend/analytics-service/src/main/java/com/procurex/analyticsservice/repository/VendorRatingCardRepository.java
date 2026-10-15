package com.procurex.analyticsservice.repository;

import com.procurex.analyticsservice.entity.VendorRatingCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VendorRatingCardRepository extends JpaRepository<VendorRatingCard, UUID> {
    Optional<VendorRatingCard> findByVendorId(UUID vendorId);
    List<VendorRatingCard> findByOrganizationId(UUID organizationId);
}
