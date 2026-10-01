package com.procurex.procurementservice.client;

import java.util.UUID;

/**
 * Lightweight projection of the product data returned by vendor-catalog-service.
 */
public record ProductSummary(
        UUID productId,
        String productName,
        String unitOfMeasure
) {}
