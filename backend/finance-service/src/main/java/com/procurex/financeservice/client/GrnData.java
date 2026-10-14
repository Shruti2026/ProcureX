package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GrnData(UUID grnId, String grnNumber, UUID purchaseOrderId,
                      String status, List<GrnItemData> items) {}
