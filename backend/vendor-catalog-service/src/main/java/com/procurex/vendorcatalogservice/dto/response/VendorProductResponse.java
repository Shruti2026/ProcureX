package com.procurex.vendorcatalogservice.dto.response;

import com.procurex.vendorcatalogservice.entity.MappingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record VendorProductResponse(
        UUID vendorProductId,
        UUID vendorId,
        String companyName,
        UUID productId,
        String productName,
        String unitOfMeasure,
        BigDecimal vendorPrice,
        int minimumOrderQuantity,
        Integer leadTimeDays,
        MappingStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
