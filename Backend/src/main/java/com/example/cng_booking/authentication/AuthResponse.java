package com.example.cng_booking.authentication;

public record AuthResponse(
        String token,
        String licenseNo,
        String pumpName,
        String workerProfileName) {

    public static AuthResponse tokenOnly(String token) {
        return new AuthResponse(token, null, null, null);
    }
}
