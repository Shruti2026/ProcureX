package com.procurex.financeservice.repository;

import com.procurex.financeservice.entity.Invoice;
import com.procurex.financeservice.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Page<Invoice> findByOrganizationId(UUID orgId, Pageable pageable);

    Page<Invoice> findByOrganizationIdAndStatus(UUID orgId, InvoiceStatus status, Pageable pageable);

    Optional<Invoice> findByInvoiceIdAndOrganizationId(UUID invoiceId, UUID orgId);

    boolean existsByPurchaseOrderId(UUID purchaseOrderId);

    long countByOrganizationIdAndStatus(UUID orgId, InvoiceStatus status);

    Page<Invoice> findByVendorId(UUID vendorId, Pageable pageable);

    Page<Invoice> findByVendorIdAndStatus(UUID vendorId, InvoiceStatus status, Pageable pageable);
}
