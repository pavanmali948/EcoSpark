package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdatePumpWorkerDTO(

    @NotBlank(message = "workerId is required")
    String workerId,

    @NotBlank(message = "workerName is required")
    String workerName,

    @NotBlank(message = "email is required")
    @Email(message = "invalid email format")
    String email,

    // Optional: if provided (non-blank) the worker password will be updated.
    String password
) {

}
