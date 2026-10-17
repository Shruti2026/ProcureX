package com.procurex.procurementservice.service;

import com.procurex.procurementservice.client.VendorApiResponse;
import com.procurex.procurementservice.client.VendorCatalogClient;
import com.procurex.procurementservice.client.VendorSummary;
import com.procurex.procurementservice.dto.request.QuotationItemRequest;
import com.procurex.procurementservice.dto.request.SubmitQuotationRequest;
import com.procurex.procurementservice.dto.response.QuotationResponse;
import com.procurex.procurementservice.entity.InvitationStatus;
import com.procurex.procurementservice.entity.PurchaseRequisition;
import com.procurex.procurementservice.entity.RFQ;
import com.procurex.procurementservice.entity.RFQStatus;
import com.procurex.procurementservice.entity.RFQVendor;
import com.procurex.procurementservice.repository.QuotationRepository;
import com.procurex.procurementservice.repository.RFQRepository;
import com.procurex.procurementservice.repository.RFQVendorRepository;
import com.procurex.procurementservice.service.impl.QuotationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuotationServiceTest {

    @InjectMocks
    private QuotationServiceImpl quotationService;

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private RFQRepository rfqRepository;

    @Mock
    private RFQVendorRepository rfqVendorRepository;

    @Mock
    private VendorCatalogClient vendorCatalogClient;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private RFQ buildOpenRFQ(UUID rfqId, UUID orgId, UUID vendorId, InvitationStatus vendorStatus) {
        RFQVendor rfqVendor = RFQVendor.builder()
                .rfqVendorId(UUID.randomUUID())
                .organizationId(orgId)
                .vendorId(vendorId)
                .companyName("Test Vendor Ltd.")
                .invitationStatus(vendorStatus)
                .build();

        PurchaseRequisition requisition = PurchaseRequisition.builder()
                .requisitionId(UUID.randomUUID())
                .title("Test PR")
                .items(new ArrayList<>())
                .build();

        List<RFQVendor> vendors = new ArrayList<>();
        vendors.add(rfqVendor);

        return RFQ.builder()
                .rfqId(rfqId)
                .organizationId(orgId)
                .rfqNumber("RFQ-001")
                .status(RFQStatus.OPEN)
                .issueDate(LocalDate.now().minusDays(1))
                .closingDate(LocalDate.now().plusDays(7))
                .requisition(requisition)
                .invitedVendors(vendors)
                .build();
    }

    private SubmitQuotationRequest buildSubmitRequest(UUID rfqId) {
        QuotationItemRequest item = new QuotationItemRequest(
                UUID.randomUUID(),
                2,
                new BigDecimal("50.00")
        );
        return new SubmitQuotationRequest(
                rfqId,
                LocalDate.now().plusDays(30),
                14,
                "Net 30",
                List.of(item)
        );
    }

    private VendorApiResponse buildVendorApiResponse(UUID vendorId) {
        VendorSummary summary = new VendorSummary(vendorId, "Test Vendor Ltd.", "ACTIVE");
        return new VendorApiResponse(true, "OK", summary);
    }

    // -------------------------------------------------------------------------
    // Test 1: submit_success_SentStatus
    // Happy path — vendor has SENT invitation status
    // -------------------------------------------------------------------------

    @Test
    void submit_success_SentStatus() {
        UUID rfqId   = UUID.randomUUID();
        UUID orgId   = UUID.randomUUID();
        UUID vendorUserId = UUID.randomUUID();
        UUID vendorId     = UUID.randomUUID();

        RFQ rfq = buildOpenRFQ(rfqId, orgId, vendorId, InvitationStatus.SENT);
        SubmitQuotationRequest request = buildSubmitRequest(rfqId);

        when(rfqRepository.findByRfqIdAndOrganizationId(rfqId, orgId))
                .thenReturn(Optional.of(rfq));
        when(vendorCatalogClient.getVendorByUserId(vendorUserId))
                .thenReturn(buildVendorApiResponse(vendorId));
        when(quotationRepository.existsByRfq_RfqIdAndVendorId(rfqId, vendorId))
                .thenReturn(false);
        when(quotationRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(rfqVendorRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        QuotationResponse result = quotationService.submit(request, vendorUserId, orgId);

        assertThat(result).isNotNull();
        assertThat(result.rfqId()).isEqualTo(rfqId);
        assertThat(result.vendorId()).isEqualTo(vendorId);
    }

    // -------------------------------------------------------------------------
    // Test 2: submit_rfqNotOpen_throwsUnprocessable
    // RFQ status is not OPEN — expects 422 UNPROCESSABLE_ENTITY
    // -------------------------------------------------------------------------

    @Test
    void submit_rfqNotOpen_throwsUnprocessable() {
        UUID rfqId   = UUID.randomUUID();
        UUID orgId   = UUID.randomUUID();
        UUID vendorUserId = UUID.randomUUID();

        RFQ rfq = buildOpenRFQ(rfqId, orgId, UUID.randomUUID(), InvitationStatus.SENT);
        rfq.setStatus(RFQStatus.CLOSED);

        SubmitQuotationRequest request = buildSubmitRequest(rfqId);

        when(rfqRepository.findByRfqIdAndOrganizationId(rfqId, orgId))
                .thenReturn(Optional.of(rfq));

        assertThatThrownBy(() -> quotationService.submit(request, vendorUserId, orgId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    // -------------------------------------------------------------------------
    // Test 3: submit_closedDeadline_throwsUnprocessable
    // RFQ closingDate is yesterday — expects 422 UNPROCESSABLE_ENTITY
    // -------------------------------------------------------------------------

    @Test
    void submit_closedDeadline_throwsUnprocessable() {
        UUID rfqId   = UUID.randomUUID();
        UUID orgId   = UUID.randomUUID();
        UUID vendorUserId = UUID.randomUUID();

        RFQ rfq = buildOpenRFQ(rfqId, orgId, UUID.randomUUID(), InvitationStatus.SENT);
        rfq.setClosingDate(LocalDate.now().minusDays(1)); // expired yesterday

        SubmitQuotationRequest request = buildSubmitRequest(rfqId);

        when(rfqRepository.findByRfqIdAndOrganizationId(rfqId, orgId))
                .thenReturn(Optional.of(rfq));

        assertThatThrownBy(() -> quotationService.submit(request, vendorUserId, orgId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    // -------------------------------------------------------------------------
    // Test 4: submit_vendorNotInvited_throwsForbidden
    // Vendor's UUID is not in the RFQ invitedVendors list — expects 403 FORBIDDEN
    // -------------------------------------------------------------------------

    @Test
    void submit_vendorNotInvited_throwsForbidden() {
        UUID rfqId        = UUID.randomUUID();
        UUID orgId        = UUID.randomUUID();
        UUID vendorUserId = UUID.randomUUID();
        UUID vendorId     = UUID.randomUUID();    // the vendor that is invited
        UUID otherVendorId = UUID.randomUUID();   // the vendor returned by client (not invited)

        // RFQ has a different vendor invited, not the one the client returns
        RFQ rfq = buildOpenRFQ(rfqId, orgId, vendorId, InvitationStatus.SENT);
        SubmitQuotationRequest request = buildSubmitRequest(rfqId);

        when(rfqRepository.findByRfqIdAndOrganizationId(rfqId, orgId))
                .thenReturn(Optional.of(rfq));
        // Client returns a vendor that is NOT in the invited list
        when(vendorCatalogClient.getVendorByUserId(vendorUserId))
                .thenReturn(buildVendorApiResponse(otherVendorId));

        assertThatThrownBy(() -> quotationService.submit(request, vendorUserId, orgId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.FORBIDDEN));
    }

    // -------------------------------------------------------------------------
    // Test 5: submit_duplicateQuotation_throwsConflict
    // Quotation already exists for this vendor + RFQ — expects 409 CONFLICT
    // -------------------------------------------------------------------------

    @Test
    void submit_duplicateQuotation_throwsConflict() {
        UUID rfqId        = UUID.randomUUID();
        UUID orgId        = UUID.randomUUID();
        UUID vendorUserId = UUID.randomUUID();
        UUID vendorId     = UUID.randomUUID();

        RFQ rfq = buildOpenRFQ(rfqId, orgId, vendorId, InvitationStatus.SENT);
        SubmitQuotationRequest request = buildSubmitRequest(rfqId);

        when(rfqRepository.findByRfqIdAndOrganizationId(rfqId, orgId))
                .thenReturn(Optional.of(rfq));
        when(vendorCatalogClient.getVendorByUserId(vendorUserId))
                .thenReturn(buildVendorApiResponse(vendorId));
        when(quotationRepository.existsByRfq_RfqIdAndVendorId(rfqId, vendorId))
                .thenReturn(true); // duplicate!

        assertThatThrownBy(() -> quotationService.submit(request, vendorUserId, orgId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }
}
