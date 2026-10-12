package com.procurex.inventoryservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PurchaseOrderData(
        UUID purchaseOrderId,
        String poNumber,
        UUID vendorId,
        String companyName,
        String status,
        List<POItemData> items
) {}
