package com.example.cng_booking.models;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;

@Entity(name = "super_admin")
public class SuperAdmin {

    @Id
    private String adminId;

    @PrePersist
    public void generateId() {
        if (this.adminId == null) {
            this.adminId = UUID.randomUUID().toString();
        }
    }

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "admin")
    private List<SubscriptionModel> subsModel;

    private final Instant createdAt = Instant.now();

    public Instant getCreatedAt() {
        return createdAt;
    }

    public SuperAdmin() {
    }

    public SuperAdmin(String name, String email, String password, List<SubscriptionModel> subsModel) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.subsModel = subsModel;
    }

    public List<SubscriptionModel> getSubsModel() {
        return subsModel;
    }

    public void setSubsModel(List<SubscriptionModel> subsModel) {
        this.subsModel = subsModel;
    }

    public String getAdminId() {
        return adminId;
    }

    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
