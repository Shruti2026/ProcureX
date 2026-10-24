package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VendorClientResponse(boolean success, String message, VendorData data) {}
