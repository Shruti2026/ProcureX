package com.procurex.vendorcatalogservice.service.impl;

import com.procurex.vendorcatalogservice.dto.request.CreateCategoryRequest;
import com.procurex.vendorcatalogservice.dto.request.UpdateCategoryRequest;
import com.procurex.vendorcatalogservice.dto.response.CategoryResponse;
import com.procurex.vendorcatalogservice.entity.Category;
import com.procurex.vendorcatalogservice.exception.ConflictException;
import com.procurex.vendorcatalogservice.exception.ResourceNotFoundException;
import com.procurex.vendorcatalogservice.repository.CategoryRepository;
import com.procurex.vendorcatalogservice.repository.ProductRepository;
import com.procurex.vendorcatalogservice.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        categoryRepository.findByCategoryNameIgnoreCase(request.categoryName())
                .ifPresent(c -> {
                    throw new ConflictException(
                            "Category with name '" + request.categoryName() + "' already exists.");
                });

        Category category = Category.builder()
                .categoryName(request.categoryName())
                .description(request.description())
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category '{}' with id {}", saved.getCategoryName(), saved.getCategoryId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByIsDeletedFalse()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category not found with id: " + categoryId));
        return toResponse(category);
    }

    @Override
    public CategoryResponse update(UUID categoryId, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category not found with id: " + categoryId));

        // Check name uniqueness (exclude self)
        categoryRepository.findByCategoryNameIgnoreCase(request.categoryName())
                .ifPresent(existing -> {
                    if (!existing.getCategoryId().equals(categoryId)) {
                        throw new ConflictException(
                                "Category with name '" + request.categoryName() + "' already exists.");
                    }
                });

        category.setCategoryName(request.categoryName());
        category.setDescription(request.description());

        Category saved = categoryRepository.save(category);
        log.info("Updated category '{}' with id {}", saved.getCategoryName(), saved.getCategoryId());
        return toResponse(saved);
    }

    @Override
    public void softDelete(UUID categoryId, UUID orgId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Category not found with id: " + categoryId));

        List<?> activeProducts = productRepository.findByCategoryAndIsDeletedFalse(category);
        if (!activeProducts.isEmpty()) {
            throw new IllegalStateException("Cannot delete category with active products");
        }

        category.setDeleted(true);
        categoryRepository.save(category);
        log.info("Soft-deleted category id={}", categoryId);
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(
                c.getCategoryId(),
                c.getCategoryName(),
                c.getDescription(),
                c.getCreatedAt()
        );
    }
}
