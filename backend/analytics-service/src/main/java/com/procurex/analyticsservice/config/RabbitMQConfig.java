package com.procurex.analyticsservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "procurex.exchange";
    public static final String PO_APPROVED_QUEUE = "analytics.po.approved.queue";
    public static final String GRN_CREATED_QUEUE = "analytics.grn.created.queue";
    public static final String INSPECTION_COMPLETED_QUEUE = "analytics.inspection.completed.queue";
    public static final String PAYMENT_COMPLETED_QUEUE = "analytics.payment.completed.queue";
    public static final String RFQ_CREATED_QUEUE = "analytics.rfq.created.queue";

    @Bean
    public TopicExchange procurexExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean public Queue poApprovedQueue() { return new Queue(PO_APPROVED_QUEUE, true); }
    @Bean public Queue grnCreatedQueue() { return new Queue(GRN_CREATED_QUEUE, true); }
    @Bean public Queue inspectionCompletedQueue() { return new Queue(INSPECTION_COMPLETED_QUEUE, true); }
    @Bean public Queue paymentCompletedQueue() { return new Queue(PAYMENT_COMPLETED_QUEUE, true); }
    @Bean public Queue rfqCreatedQueue() { return new Queue(RFQ_CREATED_QUEUE, true); }

    @Bean public Binding poApprovedBinding() { return BindingBuilder.bind(poApprovedQueue()).to(procurexExchange()).with("procurement.po.approved"); }
    @Bean public Binding grnCreatedBinding() { return BindingBuilder.bind(grnCreatedQueue()).to(procurexExchange()).with("inventory.grn.created"); }
    @Bean public Binding inspectionCompletedBinding() { return BindingBuilder.bind(inspectionCompletedQueue()).to(procurexExchange()).with("inventory.inspection.completed"); }
    @Bean public Binding paymentCompletedBinding() { return BindingBuilder.bind(paymentCompletedQueue()).to(procurexExchange()).with("finance.payment.completed"); }
    @Bean public Binding rfqCreatedBinding() { return BindingBuilder.bind(rfqCreatedQueue()).to(procurexExchange()).with("procurement.rfq.created"); }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jackson2JsonMessageConverter());
        return template;
    }
}
