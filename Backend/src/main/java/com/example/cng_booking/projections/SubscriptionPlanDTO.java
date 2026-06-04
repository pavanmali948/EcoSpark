package com.example.cng_booking.projections;

public record SubscriptionPlanDTO(
        Long id,
        String name,
        Double price,
        Integer durationDays) {
}
