package com.procurex.procurementservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Non-generic ApiResponse record typed for ProductSummary.
 * Using a non-generic record avoids Jackson type-erasure issues when
 * deserializing the response from vendor-catalog-service via Feign.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductApiResponse(
        boolean success,
        String message,
        ProductSummary data
) {}
