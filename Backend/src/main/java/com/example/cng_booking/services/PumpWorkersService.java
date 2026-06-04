package com.example.cng_booking.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.exceptions.NotFoundException;
import com.example.cng_booking.models.PumpWorkers;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SlotStatus;
import com.example.cng_booking.projections.WorkerHandledCountDTO;
import com.example.cng_booking.repositories.PumpWorkersRepo;
import com.example.cng_booking.repositories.SlotRecordsRepo;
import com.example.cng_booking.request_dtos.RegisterPumpWorkerDTO;
import com.example.cng_booking.request_dtos.UpdatePumpWorkerDTO;
import com.example.cng_booking.projections.PumpWorkerDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@Service
@Validated
public class PumpWorkersService {

    @Autowired
    private PumpWorkersRepo pumpWorkersRepo;

    @Autowired
    private PumpsService pumpsService;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    private SlotRecordsRepo slotRecordsRepo;

    public String createPumpWorker(@Valid RegisterPumpWorkerDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad Request");
        } else if (pumpWorkersRepo.existsByEmail(req.email())) {
            throw new BadRequestException("Worker email already exists");
        }

        Pumps pump = pumpsService.getPumpsObj(req.licenseNo());

        PumpWorkers reqWorker = new PumpWorkers(pump, req.workerName(), req.email(), encoder.encode(req.password()));

        PumpWorkers worker = pumpWorkersRepo.save(reqWorker);
        return worker.getWorkerId();
    }

    public void updateWorker(@Valid UpdatePumpWorkerDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad Request");
        } else if (req.workerId().isBlank()) {
            throw new BadRequestException("workerId is null or empty");
        } else if (!pumpWorkersRepo.existsByWorkerId(req.workerId())) {
            throw new NotFoundException("worker not found");
        } else if (req.workerName().isBlank()) {
            throw new BadRequestException("workerName is null or empty");
        } else if (req.email().isBlank()) {
            throw new BadRequestException("email is null or empty");
        }

        PumpWorkers worker = pumpWorkersRepo.findByWorkerId(req.workerId());
        worker.setEmail(req.email());
        worker.setWorkerName(req.workerName());

        // Password updates are optional; keep existing password when blank.
        if (req.password() != null && !req.password().isBlank()) {
            worker.setPassword(encoder.encode(req.password()));
        }
        pumpWorkersRepo.save(worker);
    }

    public void deletePumpWorker(@NotBlank(message = "workerId is required") String workerId) {
        pumpWorkersRepo.deleteById(workerId);
    }

    public List<WorkerHandledCountDTO> getHandledCountToday(String licenseNo) {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        Instant start = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        List<Object[]> raw = slotRecordsRepo.countHandledByWorkerBetween(licenseNo, SlotStatus.COMPLETED, start, end);
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : raw) {
            String workerId = row[0] == null ? null : String.valueOf(row[0]);
            Long c = row[1] == null ? 0L : ((Number) row[1]).longValue();
            if (workerId != null) counts.put(workerId, c);
        }
        return pumpWorkersRepo.findByPump_LicenseNo(licenseNo).stream()
                .map(w -> new WorkerHandledCountDTO(
                        w.getWorkerId(),
                        w.getWorkerName(),
                        counts.getOrDefault(w.getWorkerId(), 0L)))
                .toList();
    }

    public List<PumpWorkerDTO> getWorkersForPump(String licenseNo) {
        return pumpWorkersRepo.findByPump_LicenseNo(licenseNo).stream()
                .map(w -> new PumpWorkerDTO(
                        w.getWorkerId(),
                        w.getWorkerName(),
                        w.getEmail(),
                        w.getCreatedAt()))
                .toList();
    }
}
