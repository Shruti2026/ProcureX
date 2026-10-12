package com.procurex.procurementservice.util;

import com.procurex.procurementservice.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Generates sequential purchase order numbers in the format PO-YYYY-NNNNN.
 */
@Component
@RequiredArgsConstructor
public class PONumberGenerator {

    private final PurchaseOrderRepository poRepository;

    /**
     * Generates the next available PO number for the current year.
     * Example: PO-2025-00001
     */
    public String generate() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "PO-" + year + "-";
        long count = poRepository.countByPoNumberStartingWith(prefix);
        return prefix + String.format("%05d", count + 1);
    }
}
