package com.procurex.financeservice.service;

import com.procurex.financeservice.client.InventoryServiceClient;
import com.procurex.financeservice.client.ProcurementServiceClient;
import com.procurex.financeservice.dto.response.InvoiceResponse;
import com.procurex.financeservice.entity.Invoice;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.exception.ResourceNotFoundException;
import com.procurex.financeservice.repository.InvoiceRepository;
import com.procurex.financeservice.service.impl.InvoiceServiceImpl;
import com.procurex.financeservice.util.InvoiceNumberGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ProcurementServiceClient procurementServiceClient;

    @Mock
    private InventoryServiceClient inventoryServiceClient;

    @Mock
    private InvoiceNumberGenerator invoiceNumberGenerator;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private static final UUID ORG_ID     = UUID.randomUUID();
    private static final UUID INVOICE_ID = UUID.randomUUID();
    private static final UUID MANAGER_ID = UUID.randomUUID();

    // ------------------------------------------------------------------
    // approve
    // ------------------------------------------------------------------

    @Test
    void approveInvoice_verifiedStatus_setsApprovedStatus() {
        Invoice invoice = Invoice.builder()
                .invoiceId(INVOICE_ID)
                .organizationId(ORG_ID)
                .invoiceNumber("INV-001")
                .invoiceAmount(new BigDecimal("5000.00"))
                .status(InvoiceStatus.VERIFIED)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));

        when(invoiceRepository.save(any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceResponse response = invoiceService.approve(INVOICE_ID, ORG_ID, MANAGER_ID, "Looks good");

        assertThat(response.status()).isEqualTo(InvoiceStatus.APPROVED);
    }

    @Test
    void approveInvoice_pendingVerificationStatus_throwsIllegalStateException() {
        Invoice invoice = Invoice.builder()
                .invoiceId(INVOICE_ID)
                .organizationId(ORG_ID)
                .invoiceNumber("INV-002")
                .invoiceAmount(new BigDecimal("3000.00"))
                .status(InvoiceStatus.PENDING_VERIFICATION)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));

        assertThatThrownBy(() ->
                invoiceService.approve(INVOICE_ID, ORG_ID, MANAGER_ID, "Approve early"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("VERIFIED");
    }

    // ------------------------------------------------------------------
    // reject
    // ------------------------------------------------------------------

    @Test
    void rejectInvoice_pendingVerificationStatus_setsRejectedStatus() {
        Invoice invoice = Invoice.builder()
                .invoiceId(INVOICE_ID)
                .organizationId(ORG_ID)
                .invoiceNumber("INV-003")
                .invoiceAmount(new BigDecimal("2000.00"))
                .status(InvoiceStatus.PENDING_VERIFICATION)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));

        when(invoiceRepository.save(any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceResponse response = invoiceService.reject(INVOICE_ID, ORG_ID, MANAGER_ID, "Discrepancy found");

        assertThat(response.status()).isEqualTo(InvoiceStatus.REJECTED);
    }

    @Test
    void rejectInvoice_alreadyApproved_throwsIllegalStateException() {
        // APPROVED is not in the allowed-for-rejection set
        Invoice invoice = Invoice.builder()
                .invoiceId(INVOICE_ID)
                .organizationId(ORG_ID)
                .invoiceNumber("INV-004")
                .invoiceAmount(new BigDecimal("7000.00"))
                .status(InvoiceStatus.APPROVED)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));

        assertThatThrownBy(() ->
                invoiceService.reject(INVOICE_ID, ORG_ID, MANAGER_ID, "Reject approved"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APPROVED");
    }

    // ------------------------------------------------------------------
    // getById
    // ------------------------------------------------------------------

    @Test
    void getInvoiceById_notFound_throwsResourceNotFoundException() {
        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                invoiceService.getById(INVOICE_ID, ORG_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
