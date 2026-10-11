package com.procurex.procurementservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VendorApiResponse(boolean success, String message, VendorSummary data) {}
