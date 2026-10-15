package com.procurex.notificationservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "procurex.exchange";

    @Bean
    public TopicExchange procurexExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue vendorApprovedQueue() {
        return QueueBuilder.durable("notification.vendor.approved.queue").build();
    }

    @Bean
    public Queue poApprovedQueue() {
        return QueueBuilder.durable("notification.po.approved.queue").build();
    }

    @Bean
    public Queue paymentCompletedQueue() {
        return QueueBuilder.durable("notification.payment.completed.queue").build();
    }

    @Bean
    public Binding vendorApprovedBinding() {
        return BindingBuilder.bind(vendorApprovedQueue())
                .to(procurexExchange())
                .with("identity.vendor.approved");
    }

    @Bean
    public Binding poApprovedBinding() {
        return BindingBuilder.bind(poApprovedQueue())
                .to(procurexExchange())
                .with("procurement.po.approved");
    }

    @Bean
    public Binding paymentCompletedBinding() {
        return BindingBuilder.bind(paymentCompletedQueue())
                .to(procurexExchange())
                .with("finance.payment.completed");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
