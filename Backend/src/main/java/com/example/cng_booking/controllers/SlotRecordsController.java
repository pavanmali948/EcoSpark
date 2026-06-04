package com.example.cng_booking.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.projections.PumpPendingSlotDTO;
import com.example.cng_booking.projections.SlotRecordsHistoryDTO;
import com.example.cng_booking.request_dtos.RequestChangeSlotStatusDTO;
import com.example.cng_booking.request_dtos.RequestPendingSlotRecordsDTO;
import com.example.cng_booking.request_dtos.RequestSlotBookDTO;
import com.example.cng_booking.request_dtos.RequestSlotHistoryOfUserDTO;
import com.example.cng_booking.services.PumpContextService;
import com.example.cng_booking.services.SlotRecordsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/slot-records")
public class SlotRecordsController {

    @Autowired
    private SlotRecordsService slotRecordsService;

    @Autowired
    private PumpContextService pumpContextService;

    @PostMapping("/book-slot")
    public ResponseEntity<ApiResponse<String>> createSlot(@Valid @RequestBody RequestSlotBookDTO req) {

        String qrCode = slotRecordsService.createSlotRecord(req);
        ApiResponse<String> response = new ApiResponse<String>(
                true,
                "slot created successfully",
                qrCode,
                LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/get-pending-slots")
    public ResponseEntity<ApiResponse<List<PumpPendingSlotDTO>>> getPendingSlots(
            @ModelAttribute RequestPendingSlotRecordsDTO req) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<PumpPendingSlotDTO> pendingSlots;
        if (pumpContextService.isPumpStaff(auth)) {
            pendingSlots = slotRecordsService.getPendingAtPump(pumpContextService.resolvePumpLicenseForStaff());
        } else {
            if (req.userId() == null || req.userId().isBlank()) {
                throw new BadRequestException("userId is required");
            }
            pendingSlots = slotRecordsService.getPendingForUserBookings(req.userId());
        }

        ApiResponse<List<PumpPendingSlotDTO>> response = new ApiResponse<List<PumpPendingSlotDTO>>(
                true,
                "fetched pending slots successfully",
                pendingSlots,
                LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-completed-slots")
    public ResponseEntity<ApiResponse<List<PumpPendingSlotDTO>>> getCompletedSlots() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!pumpContextService.isPumpStaff(auth)) {
            String authorities = auth == null ? "null" : String.valueOf(auth.getAuthorities());
            throw new BadRequestException(
                    "Only pump staff can access completed queue. authorities=" + authorities);
        }
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        List<PumpPendingSlotDTO> completed = slotRecordsService.getCompletedAtPump(licenseNo);
        ApiResponse<List<PumpPendingSlotDTO>> response = new ApiResponse<>(
                true,
                "fetched completed slots successfully",
                completed,
                LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-slot-booking")
    public ResponseEntity<ApiResponse<String>> verifyBooking(@Valid @RequestBody RequestChangeSlotStatusDTO req) {

        slotRecordsService.changeSlotStatus(req);
        ApiResponse<String> response = new ApiResponse<String>(
                true,
                "slot verified",
                null,
                LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-user-slot-history")
    public ResponseEntity<ApiResponse<Page<SlotRecordsHistoryDTO>>> getUserSlotHistory(
            @ModelAttribute @Valid RequestSlotHistoryOfUserDTO req) {

        Page<SlotRecordsHistoryDTO> page = slotRecordsService.getSlotHistoryOfUser(req);
        ApiResponse<Page<SlotRecordsHistoryDTO>> response = new ApiResponse<Page<SlotRecordsHistoryDTO>>(
                true,
                "fetched user's slot history",
                page,
                LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
