package com.example.cng_booking.services;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SlotStatus;
import com.example.cng_booking.models.SuperAdmin;
import com.example.cng_booking.models.Subscription;
import com.example.cng_booking.models.SubscriptionModel;
import com.example.cng_booking.models.SubscriptionPlan;
import com.example.cng_booking.models.Address;
import com.example.cng_booking.projections.PumpAdminManageDTO;
import com.example.cng_booking.projections.SubscriptionModelDTO;
import com.example.cng_booking.projections.SuperAdminDashboardDTO;
import com.example.cng_booking.projections.SuperAdminPumpSubscriptionDTO;
import com.example.cng_booking.projections.SuperAdminUserDTO;
import com.example.cng_booking.projections.SystemReportDTO;
import com.example.cng_booking.projections.WorkerCountByPumpDTO;
import com.example.cng_booking.repositories.PumpWorkersRepo;
import com.example.cng_booking.repositories.PumpsRepo;
import com.example.cng_booking.repositories.SlotRecordsRepo;
import com.example.cng_booking.repositories.SubscriptionModelRepo;
import com.example.cng_booking.repositories.SubscriptionPlanRepo;
import com.example.cng_booking.repositories.SubscriptionRepo;
import com.example.cng_booking.repositories.SuperAdminRepo;
import com.example.cng_booking.repositories.UsersRepo;
import com.example.cng_booking.request_dtos.CreatePumpAdminBySuperAdminDTO;
import com.example.cng_booking.request_dtos.RegisterUserDTO;
import com.example.cng_booking.request_dtos.UpdatePumpAdminBySuperAdminDTO;

import jakarta.validation.Valid;

@Service
public class SuperAdminService {

    private static final ZoneId PLATFORM_TZ = ZoneId.of("Asia/Kolkata");

    @Autowired
    private SuperAdminRepo superAdminRepo;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    private UsersRepo usersRepo;

    @Autowired
    private PumpsRepo pumpsRepo;

    @Autowired
    private PumpWorkersRepo pumpWorkersRepo;

    @Autowired
    private SlotRecordsRepo slotRecordsRepo;

    @Autowired
    private SubscriptionModelRepo subscriptionModelRepo;

    @Autowired
    private SubscriptionRepo subscriptionRepo;

    @Autowired
    private SubscriptionPlanRepo subscriptionPlanRepo;

    public void createSuperAdmin(@Valid RegisterUserDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad request");
        } else if (superAdminRepo.existsByEmail(req.email())) {
            throw new BadRequestException("super admin already exists");
        }

        SuperAdmin reqAdmin = new SuperAdmin(req.username(), req.email(), encoder.encode(req.password()), new ArrayList<>());

