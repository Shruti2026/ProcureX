package com.procurex.procurementservice.repository;

import com.procurex.procurementservice.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    List<OutboxEvent> findTop20ByStatusOrderByCreatedAtAsc(OutboxEvent.Status status);
}
