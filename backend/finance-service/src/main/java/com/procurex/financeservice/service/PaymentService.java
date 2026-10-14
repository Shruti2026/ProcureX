package com.procurex.financeservice.service;

import com.procurex.financeservice.dto.request.InitiatePaymentRequest;
import com.procurex.financeservice.dto.response.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PaymentService {

    PaymentResponse initiatePayment(InitiatePaymentRequest request, UUID orgId, UUID managerId);

    Page<PaymentResponse> getAll(UUID orgId, Pageable pageable);

    PaymentResponse getByInvoiceId(UUID invoiceId, UUID orgId);
}
