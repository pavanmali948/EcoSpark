package com.example.cng_booking.repositories;

import java.sql.Time;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SlotIntervals;

public interface SlotIntervalsRepo extends JpaRepository<SlotIntervals, Long> {
    SlotIntervals findByIntervalId(long intervalId);
    boolean existsByIntervalId(long intervalId);
    List<SlotIntervals> findByPump(Pumps pump);
    boolean existsByPumpAndStartAndEnd(Pumps pump, Time start, Time end);
}
