package com.procurex.financeservice.service.impl;

import com.procurex.financeservice.client.GrnData;
import com.procurex.financeservice.client.GrnItemData;
import com.procurex.financeservice.client.GrnListClientResponse;
import com.procurex.financeservice.client.InspectionClientResponse;
import com.procurex.financeservice.client.InspectionItemData;
import com.procurex.financeservice.client.InventoryServiceClient;
import com.procurex.financeservice.client.POItemData;
import com.procurex.financeservice.client.ProcurementServiceClient;
import com.procurex.financeservice.client.PurchaseOrderClientResponse;
import com.procurex.financeservice.dto.request.InvoiceItemRequest;
import com.procurex.financeservice.dto.request.SubmitInvoiceRequest;
import com.procurex.financeservice.dto.response.InvoiceHistoryResponse;
import com.procurex.financeservice.dto.response.InvoiceItemResponse;
import com.procurex.financeservice.dto.response.InvoiceResponse;
import com.procurex.financeservice.dto.response.MatchFlag;
import com.procurex.financeservice.dto.response.MatchResult;
import com.procurex.financeservice.entity.Invoice;
import com.procurex.financeservice.entity.InvoiceHistory;
import com.procurex.financeservice.entity.InvoiceItem;
import com.procurex.financeservice.entity.InvoiceStatus;
import com.procurex.financeservice.exception.ConflictException;
import com.procurex.financeservice.exception.ResourceNotFoundException;
import com.procurex.financeservice.repository.InvoiceRepository;
import com.procurex.financeservice.service.InvoiceService;
import com.procurex.financeservice.util.InvoiceNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InvoiceServiceImpl implements InvoiceService {

    private static final Set<String> ACCEPTED_GRN_STATUSES =
            Set.of("INSPECTED", "ACCEPTED", "COMPLETED");

    private final InvoiceRepository         invoiceRepository;
    private final ProcurementServiceClient  procurementServiceClient;
    private final InventoryServiceClient    inventoryServiceClient;
    private final InvoiceNumberGenerator    invoiceNumberGenerator;

    @Override
    public InvoiceResponse submit(SubmitInvoiceRequest request, UUID orgId, UUID vendorUserId) {
        // 1. Load and validate PO
        PurchaseOrderClientResponse poResponse =
                procurementServiceClient.getPurchaseOrder(request.purchaseOrderId());
        if (poResponse.data() == null) {
            throw new IllegalStateException("Purchase order not found");
        }
        String poStatus = poResponse.data().status();
        if (!"APPROVED".equals(poStatus) && !"ACCEPTED".equals(poStatus)) {
            throw new IllegalStateException(
                    "Invoice can only be submitted for APPROVED or ACCEPTED POs. Current status: " + poStatus);
        }

        // 2. Check duplicate
        if (invoiceRepository.existsByPurchaseOrderId(request.purchaseOrderId())) {
            throw new ConflictException("An invoice has already been submitted for this PO");
        }

        // 3. Compute total
        BigDecimal totalAmount = request.items().stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Generate invoice number
        String invoiceNumber = invoiceNumberGenerator.generate();

        // 5. Build Invoice
        Invoice invoice = Invoice.builder()
                .organizationId(orgId)
                .purchaseOrderId(request.purchaseOrderId())
                .vendorId(poResponse.data().vendorId())
                .invoiceNumber(invoiceNumber)
                .invoiceAmount(totalAmount)
                .items(new ArrayList<>())
                .history(new ArrayList<>())
                .build();

        // 6. Build items
        for (InvoiceItemRequest itemReq : request.items()) {
            BigDecimal total = itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            InvoiceItem item = InvoiceItem.builder()
                    .organizationId(orgId)
                    .invoice(invoice)
                    .productId(itemReq.productId())
                    .productName(itemReq.productName())
                    .quantity(itemReq.quantity())
                    .unitPrice(itemReq.unitPrice())
                    .totalPrice(total)
                    .build();
            invoice.getItems().add(item);
        }

        // 7. Initial history entry
        InvoiceHistory history = InvoiceHistory.builder()
                .organizationId(orgId)
                .invoice(invoice)
                .fromStatus(null)
                .toStatus(InvoiceStatus.PENDING_VERIFICATION)
                .remarks("Invoice submitted")
                .changedBy(vendorUserId)
                .build();
        invoice.getHistory().add(history);

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice submitted: id={}, number={}", saved.getInvoiceId(), invoiceNumber);
        return toResponse(saved, null);
    }

    @Override
    public InvoiceResponse runThreeWayMatch(UUID invoiceId, UUID orgId, UUID managerId) {
        Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));

        if (invoice.getStatus() != InvoiceStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException(
                    "Three-way match can only run on PENDING_VERIFICATION invoices. Current: "
                    + invoice.getStatus());
        }

        // 2. Get PO items map
        PurchaseOrderClientResponse poResponse =
                procurementServiceClient.getPurchaseOrder(invoice.getPurchaseOrderId());
        if (poResponse.data() == null) {
            throw new IllegalStateException("Could not retrieve PO for three-way match");
        }
        Map<UUID, POItemData> poItems = poResponse.data().items().stream()
                .collect(Collectors.toMap(POItemData::productId, Function.identity()));

        // 3. Get GRNs and find accepted one
        GrnListClientResponse grnResponse = inventoryServiceClient.getGrnsByPurchaseOrder(
                invoice.getPurchaseOrderId(), 0, 50);
        GrnData targetGrn = null;
        if (grnResponse.data() != null && grnResponse.data().content() != null) {
            for (GrnData grn : grnResponse.data().content()) {
                if (ACCEPTED_GRN_STATUSES.contains(grn.status())) {
                    targetGrn = grn;
                    break;
                }
            }
        }
        if (targetGrn == null) {
            throw new IllegalStateException(
                    "No accepted/inspected GRN found for this PO. Cannot run three-way match.");
        }

        // 4. Get inspection data
        InspectionClientResponse inspectionResponse =
                inventoryServiceClient.getInspectionByGrn(targetGrn.grnId());
        if (inspectionResponse.data() == null) {
            throw new IllegalStateException("No inspection data found for GRN: " + targetGrn.grnId());
        }
        Map<UUID, InspectionItemData> inspectionItems = inspectionResponse.data().items().stream()
                .collect(Collectors.toMap(InspectionItemData::productId, Function.identity()));

        // 5. Check each invoice item
        List<MatchFlag> flags = new ArrayList<>();
        for (InvoiceItem invoiceItem : invoice.getItems()) {
            UUID productId = invoiceItem.getProductId();

            POItemData poItem = poItems.get(productId);
            if (poItem == null) {
                throw new IllegalStateException(
                        "Product " + productId + " is not on the original PO");
            }

            InspectionItemData inspectionItem = inspectionItems.get(productId);
            if (inspectionItem == null) {
                throw new IllegalStateException(
                        "Product " + productId + " was not found in the inspection results");
            }

            // Quantity check
            if (invoiceItem.getQuantity() > inspectionItem.acceptedQuantity()) {
                flags.add(new MatchFlag(
                        productId,
                        invoiceItem.getProductName(),
                        "QUANTITY_MISMATCH",
                        "Invoice qty " + invoiceItem.getQuantity()
                        + " exceeds accepted qty " + inspectionItem.acceptedQuantity()
                ));
            }

            // Price check (tolerance 0.01)
            if (invoiceItem.getUnitPrice().subtract(poItem.unitPrice()).abs()
                    .compareTo(new BigDecimal("0.01")) > 0) {
                flags.add(new MatchFlag(
                        productId,
                        invoiceItem.getProductName(),
                        "PRICE_MISMATCH",
                        "Invoice unit price " + invoiceItem.getUnitPrice()
                        + " does not match PO price " + poItem.unitPrice()
                ));
            }
        }

        // 6. Update invoice status
        InvoiceStatus newStatus;
        if (!flags.isEmpty()) {
            newStatus = InvoiceStatus.FLAGGED_VARIANCE;
            invoice.setStatus(newStatus);
        } else {
            newStatus = InvoiceStatus.VERIFIED;
            invoice.setStatus(newStatus);
            invoice.setVerifiedBy(managerId);
            invoice.setVerifiedAt(LocalDateTime.now());
        }

        InvoiceHistory history = InvoiceHistory.builder()
                .organizationId(invoice.getOrganizationId())
                .invoice(invoice)
                .fromStatus(InvoiceStatus.PENDING_VERIFICATION)
                .toStatus(newStatus)
                .remarks(flags.isEmpty() ? "Three-way match passed" : "Three-way match flagged " + flags.size() + " issue(s)")
                .changedBy(managerId)
                .build();
        invoice.getHistory().add(history);

        Invoice saved = invoiceRepository.save(invoice);
        MatchResult matchResult = new MatchResult(flags.isEmpty(), flags);
        log.info("Three-way match for invoice {}: passed={}", invoiceId, flags.isEmpty());
        return toResponse(saved, matchResult);
    }

    @Override
    public InvoiceResponse approve(UUID invoiceId, UUID orgId, UUID managerId, String remarks) {
        Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));

        if (invoice.getStatus() != InvoiceStatus.VERIFIED) {
            throw new IllegalStateException(
                    "Only VERIFIED invoices can be approved. Current: " + invoice.getStatus());
        }

        invoice.setStatus(InvoiceStatus.APPROVED);
        invoice.setApprovedBy(managerId);
        invoice.setApprovedAt(LocalDateTime.now());

        InvoiceHistory history = InvoiceHistory.builder()
                .organizationId(orgId)
                .invoice(invoice)
                .fromStatus(InvoiceStatus.VERIFIED)
                .toStatus(InvoiceStatus.APPROVED)
                .remarks(remarks)
                .changedBy(managerId)
                .build();
        invoice.getHistory().add(history);

        Invoice saved = invoiceRepository.save(invoice);
        return toResponse(saved, null);
    }

    @Override
    public InvoiceResponse reject(UUID invoiceId, UUID orgId, UUID managerId, String remarks) {
        Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));

        if (invoice.getStatus() != InvoiceStatus.PENDING_VERIFICATION
                && invoice.getStatus() != InvoiceStatus.VERIFIED
                && invoice.getStatus() != InvoiceStatus.FLAGGED_VARIANCE) {
            throw new IllegalStateException(
                    "Invoice in status " + invoice.getStatus() + " cannot be rejected");
        }

        InvoiceStatus fromStatus = invoice.getStatus();
        invoice.setStatus(InvoiceStatus.REJECTED);

        InvoiceHistory history = InvoiceHistory.builder()
                .organizationId(orgId)
                .invoice(invoice)
                .fromStatus(fromStatus)
                .toStatus(InvoiceStatus.REJECTED)
                .remarks(remarks)
                .changedBy(managerId)
                .build();
        invoice.getHistory().add(history);

        Invoice saved = invoiceRepository.save(invoice);
        return toResponse(saved, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getAll(UUID orgId, InvoiceStatus status, Pageable pageable) {
        if (status != null) {
            return invoiceRepository.findByOrganizationIdAndStatus(orgId, status, pageable)
                    .map(inv -> toResponse(inv, null));
        }
        return invoiceRepository.findByOrganizationId(orgId, pageable)
                .map(inv -> toResponse(inv, null));
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getById(UUID invoiceId, UUID orgId) {
        Invoice invoice = invoiceRepository.findByInvoiceIdAndOrganizationId(invoiceId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));
        return toResponse(invoice, null);
    }

    // -------------------------------------------------------------------------
    // Mapper
    // -------------------------------------------------------------------------
    private InvoiceResponse toResponse(Invoice invoice, MatchResult matchResult) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems().stream()
                .map(item -> new InvoiceItemResponse(
                        item.getInvoiceItemId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTotalPrice()
                ))
                .collect(Collectors.toList());

        List<InvoiceHistoryResponse> historyResponses = invoice.getHistory().stream()
                .map(h -> new InvoiceHistoryResponse(
                        h.getFromStatus(),
                        h.getToStatus(),
                        h.getRemarks(),
                        h.getChangedBy(),
                        h.getChangedAt()
                ))
                .collect(Collectors.toList());

        return new InvoiceResponse(
                invoice.getInvoiceId(),
                invoice.getInvoiceNumber(),
                invoice.getPurchaseOrderId(),
                invoice.getVendorId(),
                invoice.getInvoiceAmount(),
                invoice.getStatus(),
                itemResponses,
                historyResponses,
                matchResult,
                invoice.getSubmittedAt(),
                invoice.getVerifiedAt(),
                invoice.getApprovedAt()
        );
    }
}
