package com.example.cng_booking.projections;

import java.time.LocalDate;

public record SuperAdminPumpSubscriptionDTO(
        String licenseNo,
        String pumpName,
        String subscriptionName,
        LocalDate subscriptionStartDate,
        long remainingDays
) {}
