package com.procurex.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationQueueConfig {

    @Bean
    public Queue vendorApprovedQueue() {
        return QueueBuilder.durable("notification.vendor.approved.queue")
            .withArgument("x-dead-letter-exchange", "procurex.dlq")
            .withArgument("x-dead-letter-routing-key", "dlq.vendor.approved")
            .build();
    }

    @Bean
    public Queue rfqCreatedQueue() {
        return QueueBuilder.durable("notification.rfq.created.queue")
            .withArgument("x-dead-letter-exchange", "procurex.dlq")
            .withArgument("x-dead-letter-routing-key", "dlq.rfq.created")
            .build();
    }

    @Bean
    public Queue poApprovedQueue() {
        return QueueBuilder.durable("notification.po.approved.queue")
            .withArgument("x-dead-letter-exchange", "procurex.dlq")
            .withArgument("x-dead-letter-routing-key", "dlq.po.approved")
            .build();
    }

    @Bean
    public Queue paymentCompletedQueue() {
        return QueueBuilder.durable("notification.payment.completed.queue")
            .withArgument("x-dead-letter-exchange", "procurex.dlq")
            .withArgument("x-dead-letter-routing-key", "dlq.payment.completed")
            .build();
    }

    @Bean
    public Queue vendorUserCreatedQueue() {
        return QueueBuilder.durable("notification.vendor.user.created.queue")
            .withArgument("x-dead-letter-exchange", "procurex.dlq")
            .withArgument("x-dead-letter-routing-key", "dlq.vendor.user.created")
            .build();
    }

    @Bean
    public Binding vendorApprovedBinding(Queue vendorApprovedQueue, TopicExchange procurexExchange) {
        return BindingBuilder.bind(vendorApprovedQueue).to(procurexExchange).with("vendor.registration.approved");
    }

    @Bean
    public Binding rfqCreatedBinding(Queue rfqCreatedQueue, TopicExchange procurexExchange) {
        return BindingBuilder.bind(rfqCreatedQueue).to(procurexExchange).with("procurement.rfq.created");
    }

    @Bean
    public Binding poApprovedBinding(Queue poApprovedQueue, TopicExchange procurexExchange) {
        return BindingBuilder.bind(poApprovedQueue).to(procurexExchange).with("procurement.po.approved");
    }

    @Bean
    public Binding paymentCompletedBinding(Queue paymentCompletedQueue, TopicExchange procurexExchange) {
        return BindingBuilder.bind(paymentCompletedQueue).to(procurexExchange).with("finance.payment.completed");
    }

    @Bean
    public Binding vendorUserCreatedBinding(Queue vendorUserCreatedQueue, TopicExchange procurexExchange) {
        return BindingBuilder.bind(vendorUserCreatedQueue).to(procurexExchange).with("identity.vendor.user.created");
    }
}
