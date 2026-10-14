package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GrnListClientResponse(String status, String message, GrnPageData data) {}
