package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.Positive;

public record AssignPumpSubscriptionDTO(
        @Positive(message = "subsId must be positive")
        long subsId
) {}
