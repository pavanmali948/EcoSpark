package com.example.cng_booking.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.SubscriptionPlan;

public interface SubscriptionPlanRepo extends JpaRepository<SubscriptionPlan, Long> {
    boolean existsByNameIgnoreCase(String name);
}
