package com.procurex.vendorcatalogservice.dto.request;

import com.procurex.vendorcatalogservice.entity.MappingStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateVendorProductRequest(

        @NotNull(message = "Vendor price is required")
        @DecimalMin(value = "0.01", message = "Vendor price must be at least 0.01")
        BigDecimal vendorPrice,

        @Min(value = 1, message = "Minimum order quantity must be at least 1")
        int minimumOrderQuantity,

        @Min(value = 1, message = "Lead time must be at least 1 day")
        Integer leadTimeDays,

        MappingStatus status
) {}
