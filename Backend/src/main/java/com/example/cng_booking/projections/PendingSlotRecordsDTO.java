package com.example.cng_booking.projections;

import com.example.cng_booking.models.Address;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SlotIntervals;
import com.example.cng_booking.models.SlotStatus;

import jakarta.validation.constraints.NotBlank;

public class PendingSlotRecordsDTO {

    @NotBlank(message = "slotId is required")
    String slotId;

    @NotBlank(message = "qrCode is required")
    String qrCode;

    SlotStatus status = SlotStatus.PENDING;

    SlotIntervals slotInterval;

    @NotBlank(message = "address is required")
    String address;

    public String getSlotId() {
        return slotId;
    }

    public void setSlotId(String slotId) {
        this.slotId = slotId;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public SlotStatus getStatus() {
        return status;
    }

    public void setStatus(SlotStatus status) {
        this.status = status;
    }

    public SlotIntervals getSlotInterval() {
        return slotInterval;
    }

    public void setSlotInterval(SlotIntervals slotInterval) {
        this.slotInterval = slotInterval;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public PendingSlotRecordsDTO(String slotId, String qrCode, SlotIntervals slot, Pumps pump) {
        this.slotId = slotId;
        this.qrCode = qrCode;
        this.slotInterval = slot;
        Address address = pump.getAddress();
        this.address = address.getStreetName() + " " + address.getLandmark() + " - " + address.getPincode();
    }

}
