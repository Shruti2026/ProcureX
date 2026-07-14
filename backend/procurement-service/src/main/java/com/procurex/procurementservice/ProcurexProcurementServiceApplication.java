package com.procurex.procurementservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ProcurexProcurementServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcurexProcurementServiceApplication.class, args);
    }
}
