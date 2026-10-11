package com.procurex.vendorcatalogservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateProductRequest(

        @NotBlank(message = "Product name is required")
        @Size(max = 150, message = "Product name must not exceed 150 characters")
        String productName,

        String description,

        UUID categoryId,

        @NotBlank(message = "Unit of measure is required")
        String unitOfMeasure,

        @Min(value = 0, message = "Minimum stock must be non-negative")
        int minimumStock
) {}
