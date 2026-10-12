package com.procurex.inventoryservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    public TopicExchange procurexExchange() {
        return new TopicExchange("procurex.exchange", true, false);
    }

    @Bean
    public Queue inventoryQueue() {
        return QueueBuilder.durable("inventory.queue").build();
    }

    @Bean
    public Binding inventoryBinding(Queue inventoryQueue, TopicExchange procurexExchange) {
        return BindingBuilder.bind(inventoryQueue)
                .to(procurexExchange)
                .with("procurement.po.approved");
    }
}
