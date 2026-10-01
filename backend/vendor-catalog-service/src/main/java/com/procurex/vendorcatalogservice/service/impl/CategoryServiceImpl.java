package com.procurex.vendorcatalogservice.service.impl;

import com.procurex.vendorcatalogservice.dto.request.CreateCategoryRequest;
import com.procurex.vendorcatalogservice.dto.response.CategoryResponse;
import com.procurex.vendorcatalogservice.entity.Category;
import com.procurex.vendorcatalogservice.exception.ConflictException;
import com.procurex.vendorcatalogservice.exception.ResourceNotFoundException;
import com.procurex.vendorcatalogservice.repository.CategoryRepository;
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

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(
                c.getCategoryId(),
                c.getCategoryName(),
                c.getDescription(),
                c.getCreatedAt()
        );
    }
}
