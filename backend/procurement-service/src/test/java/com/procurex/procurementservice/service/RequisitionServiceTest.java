package com.procurex.procurementservice.service;

import com.procurex.procurementservice.client.ProductApiResponse;
import com.procurex.procurementservice.client.ProductSummary;
import com.procurex.procurementservice.client.VendorCatalogClient;
import com.procurex.procurementservice.dto.request.CreateRequisitionRequest;
import com.procurex.procurementservice.dto.request.RequisitionItemRequest;
import com.procurex.procurementservice.dto.request.UpdateRequisitionRequest;
import com.procurex.procurementservice.dto.response.RequisitionResponse;
import com.procurex.procurementservice.entity.PurchaseRequisition;
import com.procurex.procurementservice.entity.RequisitionStatus;
import com.procurex.procurementservice.exception.ProductNotFoundException;
import com.procurex.procurementservice.exception.ResourceNotFoundException;
import com.procurex.procurementservice.repository.PurchaseRequisitionRepository;
import com.procurex.procurementservice.service.impl.RequisitionServiceImpl;
import com.procurex.procurementservice.util.RequisitionNumberGenerator;
import feign.FeignException;
import feign.Request;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class RequisitionServiceTest {

    @InjectMocks
    private RequisitionServiceImpl requisitionService;

    @Mock
    private PurchaseRequisitionRepository requisitionRepository;

    @Mock
    private VendorCatalogClient vendorCatalogClient;

    @Mock
    private RequisitionNumberGenerator requisitionNumberGenerator;

    // -------------------------------------------------------------------------
    // Test 1: createRequisition_validRequest_savesAndReturnsCreatedStatus
    // -------------------------------------------------------------------------

    @Test
    void createRequisition_validRequest_savesAndReturnsCreatedStatus() {
        UUID productId = UUID.randomUUID();
        UUID userId   = UUID.randomUUID();
        UUID orgId    = UUID.randomUUID();

        // Build a valid ProductApiResponse using the record constructor
        ProductSummary productSummary = new ProductSummary(productId, "Test Product", "UNIT");
        ProductApiResponse productApiResponse = new ProductApiResponse(true, "OK", productSummary);

        // Build the incoming request
        RequisitionItemRequest itemRequest = new RequisitionItemRequest(productId, 5, "some remarks");
        CreateRequisitionRequest request = new CreateRequisitionRequest(
                "Office Supplies",
                "Bulk order for Q1",
                LocalDate.now().plusDays(10),
                List.of(itemRequest)
        );

        when(vendorCatalogClient.getProduct(productId)).thenReturn(productApiResponse);
        when(requisitionNumberGenerator.generate()).thenReturn("PR-TEST-001");
        // Return the entity that was passed in (simulates save returning the persisted object)
        when(requisitionRepository.save(any(PurchaseRequisition.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RequisitionResponse result = requisitionService.create(request, userId, orgId);

        assertThat(result).isNotNull();
        assertThat(result.status()).isEqualTo(RequisitionStatus.CREATED);
        assertThat(result.requisitionNumber()).isEqualTo("PR-TEST-001");
    }

    // -------------------------------------------------------------------------
    // Test 2: createRequisition_productNotFound_throwsProductNotFoundException
    // -------------------------------------------------------------------------

    @Test
    void createRequisition_productNotFound_throwsProductNotFoundException() {
        UUID productId = UUID.randomUUID();
        UUID userId   = UUID.randomUUID();
        UUID orgId    = UUID.randomUUID();

        RequisitionItemRequest itemRequest = new RequisitionItemRequest(productId, 2, null);
        CreateRequisitionRequest request = new CreateRequisitionRequest(
                "Office Supplies",
                null,
                LocalDate.now().plusDays(5),
                List.of(itemRequest)
        );

        // Simulate 404 from vendor-catalog-service
        FeignException.NotFound notFound = new FeignException.NotFound(
                "not found",
                mock(Request.class),
                null,
                null
        );
        when(vendorCatalogClient.getProduct(productId)).thenThrow(notFound);

        assertThatThrownBy(() -> requisitionService.create(request, userId, orgId))
                .isInstanceOf(ProductNotFoundException.class);
    }

    // -------------------------------------------------------------------------
    // Test 3: updateRequisition_nonCreatedStatus_throwsIllegalStateException
    // -------------------------------------------------------------------------

    @Test
    void updateRequisition_nonCreatedStatus_throwsIllegalStateException() {
        UUID requisitionId = UUID.randomUUID();
        UUID userId        = UUID.randomUUID();

        // Build a PR that is already in RFQ_CREATED status
        PurchaseRequisition existingPR = PurchaseRequisition.builder()
                .requisitionId(requisitionId)
                .organizationId(UUID.randomUUID())
                .requisitionNumber("PR-001")
                .title("Old Title")
                .status(RequisitionStatus.RFQ_CREATED)
                .items(new ArrayList<>())
                .build();

        when(requisitionRepository.findById(requisitionId)).thenReturn(Optional.of(existingPR));

        // The update method is: update(UUID requisitionId, UpdateRequisitionRequest request, UUID userId)
        UpdateRequisitionRequest updateRequest = new UpdateRequisitionRequest(
                "Updated Title",
                "Updated description",
                LocalDate.now().plusDays(15),
                List.of(new RequisitionItemRequest(UUID.randomUUID(), 3, null))
        );

        assertThatThrownBy(() -> requisitionService.update(requisitionId, updateRequest, userId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CREATED");
    }

    // -------------------------------------------------------------------------
    // Test 4: getRequisitionById_notFound_throwsResourceNotFoundException
    // -------------------------------------------------------------------------

    @Test
    void getRequisitionById_notFound_throwsResourceNotFoundException() {
        UUID requisitionId = UUID.randomUUID();

        when(requisitionRepository.findById(requisitionId)).thenReturn(Optional.empty());

        // The method is: getById(UUID requisitionId)
        assertThatThrownBy(() -> requisitionService.getById(requisitionId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
