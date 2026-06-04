package com.example.cng_booking.projections;

public record OrderResponseDTO(
        String orderId,
        Long amount,
        String key) {
}
