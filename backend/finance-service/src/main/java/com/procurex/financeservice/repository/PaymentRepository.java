package com.procurex.financeservice.repository;

import com.procurex.financeservice.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Page<Payment> findByOrganizationId(UUID orgId, Pageable pageable);

    Optional<Payment> findByInvoice_InvoiceId(UUID invoiceId);
}
