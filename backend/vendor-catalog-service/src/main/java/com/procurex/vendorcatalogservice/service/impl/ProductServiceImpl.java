package com.procurex.vendorcatalogservice.service.impl;

import com.procurex.vendorcatalogservice.dto.request.CreateProductRequest;
import com.procurex.vendorcatalogservice.dto.response.ProductResponse;
import com.procurex.vendorcatalogservice.entity.Category;
import com.procurex.vendorcatalogservice.entity.Product;
import com.procurex.vendorcatalogservice.exception.ResourceNotFoundException;
import com.procurex.vendorcatalogservice.repository.CategoryRepository;
import com.procurex.vendorcatalogservice.repository.ProductRepository;
import com.procurex.vendorcatalogservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public ProductResponse createProduct(CreateProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category not found with id: " + request.categoryId()));

        Product product = Product.builder()
                .category(category)
                .productName(request.productName())
                .description(request.description())
                .unitOfMeasure(request.unitOfMeasure())
                .minimumStock(request.minimumStock())
                .build();

        Product saved = productRepository.save(product);
        log.info("Created product '{}' with id {}", saved.getProductName(), saved.getProductId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable, UUID categoryId) {
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Category not found with id: " + categoryId));
            return productRepository.findByCategoryAndIsDeletedFalse(category, pageable)
                    .map(this::toResponse);
        }
        return productRepository.findAllByIsDeletedFalse(pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID productId) {
        Product product = productRepository.findById(productId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found with id: " + productId));
        return toResponse(product);
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getProductId(),
                p.getCategory().getCategoryId(),
                p.getCategory().getCategoryName(),
                p.getProductName(),
                p.getDescription(),
                p.getUnitOfMeasure(),
                p.getMinimumStock(),
                p.getCreatedAt()
        );
    }
}
