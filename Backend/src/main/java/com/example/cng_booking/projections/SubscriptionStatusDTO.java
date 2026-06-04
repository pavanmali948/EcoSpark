package com.example.cng_booking.projections;

import java.time.LocalDateTime;

import com.example.cng_booking.models.SubscriptionStatus;

public record SubscriptionStatusDTO(
        Long id,
        String planName,
        LocalDateTime startDate,
        LocalDateTime endDate,
        SubscriptionStatus status) {
}
