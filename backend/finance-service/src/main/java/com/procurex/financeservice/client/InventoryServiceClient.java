package com.procurex.financeservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "procurex-inventory-service")
public interface InventoryServiceClient {

    @GetMapping("/api/v1/inventory/grns")
    GrnListClientResponse getGrnsByPurchaseOrder(
            @RequestParam("purchaseOrderId") UUID purchaseOrderId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size);

    @GetMapping("/api/v1/inventory/inspections/grn/{grnId}")
    InspectionClientResponse getInspectionByGrn(@PathVariable("grnId") UUID grnId);
}
