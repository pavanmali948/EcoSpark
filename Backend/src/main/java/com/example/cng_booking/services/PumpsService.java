package com.example.cng_booking.services;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.sql.Time;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.Address;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SlotIntervals;
import com.example.cng_booking.models.SlotStatus;
import com.example.cng_booking.projections.PumpResponseDTO;
import com.example.cng_booking.projections.PumpSettingsDTO;
import com.example.cng_booking.projections.PumpSubscriptionDTO;
import com.example.cng_booking.projections.SlotResponseDTO;
import com.example.cng_booking.repositories.PumpsRepo;
import com.example.cng_booking.repositories.SlotIntervalsRepo;
import com.example.cng_booking.repositories.SlotRecordsRepo;
import com.example.cng_booking.request_dtos.RegisterPumpAdminDTO;
import com.example.cng_booking.request_dtos.RequestCreateSlotIntervalDTO;
import com.example.cng_booking.request_dtos.UpdatePumpSettingsDTO;

import jakarta.validation.Valid;

@Service
public class PumpsService {

    /** Slot interval wall-clock times are interpreted in India Standard Time for API clients. */
    private static final ZoneId BOOKING_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter ISO_WITH_OFFSET = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @Autowired
    private PumpsRepo pumpsRepo;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private AddressService addressService;

    @Autowired
    private SlotIntervalsRepo slotIntervalsRepo;

    @Autowired
    private BookingRealtimeService bookingRealtimeService;

    @Autowired
    private SlotRecordsRepo slotRecordsRepo;

    public String createPump(@Valid RegisterPumpAdminDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad request");
        } else if (pumpsRepo.existsByLicenseNo(req.licenseNo())) {
            throw new BadRequestException("LicenseNo already in use");
        } else if (req.pumpName() == null || req.pumpName().isBlank()) {
            throw new BadRequestException("pumpName is empty or null");
        } else if (req.streetName() == null || req.streetName().isBlank()) {
            throw new BadRequestException("streetName is empty or null");
        } else if (req.landmark() == null || req.landmark().isBlank()) {
            throw new BadRequestException("landmark is empty or null");
        }

        Pumps pump = new Pumps(
                req.licenseNo(),
                req.pumpName(),
                encoder.encode(req.password()),
                null,
                null,
                new ArrayList<>(),
                new ArrayList<>());

        Address address = new Address(
                null,
                req.longitude(),
                req.latitude(),
                req.streetName(),
                req.landmark(),
                req.pincode());

        address = addressService.createAddress(address);

        pump.setAddress(address);

        pump = pumpsRepo.save(pump);

