package com.procurex.financeservice.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.financeservice.dto.request.InitiatePaymentRequest;
import com.procurex.financeservice.dto.response.PaymentResponse;
import com.procurex.financeservice.entity.Budget;
import com.procurex.financeservice.entity.Invoice;
import com.procurex.financeservice.entity.InvoiceHistory;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.entity.OutboxEvent;
import com.procurex.financeservice.entity.Payment;
import com.procurex.financeservice.exception.ConflictException;
import com.procurex.financeservice.exception.ResourceNotFoundException;
import com.procurex.financeservice.repository.BudgetRepository;
import com.procurex.financeservice.repository.InvoiceRepository;
import com.procurex.financeservice.repository.OutboxEventRepository;
import com.procurex.financeservice.repository.PaymentRepository;
import com.procurex.financeservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository    paymentRepository;
    private final InvoiceRepository    invoiceRepository;
    private final BudgetRepository     budgetRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper         objectMapper;

    @Override
    public PaymentResponse initiatePayment(InitiatePaymentRequest request,
                                           UUID orgId, UUID managerId) {
        // 1. Load invoice
        Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(
                request.invoiceId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found: " + request.invoiceId()));

        // 2. Must be APPROVED
        if (invoice.getStatus() != InvoiceStatus.APPROVED) {
            throw new IllegalStateException(
                    "Payment can only be initiated for APPROVED invoices. Current: "
                    + invoice.getStatus());
        }

        // 3. No duplicate payment
        if (paymentRepository.findByInvoice_InvoiceId(request.invoiceId()).isPresent()) {
            throw new ConflictException("Payment already initiated for invoice: " + request.invoiceId());
        }

        // 4. Build payment
        String txnRef = "TXN-" + System.currentTimeMillis();
        Payment payment = Payment.builder()
                .organizationId(orgId)
                .invoice(invoice)
                .amount(invoice.getInvoiceAmount())
                .paymentMethod(request.paymentMethod())
                .transactionReference(txnRef)
                .build();

        // 5. Mark invoice PAID
        invoice.setStatus(InvoiceStatus.PAID);
        InvoiceHistory history = InvoiceHistory.builder()
                .organizationId(orgId)
                .invoice(invoice)
                .fromStatus(InvoiceStatus.APPROVED)
                .toStatus(InvoiceStatus.PAID)
                .remarks("Payment initiated: " + txnRef)
                .changedBy(managerId)
                .build();
        invoice.getHistory().add(history);
        invoiceRepository.save(invoice);

        // 6. Budget update (best-effort, retry up to 3 times for optimistic lock conflicts)
        updateBudget(orgId, invoice.getInvoiceAmount());

        // 7. Save payment
        Payment savedPayment = paymentRepository.save(payment);

        // 8. Build outbox event
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "paymentId",       savedPayment.getPaymentId().toString(),
                    "invoiceId",       invoice.getInvoiceId().toString(),
                    "poId",            invoice.getPurchaseOrderId().toString(),
                    "vendorId",        invoice.getVendorId().toString(),
                    "orgId",           orgId.toString(),
                    "amount",          invoice.getInvoiceAmount().toString(),
                    "method",          request.paymentMethod().name(),
                    "transactionRef",  txnRef
            ));
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .eventType("finance.payment.completed")
                    .aggregateType("PAYMENT")
                    .aggregateId(savedPayment.getPaymentId())
                    .payload(payload)
                    .build();
            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize payment outbox event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to serialize payment event", e);
        }

        // 9. Mark COMPLETED
        savedPayment.setStatus(com.procurex.financeservice.entity.PaymentStatus.COMPLETED);
        savedPayment.setCompletedAt(LocalDateTime.now());
        Payment completed = paymentRepository.save(savedPayment);

        log.info("Payment initiated and completed: id={}, txnRef={}", completed.getPaymentId(), txnRef);
        return toResponse(completed);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAll(UUID orgId, Pageable pageable) {
        return paymentRepository.findByOrganizationId(orgId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getByInvoiceId(UUID invoiceId, UUID orgId) {
        return paymentRepository.findByInvoice_InvoiceId(invoiceId)
                .filter(p -> p.getOrganizationId().equals(orgId))
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for invoice: " + invoiceId));
    }

    // -------------------------------------------------------------------------
    private void updateBudget(UUID orgId, BigDecimal amount) {
        int currentYear = LocalDate.now().getYear();
        List<Budget> budgets = budgetRepository.findByOrganizationId(orgId);

        Budget target = budgets.stream()
                .filter(b -> b.getFiscalYear() == currentYear)
                .findFirst()
                .orElse(null);

        if (target == null) {
            log.warn("No budget found for org {} in year {} — skipping budget update", orgId, currentYear);
            return;
        }

        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                target.setUsedAmount(target.getUsedAmount().add(amount));
                BigDecimal newCommitted = target.getCommittedAmount().subtract(amount);
                target.setCommittedAmount(newCommitted.compareTo(BigDecimal.ZERO) < 0
                        ? BigDecimal.ZERO : newCommitted);
                budgetRepository.save(target);
                return;
            } catch (OptimisticLockingFailureException e) {
                log.warn("Budget optimistic lock conflict on attempt {}: {}", attempt + 1, e.getMessage());
                // Re-read and retry
                target = budgetRepository.findById(target.getBudgetId()).orElse(null);
                if (target == null) return;
            }
        }
        log.error("Budget update failed after 3 attempts for org {}", orgId);
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getPaymentId(),
                p.getInvoice().getInvoiceId(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getTransactionReference(),
                p.getStatus(),
                p.getInitiatedAt(),
                p.getCompletedAt()
        );
    }
}
