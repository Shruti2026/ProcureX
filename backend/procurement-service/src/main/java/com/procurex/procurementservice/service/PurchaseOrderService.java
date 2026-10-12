package com.procurex.procurementservice.service;

import com.procurex.procurementservice.dto.request.CreatePurchaseOrderRequest;
import com.procurex.procurementservice.dto.response.PurchaseOrderResponse;
import com.procurex.procurementservice.entity.POStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PurchaseOrderService {

    PurchaseOrderResponse createFromQuotation(CreatePurchaseOrderRequest request, UUID createdBy, UUID orgId);

    Page<PurchaseOrderResponse> getAll(UUID orgId, POStatus status, Pageable pageable);

    PurchaseOrderResponse getById(UUID poId, UUID orgId);

    PurchaseOrderResponse approve(UUID poId, UUID orgId, UUID managerId, String remarks);

    PurchaseOrderResponse cancel(UUID poId, UUID orgId, UUID managerId, String remarks);
}
