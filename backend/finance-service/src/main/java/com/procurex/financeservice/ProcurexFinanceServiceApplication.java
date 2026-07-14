package com.procurex.financeservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ProcurexFinanceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcurexFinanceServiceApplication.class, args);
    }
}
