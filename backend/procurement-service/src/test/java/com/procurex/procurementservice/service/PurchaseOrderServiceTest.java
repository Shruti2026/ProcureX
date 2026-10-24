package com.procurex.procurementservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.procurementservice.dto.response.PurchaseOrderResponse;
import com.procurex.procurementservice.entity.OutboxEvent;
import com.procurex.procurementservice.entity.POStatus;
import com.procurex.procurementservice.entity.PurchaseOrder;
import com.procurex.procurementservice.exception.ResourceNotFoundException;
import com.procurex.procurementservice.repository.OutboxEventRepository;
import com.procurex.procurementservice.repository.PurchaseOrderRepository;
import com.procurex.procurementservice.repository.QuotationRepository;
import com.procurex.procurementservice.repository.RFQRepository;
import com.procurex.procurementservice.service.impl.PurchaseOrderServiceImpl;
import com.procurex.procurementservice.util.PONumberGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceTest {

    @InjectMocks
    private PurchaseOrderServiceImpl purchaseOrderService;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private RFQRepository rfqRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private PONumberGenerator poNumberGenerator;

    @Mock
    private ObjectMapper objectMapper;

    // -------------------------------------------------------------------------
    // Helper: build a minimal PurchaseOrder for testing
    // -------------------------------------------------------------------------

    private PurchaseOrder buildPO(POStatus status) {
        return PurchaseOrder.builder()
                .purchaseOrderId(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .poNumber("PO-TEST-001")
                .vendorId(UUID.randomUUID())
                .companyName("Test Vendor Ltd.")
                .totalAmount(BigDecimal.valueOf(5000.00))
                .status(status)
                .version(0)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();
    }

    // -------------------------------------------------------------------------
    // Test 1: approvePO_createdStatus_changesStatusAndWritesOutbox
    // -------------------------------------------------------------------------

    @Test
    void approvePO_createdStatus_changesStatusAndWritesOutbox() throws JsonProcessingException {
        PurchaseOrder po = buildPO(POStatus.CREATED);
        UUID orgId     = po.getOrganizationId();
        UUID poId      = po.getPurchaseOrderId();
        UUID managerId = UUID.randomUUID();

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(outboxEventRepository.save(any(OutboxEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // approve(UUID poId, UUID orgId, UUID managerId, String remarks)
        PurchaseOrderResponse result = purchaseOrderService.approve(poId, orgId, managerId, "Approved by manager");

        // Verify status changed to APPROVED
        assertThat(result.status()).isEqualTo(POStatus.APPROVED);

        // Verify outboxEventRepository.save was called with eventType "procurement.po.approved"
        ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxEventRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo("procurement.po.approved");
    }

    // -------------------------------------------------------------------------
    // Test 2: approvePO_alreadyApproved_throwsResponseStatusException
    // -------------------------------------------------------------------------

    @Test
    void approvePO_alreadyApproved_throwsResponseStatusException() {
        PurchaseOrder po = buildPO(POStatus.APPROVED);
        UUID orgId     = po.getOrganizationId();
        UUID poId      = po.getPurchaseOrderId();
        UUID managerId = UUID.randomUUID();

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));

        assertThatThrownBy(() -> purchaseOrderService.approve(poId, orgId, managerId, ""))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                });
    }

    // -------------------------------------------------------------------------
    // Test 3: approvePO_notFound_throwsResourceNotFoundException
    // -------------------------------------------------------------------------

    @Test
    void approvePO_notFound_throwsResourceNotFoundException() {
        UUID poId      = UUID.randomUUID();
        UUID orgId     = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> purchaseOrderService.approve(poId, orgId, managerId, ""))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // -------------------------------------------------------------------------
    // Test 4: cancelPO_createdStatus_changesStatusToCancelled
    // -------------------------------------------------------------------------

    @Test
    void cancelPO_createdStatus_changesStatusToCancelled() {
        PurchaseOrder po = buildPO(POStatus.CREATED);
        UUID orgId     = po.getOrganizationId();
        UUID poId      = po.getPurchaseOrderId();
        UUID managerId = UUID.randomUUID();

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // cancel(UUID poId, UUID orgId, UUID managerId, String remarks)
        PurchaseOrderResponse result = purchaseOrderService.cancel(poId, orgId, managerId, "Cancelled due to budget constraints");

        assertThat(result.status()).isEqualTo(POStatus.CANCELLED);
    }

    // -------------------------------------------------------------------------
    // Test 5: cancelPO_completedStatus_throwsResponseStatusException
    // -------------------------------------------------------------------------

    @Test
    void cancelPO_completedStatus_throwsResponseStatusException() {
        PurchaseOrder po = buildPO(POStatus.COMPLETED);
        UUID orgId     = po.getOrganizationId();
        UUID poId      = po.getPurchaseOrderId();
        UUID managerId = UUID.randomUUID();

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));

        assertThatThrownBy(() -> purchaseOrderService.cancel(poId, orgId, managerId, ""))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                });
    }

    // -------------------------------------------------------------------------
    // Test 6: acceptPO_approvedStatus_changesStatusToAccepted
    // -------------------------------------------------------------------------

    @Test
    void acceptPO_approvedStatus_changesStatusToAccepted() {
        PurchaseOrder po     = buildPO(POStatus.APPROVED);
        UUID orgId           = po.getOrganizationId();
        UUID poId            = po.getPurchaseOrderId();
        UUID vendorUserId    = po.getVendorId(); // ownership check must pass

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseOrderResponse result = purchaseOrderService.accept(poId, orgId, vendorUserId, "Accepted");

        assertThat(result.status()).isEqualTo(POStatus.ACCEPTED);
    }

    // -------------------------------------------------------------------------
    // Test 7: declinePO_approvedStatus_changesStatusToDeclined
    // -------------------------------------------------------------------------

    @Test
    void declinePO_approvedStatus_changesStatusToDeclined() {
        PurchaseOrder po     = buildPO(POStatus.APPROVED);
        UUID orgId           = po.getOrganizationId();
        UUID poId            = po.getPurchaseOrderId();
        UUID vendorUserId    = po.getVendorId(); // ownership check must pass

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseOrderResponse result = purchaseOrderService.decline(poId, orgId, vendorUserId, "Price too high");

        assertThat(result.status()).isEqualTo(POStatus.DECLINED);
    }

    // -------------------------------------------------------------------------
    // Test 8: acceptPO_notApprovedStatus_throwsResponseStatusException
    // -------------------------------------------------------------------------

    @Test
    void acceptPO_notApprovedStatus_throwsResponseStatusException() {
        PurchaseOrder po = buildPO(POStatus.CREATED);
        UUID orgId        = po.getOrganizationId();
        UUID poId         = po.getPurchaseOrderId();
        UUID vendorUserId = po.getVendorId(); // must match for ownership to pass

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));

        assertThatThrownBy(() -> purchaseOrderService.accept(poId, orgId, vendorUserId, ""))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                });
    }

    // -------------------------------------------------------------------------
    // Test 9: acceptPO_wrongVendor_throwsAccessDeniedException
    // -------------------------------------------------------------------------

    @Test
    void acceptPO_wrongVendor_throwsAccessDeniedException() {
        PurchaseOrder po   = buildPO(POStatus.APPROVED);
        UUID orgId         = po.getOrganizationId();
        UUID poId          = po.getPurchaseOrderId();
        UUID wrongVendorId = UUID.randomUUID(); // different from po.getVendorId()

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));

        assertThatThrownBy(() -> purchaseOrderService.accept(poId, orgId, wrongVendorId, ""))
                .isInstanceOf(AccessDeniedException.class);
    }

    // -------------------------------------------------------------------------
    // Test 10: declinePO_notApprovedStatus_throwsResponseStatusException
    // -------------------------------------------------------------------------

    @Test
    void declinePO_notApprovedStatus_throwsResponseStatusException() {
        PurchaseOrder po = buildPO(POStatus.CREATED);
        UUID orgId        = po.getOrganizationId();
        UUID poId         = po.getPurchaseOrderId();
        UUID vendorUserId = po.getVendorId(); // must match for ownership to pass

        when(purchaseOrderRepository.findByPurchaseOrderIdAndOrganizationId(poId, orgId))
                .thenReturn(Optional.of(po));

        assertThatThrownBy(() -> purchaseOrderService.decline(poId, orgId, vendorUserId, ""))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                });
    }
}
