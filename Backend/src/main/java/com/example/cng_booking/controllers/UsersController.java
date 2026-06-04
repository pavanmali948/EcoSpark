package com.example.cng_booking.controllers;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.request_dtos.RequestSlotBookDTO;
import com.example.cng_booking.services.SlotRecordsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
@Validated
public class UsersController {

    @Autowired
    private SlotRecordsService slotRecordsService;

    @PostMapping("/book-slot")
    public ResponseEntity<ApiResponse<String>> bookSlot(@Valid @RequestBody RequestSlotBookDTO req) {
        String qrCode = slotRecordsService.createSlotRecord(req);
        ApiResponse<String> response = new ApiResponse<String>(
            true, 
            "Slot Booked Successfully", 
            qrCode, 
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
