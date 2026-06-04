package com.example.cng_booking.repositories;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.Subscription;
import com.example.cng_booking.models.SubscriptionStatus;

public interface SubscriptionRepo extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findTopByPumpAdminIdOrderByEndDateDesc(String pumpAdminId);
    boolean existsByPumpAdminIdAndStatusAndEndDateAfter(String pumpAdminId, SubscriptionStatus status, LocalDateTime now);
}
