package com.example.cng_booking.models;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.sql.Time;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;

@Entity(name = "pumps")
public class Pumps {

    @Id
    private String licenseNo;

    @Column(nullable = false)
    private String pumpName;

    @Column(nullable = false)
    private String password;

    // Kept only to satisfy existing DB schema (`open_by_admin` is NOT NULL).
    // The manual pump open/closed workflow was removed from the application logic.
    @Column(name = "open_by_admin", nullable = false)
    private Boolean openByAdmin = true;

    private Time openingTime;
    private Time closingTime;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @ManyToOne
    @JoinColumn(name = "subs_id")
    private SubscriptionModel subscriptionModel;

    private LocalDate subscriptionStartDate;

    @OneToMany(mappedBy = "pump", cascade = CascadeType.ALL)
    private List<SlotRecords> slots;

    @OneToMany(mappedBy = "pump")
    private List<PumpWorkers> workers;

    private final Instant createdAt = Instant.now();

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Pumps() {
    }

    public Pumps(String licenseNo, String pumpName, String password, Address address,
            SubscriptionModel subscriptionModel,
            List<SlotRecords> slots, List<PumpWorkers> workers) {
        this.licenseNo = licenseNo;
        this.pumpName = pumpName;
        this.password = password;
        this.address = address;
        this.subscriptionModel = subscriptionModel;
        this.slots = slots;
        this.workers = workers;
        this.openByAdmin = true;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getLicenseNo() {
        return licenseNo;
    }

    public void setLicenseNo(String licenseNo) {
        this.licenseNo = licenseNo;
    }

    public String getPumpName() {
        return pumpName;
    }

    public void setPumpName(String pumpName) {
        this.pumpName = pumpName;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
        this.address.setPump(this);
    }

    public SubscriptionModel getSubscriptionModel() {
        return subscriptionModel;
    }

    public void setSubscriptionModel(SubscriptionModel subscriptionModel) {
        this.subscriptionModel = subscriptionModel;
    }

    public LocalDate getSubscriptionStartDate() {
        return subscriptionStartDate;
    }

    public void setSubscriptionStartDate(LocalDate subscriptionStartDate) {
        this.subscriptionStartDate = subscriptionStartDate;
    }

    public List<SlotRecords> getSlots() {
        return slots;
    }

    public void setSlots(List<SlotRecords> slots) {
        this.slots = slots;
    }

    public List<PumpWorkers> getWorkers() {
        return workers;
    }

    public void setWorkers(List<PumpWorkers> workers) {
        this.workers = workers;
    }

    public Time getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(Time openingTime) {
        this.openingTime = openingTime;
    }

    public Time getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(Time closingTime) {
        this.closingTime = closingTime;
    }
}
