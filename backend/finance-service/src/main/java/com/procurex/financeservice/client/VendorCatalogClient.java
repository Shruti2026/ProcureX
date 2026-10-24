package com.procurex.financeservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "procurex-vendor-catalog-service")
public interface VendorCatalogClient {

    @GetMapping("/api/v1/vendors/by-user/{userId}")
    VendorClientResponse getVendorByUserId(@PathVariable("userId") UUID userId);
}
