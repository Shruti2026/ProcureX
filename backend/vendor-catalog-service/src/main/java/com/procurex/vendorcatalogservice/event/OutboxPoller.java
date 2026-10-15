package com.procurex.vendorcatalogservice.event;

import com.procurex.vendorcatalogservice.entity.OutboxEvent;
import com.procurex.vendorcatalogservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pending = outboxEventRepository
                .findTop20ByStatusOrderByCreatedAtAsc(OutboxEvent.Status.PENDING);

        for (OutboxEvent event : pending) {
            try {
                rabbitTemplate.convertAndSend(
                        "procurex.exchange",
                        event.getEventType(),
                        event.getPayload()
                );
                event.setStatus(OutboxEvent.Status.PUBLISHED);
                event.setPublishedAt(LocalDateTime.now());
                log.info("Published outbox event {} type={}", event.getEventId(), event.getEventType());
            } catch (AmqpException ex) {
                log.warn("Outbox publish failed for event {}: {}", event.getEventId(), ex.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxEvent.Status.FAILED);
                    log.error("Outbox event {} marked FAILED after {} retries", event.getEventId(), event.getRetryCount());
                }
            }
            outboxEventRepository.save(event);
        }
    }
}
