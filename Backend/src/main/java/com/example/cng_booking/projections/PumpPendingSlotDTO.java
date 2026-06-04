package com.example.cng_booking.projections;

public record PumpPendingSlotDTO(
        String slotRecordId,
        String qrCode,
        String vehicleNumber,
        String customerUsername,
        String slotStart,
        String slotEnd,
        String address,
        String pumpName,
        String bookedAt) {
}
