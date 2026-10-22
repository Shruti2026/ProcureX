package com.procurex.identityservice.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record SystemHealthPoint(
        Long id,
        Instant recordedAt,
        int servicesOnline,
        int servicesOffline,
        int totalServices,
        BigDecimal uptimeRate
) {}
