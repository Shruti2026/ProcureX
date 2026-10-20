package com.procurex.identityservice.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Application-level bean configuration.
 */
@Configuration
public class AppConfig {

    /**
     * {@link RestTemplate} with a 3-second connect and read timeout,
     * used primarily by {@link com.procurex.identityservice.service.SystemHealthService}
     * for server-to-server actuator health checks.
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(3))
                .build();
    }
}
