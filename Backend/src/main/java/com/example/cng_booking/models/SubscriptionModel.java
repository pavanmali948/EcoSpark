package com.example.cng_booking.models;

import java.time.Instant;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity(name = "subscription_model")
public class SubscriptionModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long subsId;

    @Column(nullable = false)
    private String subsName;

    @Column(nullable = false)
    private String duration;

    @Column(nullable = false)
    private float amount;

    @Column(nullable = false)
    private float bookingAmount;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private SuperAdmin admin;

    @OneToMany(mappedBy = "subscriptionModel")
    @Column(name = "pump_id", nullable = false)
    private List<Pumps> pumps;

    private final Instant createdAt = Instant.now();

    public Instant getCreatedAt() {
        return createdAt;
    }

    public SubscriptionModel() {
    }

    public SubscriptionModel(String subsName, String duration, float amount, float bookingAmount, SuperAdmin admin,
            List<Pumps> pumps) {
        this.subsName = subsName;
        this.duration = duration;
        this.amount = amount;
        this.bookingAmount = bookingAmount;
        this.admin = admin;
        this.pumps = pumps;
    }

    public SuperAdmin getAdmin() {
        return admin;
    }

    public void setAdmin(SuperAdmin admin) {
        this.admin = admin;
    }

    public long getSubsId() {
        return subsId;
    }

    public void setSubsId(long subsId) {
        this.subsId = subsId;
    }

    public String getSubsName() {
        return subsName;
    }

    public void setSubsName(String subsName) {
        this.subsName = subsName;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public float getAmount() {
        return amount;
    }

    public void setAmount(float amount) {
        this.amount = amount;
    }

    public float getBookingAmount() {
        return bookingAmount;
    }

    public void setBookingAmount(float bookingAmount) {
        this.bookingAmount = bookingAmount;
    }

    public List<Pumps> getPumps() {
        return pumps;
    }

    public void setPumps(List<Pumps> pumps) {
        this.pumps = pumps;
    }
}
