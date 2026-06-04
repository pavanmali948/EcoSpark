package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreateSubscriptionModelDTO(

        @NotBlank(message = "Subscription name is required")
        String subsName,

        @NotBlank(message = "Duration is required")
        String duration,

        @Positive(message = "Amount must be positive")
        float amount,

        @Positive(message = "Booking Amount must be positive")
        float bookingAmount,

        @NotBlank(message = "adminId is required")
        String adminId

) {}