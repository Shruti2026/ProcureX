package com.procurex.identityservice.repository;

import com.procurex.identityservice.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    List<OutboxEvent> findTop20ByStatusOrderByCreatedAtAsc(OutboxEvent.Status status);
}
