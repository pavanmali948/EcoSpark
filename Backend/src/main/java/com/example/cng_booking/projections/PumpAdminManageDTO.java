package com.example.cng_booking.projections;

public record PumpAdminManageDTO(
        String licenseNo,
        String pumpName,
        String streetName,
        String landmark,
        int pincode,
        double latitude,
        double longitude,
        String subscriptionName,
        long remainingDays
) {}
