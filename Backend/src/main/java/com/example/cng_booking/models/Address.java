package com.example.cng_booking.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;

@Entity(name = "address")
public class Address {

    @Id
    private String addressId;

    @PrePersist
    public void generateId() {
        if (this.addressId == null) {
            this.addressId = UUID.randomUUID().toString();
        }
    }

    @OneToOne(mappedBy = "address", cascade = CascadeType.ALL)
    private Pumps pump;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private String streetName;

    @Column(nullable = false)
    private String landmark;

    @Column(nullable = false)
    private int pincode;

    private final Instant createdAt = Instant.now();

    public Address() {
    }

    public Address(Pumps pump, double longitude, double latitude, String streetName, String landmark,
            int pincode) {
        this.pump = pump;
        this.longitude = longitude;
        this.latitude = latitude;
        this.streetName = streetName;
        this.landmark = landmark;
        this.pincode = pincode;
    }

    public String getAddressId() {
        return addressId;
    }

    public void setAddressId(String addressId) {
        this.addressId = addressId;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public String getStreetName() {
        return streetName;
    }

    public void setStreetName(String streetName) {
        this.streetName = streetName;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public int getPincode() {
        return pincode;
    }

    public void setPincode(int pincode) {
        this.pincode = pincode;
    }

    public Pumps getPump() {
        return pump;
    }

    public void setPump(Pumps pump) {
        this.pump = pump;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
