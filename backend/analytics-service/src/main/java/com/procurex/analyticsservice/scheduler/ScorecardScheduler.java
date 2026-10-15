package com.procurex.analyticsservice.scheduler;

import com.procurex.analyticsservice.entity.VendorRatingCard;
import com.procurex.analyticsservice.repository.VendorRatingCardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScorecardScheduler {

    private final VendorRatingCardRepository vendorRatingCardRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void recalculateVendorScores() {
        log.info("Starting hourly vendor score recalculation");
        List<VendorRatingCard> cards = vendorRatingCardRepository.findAll();
        for (VendorRatingCard card : cards) {
            BigDecimal onTimeRatio = safeDiv(card.getOnTimeDeliveries(), card.getTotalDeliveries());
            BigDecimal qualityRatio = safeDiv(card.getTotalAcceptedItems(), card.getTotalInspectedItems());
            BigDecimal performanceScore = onTimeRatio.multiply(new BigDecimal("0.6"))
                .add(qualityRatio.multiply(new BigDecimal("0.4")))
                .multiply(new BigDecimal("5.0"))
                .setScale(1, RoundingMode.HALF_UP);
            card.setOnTimeRatio(onTimeRatio);
            card.setQualityRatio(qualityRatio);
            card.setPerformanceScore(performanceScore);
            card.setCalculatedAt(LocalDateTime.now());
            vendorRatingCardRepository.save(card);
        }
        log.info("Vendor score recalculation complete for {} vendors", cards.size());
    }

    private BigDecimal safeDiv(int numerator, int denominator) {
        if (denominator == 0) return BigDecimal.ZERO;
        return new BigDecimal(numerator).divide(new BigDecimal(denominator), 2, RoundingMode.HALF_UP);
    }
}
