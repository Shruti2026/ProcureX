package com.procurex.procurementservice.util;

import com.procurex.procurementservice.repository.RFQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Generates sequential RFQ numbers in the format RFQ-YYYY-NNNNN.
 */
@Component
@RequiredArgsConstructor
public class RFQNumberGenerator {

    private final RFQRepository rfqRepository;

    /**
     * Generates the next available RFQ number for the current year.
     * Example: RFQ-2025-00001
     */
    public String generate() {
        int year = LocalDate.now().getYear();
        String prefix = "RFQ-" + year;
        long count = rfqRepository.countByRfqNumberStartingWith(prefix);
        return String.format("RFQ-%d-%05d", year, count + 1);
    }
}
