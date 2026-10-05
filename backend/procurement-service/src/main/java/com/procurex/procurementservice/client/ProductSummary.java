package com.procurex.procurementservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

/**
 * Lightweight projection of the product data returned by vendor-catalog-service.
 * The vendor-catalog-service returns more fields than this record declares, so
 * {@code @JsonIgnoreProperties(ignoreUnknown = true)} tells Jackson to silently
 * discard any unrecognized fields instead of throwing UnrecognizedPropertyException.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductSummary(
        UUID productId,
        String productName,
        String unitOfMeasure
) {}
