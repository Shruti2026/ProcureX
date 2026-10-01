package com.procurex.vendorcatalogservice.repository;

import com.procurex.vendorcatalogservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByCategoryNameIgnoreCase(String categoryName);

    List<Category> findAllByIsDeletedFalse();
}
