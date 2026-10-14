package com.procurex.financeservice.dto.response;

import java.util.UUID;

public record MatchFlag(
        UUID productId,
        String productName,
        String flagType,
        String details
) {}
