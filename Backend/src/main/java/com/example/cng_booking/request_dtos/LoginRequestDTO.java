package com.example.cng_booking.request_dtos;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequestDTO(

        @NotNull(message = "Role is required")
        String role,

        @NotBlank(message = "identifier is required")
        String identifier,

        @NotBlank(message = "password is required")
        String password
) {

}
