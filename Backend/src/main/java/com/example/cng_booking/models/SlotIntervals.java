package com.example.cng_booking.models;

import java.sql.Time;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity(name = "slot_intervals")
public class SlotIntervals {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long intervalId;

    @Column(nullable = false)
    private Time start;

    @Column(nullable = false)
    private Time end;

    @ManyToOne
    @JoinColumn(name = "pump_license_no", nullable = false)
    @JsonIgnore
    private Pumps pump;

    public SlotIntervals() {}

    public SlotIntervals(Time start, Time end, Pumps pump) {
        this.start = start;
        this.end = end;
        this.pump = pump;
    }

    public Time getStart() {
        return start;
    }

    public void setStart(Time start) {
        this.start = start;
    }

    public Time getEnd() {
        return end;
    }

    public void setEnd(Time end) {
        this.end = end;
    }

    public long getIntervalId() {
        return intervalId;
    }

    public void setIntervalId(long intervalId) {
        this.intervalId = intervalId;
    }

    public Pumps getPump() {
        return pump;
    }

    public void setPump(Pumps pump) {
        this.pump = pump;
    }
}
