package com.example.cng_booking.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;

@Entity(name = "pump_workers")
public class PumpWorkers {

    @Id
    private String workerId;

    @PrePersist
    public void generateId() {
        if (this.workerId == null) {
            this.workerId = UUID.randomUUID().toString();
        }
    }

    @ManyToOne
    @JoinColumn(name = "license_no", nullable = false)
    private Pumps pump;

    @Column(nullable = false)
    private String workerName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private final Instant createdAt = Instant.now();

    public Instant getCreatedAt() {
        return createdAt;
    }

    public PumpWorkers() {
    }

    public PumpWorkers(Pumps pump, String workerName, String email, String password) {
        this.pump = pump;
        this.workerName = workerName;
        this.email = email;
        this.password = password;
    }

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
    }

    public Pumps getPump() {
        return pump;
    }

    public void setPump(Pumps pump) {
        this.pump = pump;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
