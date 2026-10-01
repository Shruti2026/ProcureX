package com.procurex.vendorcatalogservice.service;

import com.procurex.vendorcatalogservice.dto.request.CreateCategoryRequest;
import com.procurex.vendorcatalogservice.dto.response.CategoryResponse;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    CategoryResponse createCategory(CreateCategoryRequest request);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(UUID categoryId);
}
