package com.procurex.financeservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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
    public Queue financePoApprovedQueue() {
        return QueueBuilder.durable("finance.po.approved.queue").build();
    }

    @Bean
    public Binding financePoApprovedBinding() {
        return BindingBuilder.bind(financePoApprovedQueue())
                .to(procurexExchange())
                .with("procurement.po.approved");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
