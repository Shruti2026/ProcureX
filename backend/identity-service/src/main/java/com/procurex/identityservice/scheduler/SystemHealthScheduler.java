package com.procurex.identityservice.scheduler;

import com.procurex.identityservice.repository.SystemHealthSnapshotRepository;
import com.procurex.identityservice.service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class SystemHealthScheduler {

    private final SystemHealthService systemHealthService;
    private final SystemHealthSnapshotRepository snapshotRepository;

    /**
     * Poll and record health snapshot every 60 seconds (with initial delay of 15 seconds).
     */
    @Scheduled(initialDelay = 15000, fixedRate = 60000)
    public void recordPeriodicHealth() {
        try {
            systemHealthService.recordHealthSnapshot();
        } catch (Exception ex) {
            log.error("Scheduled health check failed: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Retention cleaner: runs once a day at 2:00 AM to purge health data older than 14 days.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldSnapshots() {
        try {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(14);
            int deleted = snapshotRepository.deleteOlderThan(cutoff);
            log.info("Cleaned up {} health snapshots older than 14 days", deleted);
        } catch (Exception ex) {
            log.error("Failed to clean up old health snapshots: {}", ex.getMessage());
        }
    }
}
