package com.example.cng_booking.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.SlotIntervals;
import com.example.cng_booking.repositories.SlotIntervalsRepo;

@Service
public class SlotIntervalsService {

    @Autowired
    private SlotIntervalsRepo slotIntervalsRepo;
    
    public SlotIntervals getSlotIntervalObj(Long intervalId) {

        if (intervalId == null || intervalId <= 0) {
            throw new BadRequestException("intervalId is null or invalid");
        } else if (!slotIntervalsRepo.existsByIntervalId(intervalId)) {
            throw new BadRequestException("intervalId does not exists");
        }

        SlotIntervals slot = slotIntervalsRepo.findByIntervalId(intervalId);

        return slot;
    }
}
