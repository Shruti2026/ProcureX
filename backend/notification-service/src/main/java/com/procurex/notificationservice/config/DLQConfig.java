package com.procurex.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DLQConfig {

    @Bean
    public DirectExchange dlqExchange() {
        return new DirectExchange("procurex.dlq", true, false);
    }

    @Bean
    public Queue deadLetterQueue() {
        return new Queue("procurex.dead.letter.queue", true);
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(deadLetterQueue()).to(dlqExchange()).with("dlq.#");
    }
}
