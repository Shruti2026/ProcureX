package com.procurex.procurementservice.service.impl;

import com.procurex.procurementservice.client.VendorApiResponse;
import com.procurex.procurementservice.client.VendorCatalogClient;
import com.procurex.procurementservice.dto.request.QuotationItemRequest;
import com.procurex.procurementservice.dto.request.SubmitQuotationRequest;
import com.procurex.procurementservice.dto.response.QuotationItemResponse;
import com.procurex.procurementservice.dto.response.QuotationResponse;
import com.procurex.procurementservice.entity.InvitationStatus;
import com.procurex.procurementservice.entity.Quotation;
import com.procurex.procurementservice.entity.QuotationItem;
import com.procurex.procurementservice.entity.RFQ;
import com.procurex.procurementservice.entity.RFQStatus;
import com.procurex.procurementservice.entity.RFQVendor;
import com.procurex.procurementservice.exception.ResourceNotFoundException;
import com.procurex.procurementservice.repository.QuotationRepository;
import com.procurex.procurementservice.repository.RFQRepository;
import com.procurex.procurementservice.repository.RFQVendorRepository;
import com.procurex.procurementservice.service.QuotationService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuotationServiceImpl implements QuotationService {

    private final QuotationRepository quotationRepository;
    private final RFQRepository rfqRepository;
    private final RFQVendorRepository rfqVendorRepository;
    private final VendorCatalogClient vendorCatalogClient;

    @Override
    @Transactional
    public QuotationResponse submit(SubmitQuotationRequest request, UUID vendorUserId, UUID organizationId) {
        // 1. Load RFQ
        RFQ rfq = rfqRepository.findByRfqIdAndOrganizationId(request.rfqId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RFQ not found with id: " + request.rfqId()));

        // 2. RFQ must be OPEN
        if (rfq.getStatus() != RFQStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "RFQ is not open for quotations");
        }

        // 3. RFQ closing date must not be expired
        if (rfq.getClosingDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "RFQ closing date has passed");
        }

        // 4. Look up vendor by userId
        VendorApiResponse vendorApiResponse;
        try {
            vendorApiResponse = vendorCatalogClient.getVendorByUserId(vendorUserId);
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No vendor profile found for this user");
        }
        if (vendorApiResponse == null || vendorApiResponse.data() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No vendor profile found for this user");
        }
        UUID vendorId = vendorApiResponse.data().vendorId();
        String companyName = vendorApiResponse.data().companyName();

        // 5. Vendor must be invited to this RFQ with status SENT or VIEWED
        RFQVendor rfqVendor = rfq.getInvitedVendors().stream()
                .filter(rv -> rv.getVendorId().equals(vendorId))
                .filter(rv -> rv.getInvitationStatus() == InvitationStatus.SENT
                        || rv.getInvitationStatus() == InvitationStatus.VIEWED)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Vendor is not invited to this RFQ or has already responded"));

        // 6. Prevent duplicate submission
        if (quotationRepository.existsByRfq_RfqIdAndVendorId(rfq.getRfqId(), vendorId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A quotation has already been submitted for this RFQ");
        }

        // 7 & 8. Build items and compute totals
        Quotation quotation = Quotation.builder()
                .organizationId(organizationId)
                .rfq(rfq)
                .vendorId(vendorId)
                .companyName(companyName)
                .deliveryDays(request.deliveryDays())
                .paymentTerms(request.paymentTerms())
                .validityDate(request.validityDate())
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (QuotationItemRequest itemReq : request.items()) {
            BigDecimal itemTotal = itemReq.unitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.quantity()));
            total = total.add(itemTotal);

            QuotationItem item = QuotationItem.builder()
                    .organizationId(organizationId)
                    .quotation(quotation)
                    .productId(itemReq.productId())
                    .productName("Product-" + itemReq.productId())
                    .quantity(itemReq.quantity())
                    .unitPrice(itemReq.unitPrice())
                    .totalPrice(itemTotal)
                    .build();
            quotation.getItems().add(item);
        }
        quotation.setTotalAmount(total);

        // 9. Save quotation (cascades items)
        Quotation saved = quotationRepository.save(quotation);

        // 10. Update RFQVendor invitation status to RESPONDED
        rfqVendor.setInvitationStatus(InvitationStatus.RESPONDED);
        rfqVendorRepository.save(rfqVendor);

        log.info("Quotation submitted by vendor {} for RFQ {}", vendorId, rfq.getRfqNumber());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuotationResponse> getByRFQ(UUID rfqId, UUID orgId) {
        return quotationRepository.findByRfq_RfqIdAndOrganizationId(rfqId, orgId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuotationResponse> getMyQuotations(UUID vendorUserId, UUID organizationId, Pageable pageable) {
        VendorApiResponse vendorApiResponse;
        try {
            vendorApiResponse = vendorCatalogClient.getVendorByUserId(vendorUserId);
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No vendor profile found for this user");
        }
        if (vendorApiResponse == null || vendorApiResponse.data() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No vendor profile found for this user");
        }
        UUID vendorId = vendorApiResponse.data().vendorId();
        return quotationRepository.findByVendorIdAndOrganizationId(vendorId, organizationId, pageable)
                .map(this::toResponse);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private QuotationResponse toResponse(Quotation quotation) {
        List<QuotationItemResponse> itemResponses = quotation.getItems().stream()
                .map(item -> new QuotationItemResponse(
                        item.getQuotationItemId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTotalPrice()
                ))
                .toList();

        return new QuotationResponse(
                quotation.getQuotationId(),
                quotation.getRfq().getRfqId(),
                quotation.getRfq().getRfqNumber(),
                quotation.getVendorId(),
                quotation.getCompanyName(),
                quotation.getTotalAmount(),
                quotation.getDeliveryDays(),
                quotation.getPaymentTerms(),
                quotation.getValidityDate(),
                quotation.getStatus(),
                itemResponses,
                quotation.getSubmittedAt()
        );
    }
}
