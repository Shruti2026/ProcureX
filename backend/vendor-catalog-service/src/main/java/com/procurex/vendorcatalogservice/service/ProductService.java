package com.procurex.vendorcatalogservice.service;

import com.procurex.vendorcatalogservice.dto.request.CreateProductRequest;
import com.procurex.vendorcatalogservice.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

    ProductResponse createProduct(CreateProductRequest request);

    Page<ProductResponse> getAllProducts(Pageable pageable, UUID categoryId);

    ProductResponse getProductById(UUID productId);
}
