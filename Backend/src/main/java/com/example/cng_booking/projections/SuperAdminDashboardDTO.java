package com.example.cng_booking.projections;

import java.util.List;

public record SuperAdminDashboardDTO(
        long activePumpAdmins,
        long users,
        long workers,
        long totalBookings,
        long completedBookings,
        long missedBookings,
        long pendingBookings,
        List<WorkerCountByPumpDTO> workersByPump
) {}
