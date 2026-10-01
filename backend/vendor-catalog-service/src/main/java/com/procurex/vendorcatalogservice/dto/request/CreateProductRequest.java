package com.procurex.vendorcatalogservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateProductRequest(

        @NotNull(message = "Category ID is required")
        UUID categoryId,

        @NotBlank(message = "Product name is required")
        @Size(max = 150, message = "Product name must not exceed 150 characters")
        String productName,

        String description,

        @NotBlank(message = "Unit of measure is required")
        @Size(max = 30, message = "Unit of measure must not exceed 30 characters")
        String unitOfMeasure,

        @Min(value = 0, message = "Minimum stock must be zero or greater")
        int minimumStock
) {}
