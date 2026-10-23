package com.procurex.identityservice.repository;

import com.procurex.identityservice.entity.SystemHealthSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemHealthSnapshotRepository extends JpaRepository<SystemHealthSnapshot, Long> {

    List<SystemHealthSnapshot> findByRecordedAtAfterOrderByRecordedAtAsc(LocalDateTime after);

    @Modifying
    @Query("DELETE FROM SystemHealthSnapshot s WHERE s.recordedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
