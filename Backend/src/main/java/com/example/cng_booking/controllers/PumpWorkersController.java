package com.example.cng_booking.controllers;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.projections.PumpWorkerDTO;
import com.example.cng_booking.projections.WorkerHandledCountDTO;
import com.example.cng_booking.request_dtos.UpdatePumpWorkerDTO;
import com.example.cng_booking.services.PumpContextService;
import com.example.cng_booking.services.PumpWorkersService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/pump-workers")
@Validated
public class PumpWorkersController {

    @Autowired
    private PumpWorkersService pumpWorkersService;

    @Autowired
    private PumpContextService pumpContextService;

    @PutMapping("/update-creds")
    public ResponseEntity<ApiResponse<Object>> updateWorkerCrentials(@Valid @RequestBody UpdatePumpWorkerDTO req) {
        pumpWorkersService.updateWorker(req);
        ApiResponse<Object> response = new ApiResponse<>(
                true,
                "Credentials updated successfully",
                null,
                LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete-worker")
    public ResponseEntity<ApiResponse<Object>> deletePumpWorker(
            @NotBlank(message = "wokerId is required") @RequestParam String workerId) {
        pumpWorkersService.deletePumpWorker(workerId);
        ApiResponse<Object> response = new ApiResponse<Object>(
                true,
                "worker deleted successfully",
                null,
                LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/handled-count-today")
    public ResponseEntity<ApiResponse<java.util.List<WorkerHandledCountDTO>>> getHandledCountToday() {
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        var data = pumpWorkersService.getHandledCountToday(licenseNo);
        return ResponseEntity.ok(new ApiResponse<>(true, "handled count fetched", data, LocalDateTime.now()));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<java.util.List<PumpWorkerDTO>>> listWorkersForPump() {
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        var data = pumpWorkersService.getWorkersForPump(licenseNo);
        return ResponseEntity.ok(new ApiResponse<>(true, "workers fetched", data, LocalDateTime.now()));
    }
}
