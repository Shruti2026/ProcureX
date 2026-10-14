package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GrnItemData(UUID grnItemId, UUID productId, String productName,
                          int quantityOrdered, int quantityReceived) {}