        return pump.getLicenseNo();
    }

    public Pumps getPumpsObj(String licenseNo) {

        if (licenseNo == null || licenseNo.length() == 0) {
            throw new BadRequestException("licenseNo is empty or null");
        } else if (!pumpsRepo.existsByLicenseNo(licenseNo)) {
            throw new BadRequestException("licenseNo does not exist");
        }

        Pumps pump = pumpsRepo.findByLicenseNo(licenseNo);

        return pump;
    }

    public List<PumpResponseDTO> getAllPumps() {
        return pumpsRepo.findAll().stream().map(pump -> {
            Address addr = pump.getAddress();
            String location = addr != null ? addr.getStreetName() + ", " + addr.getLandmark() + " - " + addr.getPincode() : "Unknown";
            double lat = addr != null ? addr.getLatitude() : 0.0;
            double lng = addr != null ? addr.getLongitude() : 0.0;
            return new PumpResponseDTO(pump.getLicenseNo(), pump.getPumpName(), location, "N/A", "4.0", lat, lng);
        }).collect(Collectors.toList());
    }

    public List<SlotResponseDTO> getPumpSlots(String licenseNo) {
        if (!pumpsRepo.existsByLicenseNo(licenseNo)) {
            throw new BadRequestException("Pump not found");
        }
        Pumps pump = pumpsRepo.findByLicenseNo(licenseNo);
        LocalDate todayDate = LocalDate.now(BOOKING_ZONE);
        LocalTime nowTime = LocalTime.now(BOOKING_ZONE);
        Instant dayStart = todayDate.atStartOfDay(BOOKING_ZONE).toInstant();
        Instant dayEnd = todayDate.plusDays(1).atStartOfDay(BOOKING_ZONE).toInstant();

        return slotIntervalsRepo.findByPump(pump).stream().map(interval -> {
            long bookedCount = slotRecordsRepo.countByPump_LicenseNoAndSlot_IntervalIdAndStatusCreatedAtBetween(
                    pump.getLicenseNo(),
                    interval.getIntervalId(),
                    SlotStatus.PENDING,
                    dayStart,
                    dayEnd);
            int maxCapacity = 5;
            LocalTime endLt = interval.getEnd().toLocalTime();
            boolean timePassed = !nowTime.isBefore(endLt);
            String status;
            if (timePassed) {
                status = "closed";
            } else if (bookedCount >= maxCapacity) {
                status = "full";
            } else {
                status = "open";
            }

            LocalTime startLt = interval.getStart().toLocalTime();
            String startISO = ZonedDateTime.of(todayDate, startLt, BOOKING_ZONE).format(ISO_WITH_OFFSET);
            String endISO = ZonedDateTime.of(todayDate, endLt, BOOKING_ZONE).format(ISO_WITH_OFFSET);

            return new SlotResponseDTO(interval.getIntervalId(), startISO, endISO, maxCapacity, bookedCount, status);
        }).sorted((a, b) -> a.getStartISO().compareTo(b.getStartISO())).collect(Collectors.toList());
    }

    public List<SlotIntervals> getAllSlotIntervals(String licenseNo) {
        Pumps pump = getPumpsObj(licenseNo);
        return slotIntervalsRepo.findByPump(pump);
    }

    public void createSlotInterval(RequestCreateSlotIntervalDTO req, String licenseNo) {
        if (req == null) {
            throw new BadRequestException("Bad request");
        } else if (req.end().before(req.start()) || req.end().equals(req.start())) {
            throw new BadRequestException("end time must be after start time");
        }
        Pumps pump = getPumpsObj(licenseNo);
        if (slotIntervalsRepo.existsByPumpAndStartAndEnd(pump, req.start(), req.end())) {
            throw new BadRequestException("Slot interval already exists for this pump");
        }
        SlotIntervals interval = new SlotIntervals(req.start(), req.end(), pump);
        slotIntervalsRepo.save(interval);
        bookingRealtimeService.notifyPumpUpdated(licenseNo);
    }

    public PumpSettingsDTO getPumpSettings(String licenseNo) {
        Pumps pump = getPumpsObj(licenseNo);
        String opening = pump.getOpeningTime() == null ? "" : pump.getOpeningTime().toLocalTime().toString();
        String closing = pump.getClosingTime() == null ? "" : pump.getClosingTime().toLocalTime().toString();
        return new PumpSettingsDTO(opening, closing);
    }

    public PumpSettingsDTO updatePumpSettings(String licenseNo, UpdatePumpSettingsDTO req) {
        if (req == null) {
            throw new BadRequestException("Bad request");
        }
        Pumps pump = getPumpsObj(licenseNo);
        if (req.openingTime() != null && !req.openingTime().isBlank()) {
            pump.setOpeningTime(Time.valueOf(normalizeToHHmmss(req.openingTime())));
        }
        if (req.closingTime() != null && !req.closingTime().isBlank()) {
            pump.setClosingTime(Time.valueOf(normalizeToHHmmss(req.closingTime())));
        }
        pumpsRepo.save(pump);
        bookingRealtimeService.notifyPumpUpdated(licenseNo);
        return getPumpSettings(licenseNo);
    }

    public PumpSubscriptionDTO getPumpSubscription(String licenseNo) {
        Pumps pump = getPumpsObj(licenseNo);
        if (pump.getSubscriptionModel() == null || pump.getSubscriptionStartDate() == null) {
            return new PumpSubscriptionDTO(null, 0f, null, null, 0);
        }
        long durationDays = parseDurationDays(pump.getSubscriptionModel().getDuration(), pump.getSubscriptionModel().getSubsName());
        long remaining = Math.max(
                ChronoUnit.DAYS.between(LocalDate.now(), pump.getSubscriptionStartDate().plusDays(durationDays)),
                0);
        return new PumpSubscriptionDTO(
                pump.getSubscriptionModel().getSubsName(),
                pump.getSubscriptionModel().getAmount(),
                pump.getSubscriptionModel().getDuration(),
                pump.getSubscriptionStartDate(),
                remaining);
    }

    private String normalizeToHHmmss(String value) {
        String v = value.trim();
        if (v.length() == 5) return v + ":00";
        return v;
    }

    private long parseDurationDays(String duration, String subsName) {
        String v = (duration == null ? "" : duration).toLowerCase();
        String s = (subsName == null ? "" : subsName).toLowerCase();
        if (v.contains("quarter") || s.contains("quarter")) return 90;
        if (v.contains("semi") || s.contains("semi")) return 180;
        if (v.contains("year")) return 365;
        return 30;
    }
}
