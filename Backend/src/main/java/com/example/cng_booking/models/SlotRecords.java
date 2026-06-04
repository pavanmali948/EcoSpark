package com.example.cng_booking.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;

@Entity(name = "slot_records")
public class SlotRecords {

    @Id
    private String slotId;

    @PrePersist
    public void generateId() {
        if (this.slotId == null) {
            this.slotId = UUID.randomUUID().toString();
        }
    }

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SlotStatus status;

    @ManyToOne
    @JoinColumn(name = "interval_id", nullable = false)
    private SlotIntervals slot;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "license_no", nullable = false)
    private Pumps pump;

    @Column(nullable = false)
    private String vehicleNumber;

    @Column(nullable = false)
    private String transactionId;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String qrCode;

    private String handledByWorkerId;
    private Instant handledAt;

    private final Instant createdAt = Instant.now();

    public Instant getCreatedAt() {
        return createdAt;
    }

    public SlotRecords() {
    }

    public SlotRecords(SlotStatus status, SlotIntervals slot, Users user, String vehicleNumber, Pumps pump, String transactionId,
            String qrCode) {
        this.status = status;
        this.slot = slot;
        this.user = user;
        this.vehicleNumber = vehicleNumber;
        this.pump = pump;
        this.transactionId = transactionId;
        this.qrCode = qrCode;
    }

    public String getSlotId() {
        return slotId;
    }

    public void setSlotId(String slotId) {
        this.slotId = slotId;
    }

    public SlotStatus getStatus() {
        return status;
    }

    public void setStatus(SlotStatus status) {
        this.status = status;
    }

    public SlotIntervals getSlot() {
        return slot;
    }

    public void setSlot(SlotIntervals slot) {
        this.slot = slot;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Pumps getPump() {
        return pump;
    }

    public void setPump(Pumps pump) {
        this.pump = pump;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public String getHandledByWorkerId() {
        return handledByWorkerId;
    }

    public void setHandledByWorkerId(String handledByWorkerId) {
        this.handledByWorkerId = handledByWorkerId;
    }

    public Instant getHandledAt() {
        return handledAt;
    }

    public void setHandledAt(Instant handledAt) {
        this.handledAt = handledAt;
    }
}
