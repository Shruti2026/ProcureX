package com.procurex.identityservice.repository;

import com.procurex.identityservice.entity.ServiceHealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ServiceHealthRecordRepository extends JpaRepository<ServiceHealthRecord, Long> {

    List<ServiceHealthRecord> findByServiceKeyAndRecordedAtAfterOrderByRecordedAtAsc(
            String serviceKey, LocalDateTime after);

    @Query("SELECT r FROM ServiceHealthRecord r WHERE r.recordedAt >= :after ORDER BY r.recordedAt ASC")
    List<ServiceHealthRecord> findAllAfter(@Param("after") LocalDateTime after);
}
