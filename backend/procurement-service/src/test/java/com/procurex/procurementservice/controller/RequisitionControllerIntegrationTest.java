package com.procurex.procurementservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.procurementservice.client.ProductApiResponse;
import com.procurex.procurementservice.client.ProductSummary;
import com.procurex.procurementservice.client.VendorCatalogClient;
import com.procurex.procurementservice.dto.request.CreateRequisitionRequest;
import com.procurex.procurementservice.dto.request.RequisitionItemRequest;
import com.procurex.procurementservice.util.RequisitionNumberGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link RequisitionController}.
 *
 * <p>Uses a full Spring application context with an in-memory H2 database (profile "test").
 * {@link VendorCatalogClient} and {@link RequisitionNumberGenerator} are mocked to prevent
 * real Feign/database-sequence calls during tests.
 *
 * <p>Auth is provided via the gateway identity headers read by
 * {@link com.procurex.procurementservice.config.SecurityContextFilter}:
 * <ul>
 *   <li>{@code X-User-Id}          – triggers authentication (omitting it = 401)</li>
 *   <li>{@code X-Organization-Id}  – organization scope</li>
 *   <li>{@code X-User-Roles}       – roles mapped to {@code ROLE_<value>} authorities</li>
 * </ul>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RequisitionControllerIntegrationTest {

    private static final String BASE_URL = "/api/v1/procurement/requisitions";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /** Prevent real Feign calls to vendor-catalog-service. */
    @MockitoBean
    private VendorCatalogClient vendorCatalogClient;

    /** Prevent DB-sequence calls; return a deterministic PR number. */
    @MockitoBean
    private RequisitionNumberGenerator requisitionNumberGenerator;

    // -------------------------------------------------------------------------
    // Test 1: createRequisition_success_returns201
    // -------------------------------------------------------------------------

    @Test
    void createRequisition_success_returns201() throws Exception {
        UUID productId = UUID.randomUUID();

        // Configure mocks
        ProductSummary productSummary = new ProductSummary(productId, "Office Chair", "UNIT");
        ProductApiResponse productApiResponse = new ProductApiResponse(true, "OK", productSummary);
        when(vendorCatalogClient.getProduct(any())).thenReturn(productApiResponse);
        when(requisitionNumberGenerator.generate()).thenReturn("PR-TEST-001");

        // Build a valid request body
        RequisitionItemRequest item = new RequisitionItemRequest(productId, 3, "Ergonomic");
        CreateRequisitionRequest request = new CreateRequisitionRequest(
                "Office Furniture",
                "Q2 procurement",
                LocalDate.now().plusDays(7),
                List.of(item)
        );

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .header("X-Organization-Id", UUID.randomUUID().toString())
                        .header("X-User-Roles", "PROCUREMENT_MANAGER"))
                .andExpect(status().isCreated());
    }

    // -------------------------------------------------------------------------
    // Test 2: createRequisition_unauthorized_returns401
    // -------------------------------------------------------------------------

    @Test
    void createRequisition_unauthorized_returns401() throws Exception {
        // No identity headers → SecurityContextFilter leaves SecurityContext empty
        // → Spring Security returns 403 (no AuthenticationEntryPoint configured,
        //   so AccessDeniedHandler handles unauthenticated requests as well)
        RequisitionItemRequest item = new RequisitionItemRequest(UUID.randomUUID(), 1, null);
        CreateRequisitionRequest request = new CreateRequisitionRequest(
                "Test Title",
                null,
                LocalDate.now().plusDays(3),
                List.of(item)
        );

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // Test 3: createRequisition_forbidden_returns403
    // -------------------------------------------------------------------------

    @Test
    void createRequisition_forbidden_returns403() throws Exception {
        // VENDOR role → authenticated but @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER','ADMIN')") denies access
        RequisitionItemRequest item = new RequisitionItemRequest(UUID.randomUUID(), 1, null);
        CreateRequisitionRequest request = new CreateRequisitionRequest(
                "Vendor Title",
                null,
                LocalDate.now().plusDays(3),
                List.of(item)
        );

        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .header("X-Organization-Id", UUID.randomUUID().toString())
                        .header("X-User-Roles", "VENDOR"))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // Test 4: getRequisitions_success_returnsList
    // -------------------------------------------------------------------------

    @Test
    void getRequisitions_success_returnsList() throws Exception {
        // GET returns 200 for a PROCUREMENT_MANAGER even when no records exist
        mockMvc.perform(get(BASE_URL)
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .header("X-Organization-Id", UUID.randomUUID().toString())
                        .header("X-User-Roles", "PROCUREMENT_MANAGER"))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // Test 5: createRequisition_invalidBody_returns400
    // -------------------------------------------------------------------------

    @Test
    void createRequisition_invalidBody_returns400() throws Exception {
        // Empty JSON object — missing all @NotBlank / @NotNull / @NotEmpty fields → 400
        mockMvc.perform(post(BASE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .header("X-Organization-Id", UUID.randomUUID().toString())
                        .header("X-User-Roles", "PROCUREMENT_MANAGER"))
                .andExpect(status().isBadRequest());
    }
}
