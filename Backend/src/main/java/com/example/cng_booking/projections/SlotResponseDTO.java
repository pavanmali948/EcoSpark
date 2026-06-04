package com.example.cng_booking.projections;

public class SlotResponseDTO {
    private long id;
    private String startISO;
    private String endISO;
    private int maxCapacity;
    private long bookedCount;
    private String status;

    public SlotResponseDTO(long id, String startISO, String endISO, int maxCapacity, long bookedCount, String status) {
        this.id = id;
        this.startISO = startISO;
        this.endISO = endISO;
        this.maxCapacity = maxCapacity;
        this.bookedCount = bookedCount;
        this.status = status;
    }

    public long getId() { return id; }
    public String getStartISO() { return startISO; }
    public String getEndISO() { return endISO; }
    public int getMaxCapacity() { return maxCapacity; }
    public long getBookedCount() { return bookedCount; }
    public String getStatus() { return status; }
}
