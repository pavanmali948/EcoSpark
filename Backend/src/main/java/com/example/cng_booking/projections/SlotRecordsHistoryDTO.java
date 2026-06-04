package com.example.cng_booking.projections;

import com.example.cng_booking.models.Address;
import com.example.cng_booking.models.SlotIntervals;
import com.example.cng_booking.models.SlotStatus;

import jakarta.validation.constraints.NotBlank;

public class SlotRecordsHistoryDTO {

    @NotBlank(message = "qrCode is required")
    String slotId;

    @NotBlank(message = "qrCode is required")
    String qrCode;

    @NotBlank(message = "status is required")
    SlotStatus status;

    @NotBlank(message = "slot interval is mandatory")
    SlotIntervals slotInterval;

    @NotBlank(message = "address is required")
    String address;

    String vehicleNumber;

    String pumpName;

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

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getPumpName() {
        return pumpName;
    }

    public void setPumpName(String pumpName) {
        this.pumpName = pumpName;
    }

    public SlotRecordsHistoryDTO(
            String slotId,
            String qrCode,
            SlotStatus status,
            SlotIntervals slotInterval,
            Address address,
            String vehicleNumber,
            String pumpName) {
        this.slotId = slotId;
        this.qrCode = qrCode;
        this.status = status;
        this.slotInterval = slotInterval;
        this.address = address != null
                ? address.getStreetName() + " " + address.getLandmark() + " - " + address.getPincode()
                : "";
        this.vehicleNumber = vehicleNumber;
        this.pumpName = pumpName != null ? pumpName : "";
    }
}
