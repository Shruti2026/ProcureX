package com.procurex.vendorcatalogservice.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID productId,
        UUID categoryId,
        String categoryName,
        String productName,
        String description,
        String unitOfMeasure,
        int minimumStock,
        LocalDateTime createdAt
) {}
