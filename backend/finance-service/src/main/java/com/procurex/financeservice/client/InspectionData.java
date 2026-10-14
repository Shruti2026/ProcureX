package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InspectionData(UUID inspectionId, UUID grnId, String status,
                             List<InspectionItemData> items) {}
