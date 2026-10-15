package com.procurex.identityservice.event;

import com.procurex.identityservice.config.RabbitMQConfig;
import com.procurex.identityservice.entity.OutboxEvent;
import com.procurex.identityservice.repository.OutboxEventRepository;
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
    private final RabbitTemplate        rabbitTemplate;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pending = outboxEventRepository
                .findTop20ByStatusOrderByCreatedAtAsc(OutboxEvent.Status.PENDING);

        for (OutboxEvent event : pending) {
            try {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.EXCHANGE,
                        event.getEventType(),
                        event.getPayload()
                );
                event.setStatus(OutboxEvent.Status.PUBLISHED);
                event.setPublishedAt(LocalDateTime.now());
            } catch (AmqpException ex) {
                log.warn("Outbox publish failed for event {}: {}", event.getEventId(), ex.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxEvent.Status.FAILED);
                }
            }
            outboxEventRepository.save(event);
        }
    }
}
