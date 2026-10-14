package com.procurex.financeservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GrnPageData(List<GrnData> content, int totalElements) {}
