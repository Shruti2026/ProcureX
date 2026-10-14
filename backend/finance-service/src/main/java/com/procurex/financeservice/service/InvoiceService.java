package com.procurex.financeservice.service;

import com.procurex.financeservice.dto.request.SubmitInvoiceRequest;
import com.procurex.financeservice.dto.response.InvoiceResponse;
import com.procurex.financeservice.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InvoiceService {

    InvoiceResponse submit(SubmitInvoiceRequest request, UUID orgId, UUID vendorUserId);

    InvoiceResponse runThreeWayMatch(UUID invoiceId, UUID orgId, UUID managerId);

    InvoiceResponse approve(UUID invoiceId, UUID orgId, UUID managerId, String remarks);

    InvoiceResponse reject(UUID invoiceId, UUID orgId, UUID managerId, String remarks);

    Page<InvoiceResponse> getAll(UUID orgId, InvoiceStatus status, Pageable pageable);

    InvoiceResponse getById(UUID invoiceId, UUID orgId);
}
