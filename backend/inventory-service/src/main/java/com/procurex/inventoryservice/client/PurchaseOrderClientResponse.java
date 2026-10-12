package com.procurex.inventoryservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PurchaseOrderClientResponse(
        String status,
        String message,
        PurchaseOrderData data
) {}
