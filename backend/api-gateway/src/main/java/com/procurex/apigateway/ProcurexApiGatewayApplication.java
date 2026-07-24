package com.procurex.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@SpringBootApplication
@EnableDiscoveryClient
public class ProcurexApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProcurexApiGatewayApplication.class, args);
    }

    @RestController
    public class DiscoveryDebugController {

        private final DiscoveryClient discoveryClient;

        public DiscoveryDebugController(DiscoveryClient discoveryClient) {
            this.discoveryClient = discoveryClient;
        }

        @GetMapping("/debug/services")
        public List<String> services() {
            return discoveryClient.getServices();
        }

        @GetMapping("/debug/instances")
        public List<ServiceInstance> instances() {
            return discoveryClient.getInstances("procurex-identity-service");
        }
    }
}
