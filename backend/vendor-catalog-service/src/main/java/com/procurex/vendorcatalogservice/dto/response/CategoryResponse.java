package com.procurex.vendorcatalogservice.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record CategoryResponse(
        UUID categoryId,
        String categoryName,
        String description,
        LocalDateTime createdAt
) {}
