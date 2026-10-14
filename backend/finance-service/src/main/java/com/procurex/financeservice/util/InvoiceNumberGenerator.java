package com.procurex.financeservice.util;

import com.procurex.financeservice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Generates sequential invoice numbers in the form INV-YYYY-XXXXX.
 * Uses total invoice count as sequence base — the UNIQUE constraint on
 * invoice_number prevents collisions.
 */
@Component
@RequiredArgsConstructor
public class InvoiceNumberGenerator {

    private final InvoiceRepository invoiceRepository;

    public String generate() {
        String year   = String.valueOf(LocalDate.now().getYear());
        String prefix = "INV-" + year + "-";
        long   count  = invoiceRepository.count();
        return prefix + String.format("%05d", count + 1);
    }
}
