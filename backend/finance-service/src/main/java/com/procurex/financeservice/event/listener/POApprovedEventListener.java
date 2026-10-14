package com.procurex.financeservice.event.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.financeservice.entity.Budget;
import com.procurex.financeservice.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Listens for PO-approved events and reserves budget (committed amount).
 * Non-blocking: if no budget has sufficient headroom, logs a warning only.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class POApprovedEventListener {

    private final BudgetRepository budgetRepository;
    private final ObjectMapper     objectMapper;

    @RabbitListener(queues = "finance.po.approved.queue")
    public void handlePOApproved(String payload) {
        try {
            Map<String, Object> event = objectMapper.readValue(payload, Map.class);
            UUID orgId = UUID.fromString((String) event.get("organizationId"));
            BigDecimal amount = new BigDecimal(event.get("totalAmount").toString());

            int currentYear = LocalDate.now().getYear();
            List<Budget> budgets = budgetRepository.findByOrganizationId(orgId);

            Budget target = budgets.stream()
                    .filter(b -> b.getFiscalYear() == currentYear)
                    .filter(b -> {
                        BigDecimal available = b.getAllocatedAmount()
                                .subtract(b.getUsedAmount())
                                .subtract(b.getCommittedAmount());
                        return available.compareTo(amount) >= 0;
                    })
                    .findFirst()
                    .orElse(null);

            if (target != null) {
                target.setCommittedAmount(target.getCommittedAmount().add(amount));
                budgetRepository.save(target);
                log.info("Budget reserved: {} committed for PO approval in org {}", amount, orgId);
            } else {
                log.warn("No budget with sufficient headroom found for org {} amount {}", orgId, amount);
            }
        } catch (Exception e) {
            log.error("Failed to process PO approved event: {}", e.getMessage(), e);
        }
    }
}
