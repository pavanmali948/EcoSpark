package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;

public record RequestSlotHistoryOfUserDTO(

    @NotBlank(message = "userId is required")
    String userId
) {
    
}
