package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateSubscriptionPlanDTO(
        @NotBlank String name,
        @NotNull @Positive Double price,
        @NotNull @Positive Integer durationDays) {
}
