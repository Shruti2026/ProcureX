package com.procurex.vendorcatalogservice.dto.response;

import com.procurex.vendorcatalogservice.entity.VendorStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record VendorResponse(
        UUID vendorId,
        UUID organizationId,
        UUID userId,
        String companyName,
        String contactPerson,
        String phoneNumber,
        String address,
        String city,
        String state,
        String country,
        String postalCode,
        String gstNumber,
        VendorStatus vendorStatus,
        BigDecimal rating,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
