package com.procurex.vendorcatalogservice.repository;

import com.procurex.vendorcatalogservice.entity.Category;
import com.procurex.vendorcatalogservice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findAllByIsDeletedFalse();

    Page<Product> findAllByIsDeletedFalse(Pageable pageable);

    List<Product> findByCategoryAndIsDeletedFalse(Category category);

    Page<Product> findByCategoryAndIsDeletedFalse(Category category, Pageable pageable);
}
