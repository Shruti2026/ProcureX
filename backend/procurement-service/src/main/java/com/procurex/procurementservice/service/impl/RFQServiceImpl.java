package com.procurex.procurementservice.service.impl;

import com.procurex.procurementservice.client.VendorApiResponse;
import com.procurex.procurementservice.client.VendorCatalogClient;
import com.procurex.procurementservice.dto.request.CreateRFQRequest;
import com.procurex.procurementservice.dto.response.RFQResponse;
import com.procurex.procurementservice.dto.response.RFQVendorResponse;
import com.procurex.procurementservice.entity.PurchaseRequisition;
import com.procurex.procurementservice.entity.RFQ;
import com.procurex.procurementservice.entity.RFQStatus;
import com.procurex.procurementservice.entity.RFQVendor;
import com.procurex.procurementservice.entity.RequisitionStatus;
import com.procurex.procurementservice.exception.ResourceNotFoundException;
import com.procurex.procurementservice.exception.VendorNotFoundException;
import com.procurex.procurementservice.repository.PurchaseRequisitionRepository;
import com.procurex.procurementservice.repository.RFQRepository;
import com.procurex.procurementservice.repository.RFQVendorRepository;
import com.procurex.procurementservice.service.RFQService;
import com.procurex.procurementservice.util.RFQNumberGenerator;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RFQServiceImpl implements RFQService {

    private final RFQRepository rfqRepository;
    private final RFQVendorRepository rfqVendorRepository;
    private final PurchaseRequisitionRepository requisitionRepository;
    private final VendorCatalogClient vendorCatalogClient;
    private final RFQNumberGenerator rfqNumberGenerator;

    @Override
    public RFQResponse create(CreateRFQRequest request, UUID organizationId, UUID userId) {
        // 1. Load requisition
        PurchaseRequisition requisition = requisitionRepository
                .findByRequisitionIdAndOrganizationId(request.requisitionId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Requisition not found with id: " + request.requisitionId()));

        // 2. Validate requisition status
        if (requisition.getStatus() != RequisitionStatus.CREATED) {
            throw new IllegalStateException(
                    "Requisition is not in CREATED status");
        }

        // 3. Validate each vendor and collect summaries
        List<String> companyNames = new ArrayList<>();
        for (UUID vendorId : request.invitedVendorIds()) {
            try {
                VendorApiResponse resp = vendorCatalogClient.getVendor(vendorId);
                if (resp == null || resp.data() == null) {
                    throw new VendorNotFoundException("Vendor not found: " + vendorId);
                }
                if (!"ACTIVE".equals(resp.data().vendorStatus())) {
                    throw new IllegalArgumentException("Vendor " + vendorId + " is not ACTIVE");
                }
                companyNames.add(resp.data().companyName());
            } catch (FeignException.NotFound e) {
                throw new VendorNotFoundException("Vendor not found: " + vendorId);
            }
        }

        // 4. Generate RFQ number
        String rfqNumber = rfqNumberGenerator.generate();

        // 5. Build RFQ entity
        RFQ rfq = RFQ.builder()
                .organizationId(organizationId)
                .requisition(requisition)
                .rfqNumber(rfqNumber)
                .closingDate(request.closingDate())
                .createdBy(userId)
                .updatedBy(userId)
                .invitedVendors(new ArrayList<>())
                .build();

        // 6. Build RFQVendor entities
        List<UUID> vendorIds = request.invitedVendorIds();
        for (int i = 0; i < vendorIds.size(); i++) {
            RFQVendor rfqVendor = RFQVendor.builder()
                    .organizationId(organizationId)
                    .rfq(rfq)
                    .vendorId(vendorIds.get(i))
                    .companyName(companyNames.get(i))
                    .build();
            rfq.getInvitedVendors().add(rfqVendor);
        }

        // 8. Save RFQ (cascades to vendors)
        RFQ saved = rfqRepository.save(rfq);

        // 9. Update requisition status
        requisition.setStatus(RequisitionStatus.RFQ_CREATED);
        requisitionRepository.save(requisition);

        log.info("Created RFQ {} for org {}", saved.getRfqNumber(), organizationId);
        return toRFQResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RFQResponse> getAll(UUID organizationId, String status, Pageable pageable) {
        Page<RFQ> page;
        if (status != null && !status.isBlank()) {
            RFQStatus rfqStatus = RFQStatus.valueOf(status.toUpperCase());
            page = rfqRepository.findByOrganizationIdAndStatus(organizationId, rfqStatus, pageable);
        } else {
            page = rfqRepository.findByOrganizationId(organizationId, pageable);
        }
        return page.map(this::toRFQResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public RFQResponse getById(UUID rfqId, UUID organizationId) {
        RFQ rfq = rfqRepository.findByRfqIdAndOrganizationId(rfqId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RFQ not found with id: " + rfqId));
        return toRFQResponse(rfq);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RFQResponse> getMyInvitations(UUID vendorId, Pageable pageable) {
        return rfqVendorRepository.findByVendorIdWithRfq(vendorId, pageable)
                .map(rv -> toRFQResponse(rv.getRfq()));
    }

    @Override
    public RFQResponse close(UUID rfqId, UUID organizationId, UUID userId) {
        RFQ rfq = rfqRepository.findByRfqIdAndOrganizationId(rfqId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RFQ not found with id: " + rfqId));

        if (rfq.getStatus() != RFQStatus.OPEN) {
            throw new IllegalStateException("Only OPEN RFQs can be closed");
        }

        rfq.setStatus(RFQStatus.CLOSED);
        rfq.setUpdatedBy(userId);
        RFQ saved = rfqRepository.save(rfq);
        log.info("Closed RFQ {} by user {}", saved.getRfqNumber(), userId);
        return toRFQResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private RFQResponse toRFQResponse(RFQ rfq) {
        List<RFQVendorResponse> vendorResponses = rfq.getInvitedVendors().stream()
                .map(rv -> new RFQVendorResponse(
                        rv.getRfqVendorId(),
                        rv.getVendorId(),
                        rv.getCompanyName(),
                        rv.getInvitationStatus(),
                        rv.getCreatedAt()
                ))
                .toList();

        return new RFQResponse(
                rfq.getRfqId(),
                rfq.getRequisition().getRequisitionId(),
                rfq.getRequisition().getTitle(),
                rfq.getRfqNumber(),
                rfq.getIssueDate(),
                rfq.getClosingDate(),
                rfq.getStatus(),
                vendorResponses,
                rfq.getCreatedBy(),
                rfq.getCreatedAt(),
                rfq.getUpdatedAt()
        );
    }
}
