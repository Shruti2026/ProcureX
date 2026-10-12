package com.procurex.procurementservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

/**
 * Feign client for vendor-catalog-service.
 * Calls GET /api/v1/products/{productId} to validate and retrieve product details.
 * Calls GET /api/v1/vendors/{vendorId} to validate and retrieve vendor details.
 */
@FeignClient(name = "procurex-vendor-catalog-service")
public interface VendorCatalogClient {

    @GetMapping("/api/v1/products/{productId}")
    ProductApiResponse getProduct(@PathVariable("productId") UUID productId);

    @GetMapping("/api/v1/vendors/{vendorId}")
    VendorApiResponse getVendor(@PathVariable("vendorId") UUID vendorId);

    @GetMapping("/api/v1/vendors/by-user/{userId}")
    VendorApiResponse getVendorByUserId(@PathVariable("userId") UUID userId);
}
