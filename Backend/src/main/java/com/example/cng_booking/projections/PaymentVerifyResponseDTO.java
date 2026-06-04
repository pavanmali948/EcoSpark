package com.example.cng_booking.projections;

public record PaymentVerifyResponseDTO(
        String bookingId,
        String qrCodeBase64,
        String paymentStatus) {
}
