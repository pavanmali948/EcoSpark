package com.example.cng_booking.projections;

public record SubscriptionModelDTO(
        long subsId,
        String subsName,
        String duration,
        float amount,
        float bookingAmount
) {}
