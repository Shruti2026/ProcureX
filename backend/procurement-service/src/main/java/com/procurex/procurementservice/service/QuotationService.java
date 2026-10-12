package com.procurex.procurementservice.service;

import com.procurex.procurementservice.dto.request.SubmitQuotationRequest;
import com.procurex.procurementservice.dto.response.QuotationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface QuotationService {

    /**
     * Submit a quotation for an RFQ. vendorUserId is the authenticated user's id,
     * used to look up the vendor record.
     */
    QuotationResponse submit(SubmitQuotationRequest request, UUID vendorUserId, UUID organizationId);

    /**
     * Return all quotations for a given RFQ (procurement manager view).
     */
    List<QuotationResponse> getByRFQ(UUID rfqId, UUID orgId);

    /**
     * Return paginated quotations submitted by the authenticated vendor.
     */
    Page<QuotationResponse> getMyQuotations(UUID vendorUserId, UUID organizationId, Pageable pageable);
}
