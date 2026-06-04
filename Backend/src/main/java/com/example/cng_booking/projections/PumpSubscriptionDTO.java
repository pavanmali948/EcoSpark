package com.example.cng_booking.projections;

import java.time.LocalDate;

public record PumpSubscriptionDTO(
        String subscriptionName,
        float amount,
        String duration,
        LocalDate startDate,
        long remainingDays
) {}
