package com.example.cng_booking.services;

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.exceptions.NotFoundException;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SlotIntervals;
import com.example.cng_booking.models.SlotRecords;
import com.example.cng_booking.models.SlotStatus;
import com.example.cng_booking.models.Users;
import com.example.cng_booking.authentication.CustomPrincipal;
import com.example.cng_booking.projections.PumpPendingSlotDTO;
import com.example.cng_booking.projections.SlotRecordsHistoryDTO;
import com.example.cng_booking.repositories.SlotRecordsRepo;
import com.example.cng_booking.request_dtos.RequestChangeSlotStatusDTO;
import com.example.cng_booking.request_dtos.RequestSlotBookDTO;
import com.example.cng_booking.request_dtos.RequestSlotHistoryOfUserDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;

@Service
public class SlotRecordsService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final ZoneId BOOKING_ZONE = ZoneId.of("Asia/Kolkata");

    @Autowired
    private SlotRecordsRepo slotRecordsRepo;

    @Autowired
    private SlotIntervalsService slotIntervalsService;

    @Autowired
    private UsersService usersService;

    @Autowired
    private PumpsService pumpsService;

    @Autowired
    private BookingRealtimeService bookingRealtimeService;

    @Autowired
    private QRService qrService;

    public String createSlotRecord(@Valid RequestSlotBookDTO req) {
        SlotRecords booking = createSlotRecordAfterPayment(req);
        return qrService.generateBase64(booking.getQrCode());
    }

    public SlotRecords createSlotRecordAfterPayment(@Valid RequestSlotBookDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad Request");
        }

        SlotIntervals slot = slotIntervalsService.getSlotIntervalObj(req.slotIntervalId());
        Users user = usersService.getUserObj(req.userId());
        Pumps pump = pumpsService.getPumpsObj(req.licenseNo());

        if (slot.getPump() == null || !slot.getPump().getLicenseNo().equals(pump.getLicenseNo())) {
            throw new BadRequestException("Selected slot does not belong to this pump");
        }
        LocalTime now = LocalTime.now(BOOKING_ZONE);
        LocalTime slotEnd = slot.getEnd() == null ? null : slot.getEnd().toLocalTime();
        if (slotEnd != null && !now.isBefore(slotEnd)) {
            throw new BadRequestException("Selected slot has already ended for today");
        }

        // Allow booking based on slot availability/capacity instead of current server-time window.
        int maxCapacity = 5;
        LocalDate todayDate = LocalDate.now(BOOKING_ZONE);
        Instant dayStart = todayDate.atStartOfDay(BOOKING_ZONE).toInstant();
        Instant dayEnd = todayDate.plusDays(1).atStartOfDay(BOOKING_ZONE).toInstant();
        long pendingCount = slotRecordsRepo.countByPump_LicenseNoAndSlot_IntervalIdAndStatusCreatedAtBetween(
                pump.getLicenseNo(),
                slot.getIntervalId(),
                SlotStatus.PENDING,
                dayStart,
                dayEnd);
        if (pendingCount >= maxCapacity) {
            throw new BadRequestException("Selected slot is full. Please book another slot.");
        }

        if (req.transactionId() == null || req.transactionId().length() == 0) {
            throw new BadRequestException("transactionId is empty or null");
        }

        String qrToken = UUID.randomUUID().toString();

        SlotRecords reqSlotRecord = new SlotRecords(SlotStatus.PENDING, slot, user, req.vehicleNumber(), pump,
                req.transactionId(), qrToken);

        SlotRecords saved = slotRecordsRepo.save(reqSlotRecord);
        String qrPayload = buildQrPayloadJson(saved, (int) pendingCount + 1);
        saved.setQrCode(qrPayload);
        saved = slotRecordsRepo.save(saved);
        bookingRealtimeService.notifyPumpUpdated(pump.getLicenseNo());
        return saved;
    }

    private String buildQrPayloadJson(SlotRecords slotRecord, int bookingNumber) {
        SlotIntervals interval = slotRecord.getSlot();
        String slotStart = interval != null && interval.getStart() != null ? interval.getStart().toString() : null;
        String slotEnd = interval != null && interval.getEnd() != null ? interval.getEnd().toString() : null;
        Map<String, Object> payload = Map.of(
                "qrCode", slotRecord.getSlotId(),
                "bookingId", slotRecord.getSlotId(),
                "vehicleNumber", slotRecord.getVehicleNumber() == null ? "" : slotRecord.getVehicleNumber(),
                "pumpName", slotRecord.getPump() == null ? "" : slotRecord.getPump().getPumpName(),
                "slotStart", slotStart == null ? "" : slotStart,
                "slotEnd", slotEnd == null ? "" : slotEnd,
                "bookingNumber", bookingNumber,
                "dateISO", slotRecord.getCreatedAt() == null ? Instant.now().toString() : slotRecord.getCreatedAt().toString());
        try {
            return OBJECT_MAPPER.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new BadRequestException("Unable to generate booking QR payload");
        }
    }

    public List<PumpPendingSlotDTO> getPendingAtPump(String licenseNo) {
        pumpsService.getPumpsObj(licenseNo);
        markExpiredPendingAsMissed();
        return slotRecordsRepo
                .findByPump_LicenseNoAndStatusOrderByCreatedAtDesc(licenseNo, SlotStatus.PENDING)
                .stream()
                .map(this::toPumpPendingDto)
                .toList();
    }

    public List<PumpPendingSlotDTO> getCompletedAtPump(String licenseNo) {
        pumpsService.getPumpsObj(licenseNo);
        return slotRecordsRepo
                .findByPump_LicenseNoAndStatusOrderByHandledAtDesc(licenseNo, SlotStatus.COMPLETED)
                .stream()
                .map(this::toPumpPendingDto)
                .toList();
    }

    public List<PumpPendingSlotDTO> getPendingForUserBookings(String userIdOrEmail) {
        if (userIdOrEmail == null || userIdOrEmail.isBlank()) {
            throw new BadRequestException("userId is null or empty");
        }
        markExpiredPendingAsMissed();
        Users user = usersService.getUserObj(userIdOrEmail);
        return slotRecordsRepo.findByUserAndStatusOrderByCreatedAtDesc(user, SlotStatus.PENDING)
                .stream()
                .map(this::toPumpPendingDto)
                .toList();
    }

    private PumpPendingSlotDTO toPumpPendingDto(SlotRecords sr) {
        SlotIntervals interval = sr.getSlot();
        String start = interval != null && interval.getStart() != null
                ? interval.getStart().toLocalTime().toString()
                : "";
        String end = interval != null && interval.getEnd() != null ? interval.getEnd().toLocalTime().toString() : "";
        Pumps pump = sr.getPump();
        var addr = pump.getAddress();
        String addrStr = "";
        if (addr != null) {
            addrStr = addr.getStreetName() + " " + addr.getLandmark() + " - " + addr.getPincode();
        }
        return new PumpPendingSlotDTO(
                sr.getSlotId(),
                sr.getQrCode(),
                sr.getVehicleNumber(),
                sr.getUser().getUsername(),
                start,
                end,
                addrStr,
                pump.getPumpName(),
                sr.getCreatedAt().toString());
    }

    public void changeSlotStatus(@Valid RequestChangeSlotStatusDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad Request");
        } else if (req.qrCode().isBlank()) {
            throw new BadRequestException("qrCode is empty or blank");
        } else if (req.licenseNo().isBlank()) {
            throw new BadRequestException("licenseNo is null or blank");
        }

        SlotRecords slotRecord = resolveSlotRecordFromScannedQr(req.qrCode());
        if (slotRecord == null) {
            throw new NotFoundException("slot does not exists");
        }

        if (!slotRecord.getPump().getLicenseNo().equals(req.licenseNo())) {
            throw new BadRequestException("Scanning from Invalid Pump Operator");
        }

        // If the booking window is already over, treat the QR as expired even if status
        // hasn't been marked by background/queue refresh yet.
        SlotIntervals interval = slotRecord.getSlot();
        if (interval != null && interval.getEnd() != null) {
            LocalDate today = LocalDate.now(BOOKING_ZONE);
            LocalTime now = LocalTime.now(BOOKING_ZONE);
            LocalTime slotEnd = interval.getEnd().toLocalTime();
            Instant created = slotRecord.getCreatedAt();
            LocalDate bookingDate = created == null
                    ? today
                    : LocalDateTime.ofInstant(created, BOOKING_ZONE).toLocalDate();
            boolean bookingOutOfWindow = bookingDate.isBefore(today) || (bookingDate.isEqual(today) && !now.isBefore(slotEnd));
            if (bookingOutOfWindow) {
                throw new BadRequestException("QR expired");
            }
        }

        // QR code can be verified only once.
        // After first scan, booking becomes COMPLETED/NOTCOMPLETED and should be treated as expired.
        if (slotRecord.getStatus() != SlotStatus.PENDING) {
            throw new BadRequestException("QR expired");
        }

        slotRecord.setStatus(SlotStatus.COMPLETED);
        String handledBy = null;
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomPrincipal principal) {
            handledBy = principal.getUsername();
        }
        slotRecord.setHandledByWorkerId(handledBy);
        slotRecord.setHandledAt(Instant.now());
        slotRecordsRepo.save(slotRecord);
        bookingRealtimeService.notifyPumpUpdated(slotRecord.getPump().getLicenseNo());
    }

    private SlotRecords resolveSlotRecordFromScannedQr(String scannedValue) {
        if (scannedValue == null || scannedValue.isBlank()) {
            return null;
        }
        if (slotRecordsRepo.existsByQrCode(scannedValue)) {
            return slotRecordsRepo.findByQrCode(scannedValue);
        }
        try {
            JsonNode node = OBJECT_MAPPER.readTree(scannedValue);
            JsonNode tokenNode = node.get("qrCode");
            if (tokenNode != null && tokenNode.isTextual()) {
                String token = tokenNode.asText();
                if (!token.isBlank()) {
                    return slotRecordsRepo.findById(token).orElse(null);
                }
            }
        } catch (Exception ignored) {
            // Non-JSON scanned payload; continue fallback handling.
        }
        String[] legacyParts = scannedValue.split("\\|");
        if (legacyParts.length >= 3) {
            String possibleId = legacyParts[legacyParts.length - 1];
            return slotRecordsRepo.findById(possibleId).orElse(null);
        }
        return null;
    }

    public Page<SlotRecordsHistoryDTO> getSlotHistoryOfUser(@Valid RequestSlotHistoryOfUserDTO req) {

        if (req == null) {
            throw new BadRequestException("request is blank");
        } else if (req.userId().isBlank()) {
            throw new BadRequestException("userId is blank");
        }

        markExpiredPendingAsMissed();
        Users user = usersService.getUserObj(req.userId());
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        return slotRecordsRepo.readByUser(user, pageable);
    }

    private void markExpiredPendingAsMissed() {
        List<SlotRecords> pendingRecords = slotRecordsRepo.findByStatusOrderByCreatedAtDesc(SlotStatus.PENDING);
        LocalDate today = LocalDate.now(BOOKING_ZONE);
        LocalTime now = LocalTime.now(BOOKING_ZONE);
        boolean changed = false;
        java.util.Set<String> changedPumps = new java.util.HashSet<>();

        for (SlotRecords record : pendingRecords) {
            SlotIntervals interval = record.getSlot();
            if (interval == null || interval.getEnd() == null) continue;
            LocalTime slotEnd = interval.getEnd().toLocalTime();

            Instant created = record.getCreatedAt();
            LocalDate bookingDate = created == null
                    ? today
                    : LocalDateTime.ofInstant(created, BOOKING_ZONE).toLocalDate();
            if (bookingDate.isBefore(today) || (bookingDate.isEqual(today) && !now.isBefore(slotEnd))) {
                record.setStatus(SlotStatus.NOTCOMPLETED);
                changed = true;
                if (record.getPump() != null && record.getPump().getLicenseNo() != null) {
                    changedPumps.add(record.getPump().getLicenseNo());
                }
            }
        }

        if (changed) {
            slotRecordsRepo.saveAll(pendingRecords);
            for (String licenseNo : changedPumps) {
                bookingRealtimeService.notifyPumpUpdated(licenseNo);
            }
        }
    }
}