        superAdminRepo.save(reqAdmin);
    }

    public SuperAdmin getSuperAdminObj(String adminId) {

        if (adminId == null || adminId.length() == 0) {
            throw new BadRequestException("adminId is bull or empty");
        } else if (!superAdminRepo.existsByAdminId(adminId)) {
            throw new BadRequestException("adminId does not exists");
        }

        SuperAdmin admin = superAdminRepo.findByAdminId(adminId);

        return admin;
    }

    public SuperAdminDashboardDTO getDashboard() {
        List<Pumps> pumps = pumpsRepo.findAll();
        List<WorkerCountByPumpDTO> workerCounts = pumps.stream()
                .map(p -> new WorkerCountByPumpDTO(
                        p.getLicenseNo(),
                        p.getPumpName(),
                        pumpWorkersRepo.findByPump_LicenseNo(p.getLicenseNo()).size()))
                .toList();

        long activePumpAdmins = pumps.stream()
                .filter(p -> effectiveRemainingDays(p) > 0)
                .count();

        return new SuperAdminDashboardDTO(
                activePumpAdmins,
                usersRepo.count(),
                pumpWorkersRepo.count(),
                slotRecordsRepo.count(),
                slotRecordsRepo.findByStatusOrderByCreatedAtDesc(SlotStatus.COMPLETED).size(),
                slotRecordsRepo.findByStatusOrderByCreatedAtDesc(SlotStatus.NOTCOMPLETED).size(),
                slotRecordsRepo.findByStatusOrderByCreatedAtDesc(SlotStatus.PENDING).size(),
                workerCounts);
    }

    public List<SuperAdminPumpSubscriptionDTO> getPumpSubscriptions() {
        return pumpsRepo.findAll().stream()
                .map(p -> {
                    ResolvedPumpSubscription r = resolvePumpSubscription(p);
                    return new SuperAdminPumpSubscriptionDTO(
                            p.getLicenseNo(),
                            p.getPumpName(),
                            r.planName(),
                            r.startDate(),
                            r.remainingDays());
                })
                .toList();
    }

    public List<SubscriptionModelDTO> getSubscriptionModels() {
        return subscriptionModelRepo.findAll().stream()
                .map(m -> new SubscriptionModelDTO(
                        m.getSubsId(),
                        m.getSubsName(),
                        m.getDuration(),
                        m.getAmount(),
                        m.getBookingAmount()))
                .toList();
    }

    public void assignSubscriptionToPump(String licenseNo, long subsId) {
        Pumps pump = pumpsRepo.findByLicenseNo(licenseNo);
        if (pump == null) throw new BadRequestException("Pump not found");
        SubscriptionModel model = subscriptionModelRepo.findBySubsId(subsId);
        if (model == null) throw new BadRequestException("Subscription model not found");
        pump.setSubscriptionModel(model);
        pump.setSubscriptionStartDate(LocalDate.now());
        pumpsRepo.save(pump);
    }

    public List<SuperAdminUserDTO> getAllUsers() {
        return usersRepo.findAll().stream()
                .map(u -> new SuperAdminUserDTO(u.getUserId(), u.getUsername(), u.getEmail()))
                .toList();
    }

    public List<PumpAdminManageDTO> getPumpAdmins() {
        return pumpsRepo.findAll().stream().map(p -> {
            Address a = p.getAddress();
            return new PumpAdminManageDTO(
                    p.getLicenseNo(),
                    p.getPumpName(),
                    a == null ? "" : a.getStreetName(),
                    a == null ? "" : a.getLandmark(),
                    a == null ? 0 : a.getPincode(),
                    a == null ? 0 : a.getLatitude(),
                    a == null ? 0 : a.getLongitude(),
                    p.getSubscriptionModel() == null ? null : p.getSubscriptionModel().getSubsName(),
                    effectiveRemainingDays(p)
            );
        }).toList();
    }

    public String createPumpAdmin(@Valid CreatePumpAdminBySuperAdminDTO req) {
        if (pumpsRepo.existsByLicenseNo(req.licenseNo())) {
            throw new BadRequestException("licenseNo already in use");
        }
        Pumps pump = new Pumps(
                req.licenseNo(),
                req.pumpName(),
                encoder.encode(req.password()),
                null,
                null,
                new ArrayList<>(),
                new ArrayList<>()
        );
        Address address = new Address(
                null,
                req.longitude(),
                req.latitude(),
                req.streetName(),
                req.landmark(),
                req.pincode()
        );
        pump.setAddress(address);
        pumpsRepo.save(pump);
        return req.licenseNo();
    }

    public void updatePumpAdmin(String licenseNo, @Valid UpdatePumpAdminBySuperAdminDTO req) {
        Pumps pump = pumpsRepo.findByLicenseNo(licenseNo);
        if (pump == null) throw new BadRequestException("Pump admin not found");
        pump.setPumpName(req.pumpName());
        Address address = pump.getAddress();
        if (address == null) {
            address = new Address();
        }
        address.setStreetName(req.streetName());
        address.setLandmark(req.landmark());
        address.setPincode(req.pincode());
        address.setLatitude(req.latitude());
        address.setLongitude(req.longitude());
        pump.setAddress(address);
        pumpsRepo.save(pump);
    }

    public void deletePumpAdmin(String licenseNo) {
        Pumps pump = pumpsRepo.findByLicenseNo(licenseNo);
        if (pump == null) throw new BadRequestException("Pump admin not found");
        if (pumpWorkersRepo.findByPump_LicenseNo(licenseNo).size() > 0) {
            throw new BadRequestException("Cannot delete pump admin with active workers");
        }
        pumpsRepo.delete(pump);
    }

    public SystemReportDTO generateSystemReport(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null || toDate.isBefore(fromDate)) {
            throw new BadRequestException("Invalid report date range");
        }
        long days = ChronoUnit.DAYS.between(fromDate, toDate);
        if (days > 90) {
            throw new BadRequestException("Report date range cannot exceed 90 days");
        }
        Instant start = fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = toDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        return new SystemReportDTO(
                fromDate.toString(),
                toDate.toString(),
                slotRecordsRepo.countByCreatedAtBetween(start, end),
                slotRecordsRepo.countByStatusAndCreatedAtBetween(SlotStatus.COMPLETED, start, end),
                slotRecordsRepo.countByStatusAndCreatedAtBetween(SlotStatus.NOTCOMPLETED, start, end),
                slotRecordsRepo.countByStatusAndCreatedAtBetween(SlotStatus.PENDING, start, end)
        );
    }

    /**
     * Legacy super-admin assignment on pumps.subscription_model + subscription_start_date.
     */
    private long calculateRemainingDays(Pumps pump) {
        if (pump == null || pump.getSubscriptionModel() == null || pump.getSubscriptionStartDate() == null) {
            return 0;
        }
        long durationDays = parseDurationDays(pump.getSubscriptionModel().getDuration(), pump.getSubscriptionModel().getSubsName());
        LocalDate endDate = pump.getSubscriptionStartDate().plusDays(durationDays);
        long remaining = ChronoUnit.DAYS.between(LocalDate.now(PLATFORM_TZ), endDate);
        return Math.max(remaining, 0);
    }

    private long remainingDaysFromPlanSubscription(Subscription s) {
        if (s == null || s.getEndDate() == null) {
            return 0;
        }
        if (s.getEndDate().isBefore(LocalDateTime.now(PLATFORM_TZ))) {
            return 0;
        }
        return Math.max(ChronoUnit.DAYS.between(LocalDate.now(PLATFORM_TZ), s.getEndDate().toLocalDate()), 0);
    }

    /**
     * Pump admins paying via Razorpay use {@link Subscription} + {@link SubscriptionPlan}.
     * Super admin assignment uses {@link Pumps#getSubscriptionModel()} (legacy). Count either as active.
     */
    private long effectiveRemainingDays(Pumps pump) {
        long legacy = calculateRemainingDays(pump);
        Subscription latest = subscriptionRepo.findTopByPumpAdminIdOrderByEndDateDesc(pump.getLicenseNo())
                .orElse(null);
        long fromPlan = remainingDaysFromPlanSubscription(latest);
        return Math.max(legacy, fromPlan);
    }

    private record ResolvedPumpSubscription(String planName, LocalDate startDate, long remainingDays) {
    }

    /**
     * Prefer a non-expired paid plan (subscriptions table); otherwise legacy assignment; otherwise
     * show last plan row for display even if expired.
     */
    private ResolvedPumpSubscription resolvePumpSubscription(Pumps pump) {
        Subscription latest = subscriptionRepo.findTopByPumpAdminIdOrderByEndDateDesc(pump.getLicenseNo())
                .orElse(null);
        if (latest != null && latest.getEndDate() != null && !latest.getEndDate().isBefore(LocalDateTime.now(PLATFORM_TZ))) {
            String name = subscriptionPlanRepo.findById(latest.getPlanId())
                    .map(SubscriptionPlan::getName)
                    .orElse("Subscription");
            LocalDate start = latest.getStartDate() == null ? null : latest.getStartDate().toLocalDate();
            return new ResolvedPumpSubscription(name, start, remainingDaysFromPlanSubscription(latest));
        }
        if (pump.getSubscriptionModel() != null && pump.getSubscriptionStartDate() != null) {
            long rem = calculateRemainingDays(pump);
            return new ResolvedPumpSubscription(
                    pump.getSubscriptionModel().getSubsName(),
                    pump.getSubscriptionStartDate(),
                    rem);
        }
        if (latest != null) {
            String name = subscriptionPlanRepo.findById(latest.getPlanId())
                    .map(SubscriptionPlan::getName)
                    .orElse(null);
            LocalDate start = latest.getStartDate() == null ? null : latest.getStartDate().toLocalDate();
            return new ResolvedPumpSubscription(name, start, 0);
        }
        return new ResolvedPumpSubscription(null, null, 0);
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
