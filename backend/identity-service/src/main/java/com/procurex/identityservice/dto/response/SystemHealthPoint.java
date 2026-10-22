package com.procurex.identityservice.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SystemHealthPoint(
        Long id,
        LocalDateTime recordedAt,
        int servicesOnline,
        int servicesOffline,
        int totalServices,
        BigDecimal uptimeRate
) {}
