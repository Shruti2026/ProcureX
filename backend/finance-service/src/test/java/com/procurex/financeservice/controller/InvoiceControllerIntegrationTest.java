package com.procurex.financeservice.controller;

import com.procurex.financeservice.client.InventoryServiceClient;
import com.procurex.financeservice.client.ProcurementServiceClient;
import com.procurex.financeservice.entity.Invoice;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.repository.InvoiceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link InvoiceController}.
 *
 * <p>Uses a full Spring application context with an in-memory H2 database (profile "test").
 * {@link ProcurementServiceClient} and {@link InventoryServiceClient} are mocked to prevent
 * real Feign calls during tests.
 *
 * <p>Auth is provided via the gateway identity headers read by
 * {@link com.procurex.financeservice.filter.SecurityContextFilter}:
 * <ul>
 *   <li>{@code X-User-Id}          – triggers authentication (omitting = 401)</li>
 *   <li>{@code X-Organization-Id}  – organization scope</li>
 *   <li>{@code X-User-Roles}       – mapped to {@code ROLE_<value>} authorities</li>
 * </ul>
 *
 * <p>Because {@link Invoice#prePersist()} always resets status to PENDING_VERIFICATION,
 * VERIFIED invoices are seeded via a direct JDBC update after the initial save.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InvoiceControllerIntegrationTest {

    private static final String BASE_URL = "/api/v1/finance/invoices";

    private static final UUID ORG_ID  = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID USER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** Prevent real Feign calls to procurement-service. */
    @MockitoBean
    private ProcurementServiceClient procurementServiceClient;

    /** Prevent real Feign calls to inventory-service. */
    @MockitoBean
    private InventoryServiceClient inventoryServiceClient;

    private UUID seededInvoiceId;

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    @BeforeEach
    void seedVerifiedInvoice() {
        // @PrePersist sets status = PENDING_VERIFICATION; override with JDBC update afterward
        Invoice invoice = Invoice.builder()
                .organizationId(ORG_ID)
                .purchaseOrderId(UUID.randomUUID())
                .vendorId(UUID.randomUUID())
                .invoiceNumber("INV-IT-001")
                .invoiceAmount(BigDecimal.valueOf(45000))
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();
        Invoice saved = invoiceRepository.saveAndFlush(invoice);
        seededInvoiceId = saved.getInvoiceId();

        // Bypass @PrePersist status reset: directly set VERIFIED via JDBC
        jdbcTemplate.update(
                "UPDATE invoices SET status = ? WHERE invoice_id = ?",
                InvoiceStatus.VERIFIED.name(),
                seededInvoiceId.toString()
        );
    }

    @AfterEach
    void cleanUp() {
        invoiceRepository.deleteAll();
    }

    // -------------------------------------------------------------------------
    // Test 1: approveInvoice_success_returns200
    // -------------------------------------------------------------------------

    @Test
    void approveInvoice_success_returns200() throws Exception {
        // FINANCE_MANAGER approves a VERIFIED invoice → 200
        mockMvc.perform(post(BASE_URL + "/" + seededInvoiceId + "/approve")
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-Organization-Id", ORG_ID.toString())
                        .header("X-User-Roles", "FINANCE_MANAGER"))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // Test 2: approveInvoice_unauthorized_returns401
    // -------------------------------------------------------------------------

    @Test
    void approveInvoice_unauthorized_returns401() throws Exception {
        // No identity headers → SecurityContextFilter leaves SecurityContext empty → 401
        mockMvc.perform(post(BASE_URL + "/" + seededInvoiceId + "/approve"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Test 3: getInvoices_success_returnsList
    // -------------------------------------------------------------------------

    @Test
    void getInvoices_success_returnsList() throws Exception {
        // FINANCE_MANAGER lists invoices → 200
        mockMvc.perform(get(BASE_URL)
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-Organization-Id", ORG_ID.toString())
                        .header("X-User-Roles", "FINANCE_MANAGER"))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // Test 4: approveInvoice_notFound_returns404
    // -------------------------------------------------------------------------

    @Test
    void approveInvoice_notFound_returns404() throws Exception {
        // Random UUID that does not exist → ResourceNotFoundException → 404
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(post(BASE_URL + "/" + nonExistentId + "/approve")
                        .header("X-User-Id", USER_ID.toString())
                        .header("X-Organization-Id", ORG_ID.toString())
                        .header("X-User-Roles", "FINANCE_MANAGER"))
                .andExpect(status().isNotFound());
    }
}
