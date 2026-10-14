package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InspectionItemData(UUID productId, int acceptedQuantity, int rejectedQuantity) {}
