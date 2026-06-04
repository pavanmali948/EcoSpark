package com.example.cng_booking.projections;

public record SystemReportDTO(
        String fromDate,
        String toDate,
        long totalBookings,
        long completedBookings,
        long missedBookings,
        long pendingBookings
) {}
