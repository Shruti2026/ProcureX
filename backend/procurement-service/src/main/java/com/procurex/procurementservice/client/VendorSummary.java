package com.procurex.procurementservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VendorSummary(UUID vendorId, String companyName, String vendorStatus) {}
