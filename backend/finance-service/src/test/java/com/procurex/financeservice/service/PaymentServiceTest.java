package com.procurex.financeservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.financeservice.dto.request.InitiatePaymentRequest;
import com.procurex.financeservice.dto.response.PaymentResponse;
import com.procurex.financeservice.entity.Budget;
import com.procurex.financeservice.entity.Invoice;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.entity.Payment;
import com.procurex.financeservice.entity.PaymentMethod;
import com.procurex.financeservice.entity.PaymentStatus;
import com.procurex.financeservice.exception.ConflictException;
import com.procurex.financeservice.repository.BudgetRepository;
import com.procurex.financeservice.repository.InvoiceRepository;
import com.procurex.financeservice.repository.OutboxEventRepository;
import com.procurex.financeservice.repository.PaymentRepository;
import com.procurex.financeservice.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    // -------------------------------------------------------------------------
    // Shared test data
    // -------------------------------------------------------------------------

    private static final UUID ORG_ID     = UUID.randomUUID();
    private static final UUID MANAGER_ID = UUID.randomUUID();
    private static final UUID INVOICE_ID = UUID.randomUUID();
    private static final UUID PO_ID      = UUID.randomUUID();
    private static final UUID VENDOR_ID  = UUID.randomUUID();

    private Invoice buildApprovedInvoice() {
        return Invoice.builder()
                .invoiceId(INVOICE_ID)
                .organizationId(ORG_ID)
                .purchaseOrderId(PO_ID)
                .vendorId(VENDOR_ID)
                .invoiceNumber("INV-001")
                .invoiceAmount(new BigDecimal("5000.00"))
                .status(InvoiceStatus.APPROVED)
                .history(new ArrayList<>())
                .items(new ArrayList<>())
                .build();
    }

    private Budget buildBudgetForCurrentYear() {
        int currentYear = LocalDate.now().getYear();
        return Budget.builder()
                .budgetId(UUID.randomUUID())
                .organizationId(ORG_ID)
                .departmentName("Engineering")
                .fiscalYear(currentYear)
                .allocatedAmount(new BigDecimal("100000.00"))
                .usedAmount(new BigDecimal("10000.00"))
                .committedAmount(new BigDecimal("5000.00"))
                .build();
    }

    // -------------------------------------------------------------------------
    // Test scenarios
    // -------------------------------------------------------------------------

    /**
     * Scenario 1 — Happy path: APPROVED invoice, no existing payment,
     * budget present for current fiscal year → payment saved and response returned.
     */
    @Test
    void initiatePayment_success() throws JsonProcessingException {
        InitiatePaymentRequest request = new InitiatePaymentRequest(INVOICE_ID, PaymentMethod.ACH);
        Invoice invoice = buildApprovedInvoice();
        Budget budget = buildBudgetForCurrentYear();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));
        when(paymentRepository.findByInvoice_InvoiceId(INVOICE_ID))
                .thenReturn(Optional.empty());
        when(budgetRepository.findByOrganizationId(ORG_ID))
                .thenReturn(List.of(budget));
        when(objectMapper.writeValueAsString(any()))
                .thenReturn("{}");
        when(invoiceRepository.save(any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(budgetRepository.save(any(Budget.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation -> {
                    Payment p = invocation.getArgument(0);
                    p.setPaymentId(UUID.randomUUID());
                    return p;
                });

        PaymentResponse response = paymentService.initiatePayment(request, ORG_ID, MANAGER_ID);

        assertThat(response).isNotNull();
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(response.paymentMethod()).isEqualTo(PaymentMethod.ACH);
        assertThat(response.status()).isEqualTo(PaymentStatus.COMPLETED);
        // paymentRepository.save() is called twice: first to persist the payment and get an ID,
        // then again after setting status=COMPLETED and completedAt.
        verify(paymentRepository, times(2)).save(any(Payment.class));
        verify(outboxEventRepository).save(any());
    }

    /**
     * Scenario 2 — Invoice is not APPROVED → IllegalStateException.
     */
    @Test
    void initiatePayment_invoiceNotApproved_throwsIllegalState() {
        InitiatePaymentRequest request = new InitiatePaymentRequest(INVOICE_ID, PaymentMethod.WIRE);

        Invoice invoice = buildApprovedInvoice();
        invoice.setStatus(InvoiceStatus.PENDING_VERIFICATION);

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> paymentService.initiatePayment(request, ORG_ID, MANAGER_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APPROVED");

        verify(paymentRepository, never()).save(any());
    }

    /**
     * Scenario 3 — Payment already exists for the invoice → ConflictException.
     */
    @Test
    void initiatePayment_duplicatePayment_throwsConflict() {
        InitiatePaymentRequest request = new InitiatePaymentRequest(INVOICE_ID, PaymentMethod.CHECK);
        Invoice invoice = buildApprovedInvoice();

        Payment existingPayment = Payment.builder()
                .paymentId(UUID.randomUUID())
                .organizationId(ORG_ID)
                .invoice(invoice)
                .amount(invoice.getInvoiceAmount())
                .paymentMethod(PaymentMethod.CHECK)
                .status(PaymentStatus.COMPLETED)
                .build();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));
        when(paymentRepository.findByInvoice_InvoiceId(INVOICE_ID))
                .thenReturn(Optional.of(existingPayment));

        assertThatThrownBy(() -> paymentService.initiatePayment(request, ORG_ID, MANAGER_ID))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining(INVOICE_ID.toString());

        verify(paymentRepository, never()).save(any());
    }

    /**
     * Scenario 4 — No budget exists for the current fiscal year → budget update
     * is silently skipped (no exception). Payment is still saved and outbox event
     * is still written.
     */
    @Test
    void initiatePayment_noBudgetForCurrentYear_paymentStillCompletes() throws JsonProcessingException {
        InitiatePaymentRequest request = new InitiatePaymentRequest(INVOICE_ID, PaymentMethod.ACH);
        Invoice invoice = buildApprovedInvoice();

        // Budget exists but for a different (past) fiscal year — current-year filter returns nothing
        int differentYear = LocalDate.now().getYear() - 1;
        Budget oldBudget = Budget.builder()
                .budgetId(UUID.randomUUID())
                .organizationId(ORG_ID)
                .departmentName("Engineering")
                .fiscalYear(differentYear)
                .allocatedAmount(new BigDecimal("100000.00"))
                .usedAmount(new BigDecimal("10000.00"))
                .committedAmount(new BigDecimal("5000.00"))
                .build();

        when(invoiceRepository.findByInvoiceIdAndOrganizationId(INVOICE_ID, ORG_ID))
                .thenReturn(Optional.of(invoice));
        when(paymentRepository.findByInvoice_InvoiceId(INVOICE_ID))
                .thenReturn(Optional.empty());
        when(budgetRepository.findByOrganizationId(ORG_ID))
                .thenReturn(List.of(oldBudget));
        when(objectMapper.writeValueAsString(any()))
                .thenReturn("{}");
        when(invoiceRepository.save(any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation -> {
                    Payment p = invocation.getArgument(0);
                    p.setPaymentId(UUID.randomUUID());
                    return p;
                });

        PaymentResponse response = paymentService.initiatePayment(request, ORG_ID, MANAGER_ID);

        // Payment must still complete despite missing current-year budget
        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo(PaymentStatus.COMPLETED);
        // paymentRepository.save() is called twice: initial persist then COMPLETED status update.
        verify(paymentRepository, times(2)).save(any(Payment.class));
        verify(outboxEventRepository).save(any());
        // Old-year budget must NOT have been updated
        verify(budgetRepository, never()).save(any(Budget.class));
    }
}
