package com.procurex.inventoryservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record POItemData(
        UUID productId,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
