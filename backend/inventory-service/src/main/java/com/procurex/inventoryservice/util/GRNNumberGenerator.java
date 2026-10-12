package com.procurex.inventoryservice.util;

import com.procurex.inventoryservice.repository.GoodsReceiptNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Generates sequential GRN numbers in the format GRN-YYYY-NNNNN.
 */
@Component
@RequiredArgsConstructor
public class GRNNumberGenerator {

    private final GoodsReceiptNoteRepository grnRepository;

    /**
     * Generates the next available GRN number for the current year.
     * Example: GRN-2025-00001
     */
    public String generate() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "GRN-" + year + "-";
        long count = grnRepository.countByGrnNumberStartingWith(prefix);
        return prefix + String.format("%05d", count + 1);
    }
}
