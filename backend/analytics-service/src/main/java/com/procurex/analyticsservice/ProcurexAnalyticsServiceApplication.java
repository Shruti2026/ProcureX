package com.procurex.analyticsservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableDiscoveryClient
@EnableScheduling
public class ProcurexAnalyticsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProcurexAnalyticsServiceApplication.class, args);
    }
}
