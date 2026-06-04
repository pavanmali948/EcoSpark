package com.example.cng_booking.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.SubscriptionModel;

public interface SubscriptionModelRepo extends JpaRepository<SubscriptionModel, Long> {
    SubscriptionModel findBySubsId(long subsId);
    boolean existsBySubsId(long subsId);
}
