package com.procurex.procurementservice.util;

import com.procurex.procurementservice.repository.PurchaseRequisitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Generates sequential requisition numbers in the format PR-YYYY-NNNNN.
 */
@Component
@RequiredArgsConstructor
public class RequisitionNumberGenerator {

    private final PurchaseRequisitionRepository requisitionRepository;

    /**
     * Generates the next available requisition number for the current year.
     * Example: PR-2025-00001
     */
    public String generate() {
        int year = LocalDate.now().getYear();
        String prefix = "PR-" + year;
        long count = requisitionRepository.countByRequisitionNumberStartingWith(prefix);
        return String.format("PR-%d-%05d", year, count + 1);
    }
}
