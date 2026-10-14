package com.procurex.financeservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "procurex-procurement-service")
public interface ProcurementServiceClient {

    @GetMapping("/api/v1/procurement/orders/{id}")
    PurchaseOrderClientResponse getPurchaseOrder(@PathVariable("id") UUID poId);
}
