package com.procurex.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ProcurexApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcurexApiGatewayApplication.class, args);
    }
}
