package com.procurex.vendorcatalogservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ProcurexVendorCatalogServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcurexVendorCatalogServiceApplication.class, args);
    }
}
