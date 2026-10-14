package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record POData(UUID purchaseOrderId, String poNumber, String status,
                     UUID vendorId, BigDecimal totalAmount, List<POItemData> items) {}
