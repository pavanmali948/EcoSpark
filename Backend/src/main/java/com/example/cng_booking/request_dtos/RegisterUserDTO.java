package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterUserDTO(

    @NotBlank(message = "username is required")
    String username,

    @NotBlank(message = "email is required")
    @Email(message = "invalid email format")
    String email,

    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[A-Z]).{6,20}$",
            message = "Password must contain at least 1 digit, 1 uppercase letter, and 6+ chars"
    )
    String password
) {
    
}
