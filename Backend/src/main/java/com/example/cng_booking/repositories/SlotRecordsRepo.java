package com.example.cng_booking.repositories;

import java.util.List;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.cng_booking.models.SlotRecords;
import com.example.cng_booking.models.SlotStatus;
import com.example.cng_booking.models.Users;
import com.example.cng_booking.projections.SlotRecordsHistoryDTO;

public interface SlotRecordsRepo extends JpaRepository<SlotRecords, String> {

    SlotRecords findByQrCode(String qrCode);

    boolean existsByQrCode(String qrCode);

    List<SlotRecords> findByPump_LicenseNoAndStatusOrderByCreatedAtDesc(String licenseNo, SlotStatus status);
    List<SlotRecords> findByStatusOrderByCreatedAtDesc(SlotStatus status);

    List<SlotRecords> findByUserAndStatusOrderByCreatedAtDesc(Users user, SlotStatus status);

    long countByPump_LicenseNoAndSlot_IntervalIdAndStatus(String licenseNo, long intervalId, SlotStatus status);

    @Query("""
            SELECT COUNT(sr)
            FROM slot_records sr
            WHERE sr.pump.licenseNo = :licenseNo
              AND sr.slot.intervalId = :intervalId
              AND sr.status = :status
              AND sr.createdAt >= :start
              AND sr.createdAt < :end
            """)
    long countByPump_LicenseNoAndSlot_IntervalIdAndStatusCreatedAtBetween(
            @Param("licenseNo") String licenseNo,
            @Param("intervalId") long intervalId,
            @Param("status") SlotStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end);

    List<SlotRecords> findByPump_LicenseNoAndStatusOrderByHandledAtDesc(String licenseNo, SlotStatus status);
    long countByCreatedAtBetween(Instant start, Instant end);
    long countByStatusAndCreatedAtBetween(SlotStatus status, Instant start, Instant end);

    @Query("""
            SELECT sr.handledByWorkerId, COUNT(sr)
            FROM slot_records sr
            WHERE sr.pump.licenseNo = :licenseNo
              AND sr.status = :status
              AND sr.handledAt >= :start
              AND sr.handledAt < :end
              AND sr.handledByWorkerId IS NOT NULL
            GROUP BY sr.handledByWorkerId
            """)
    List<Object[]> countHandledByWorkerBetween(
            @Param("licenseNo") String licenseNo,
            @Param("status") SlotStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("""
            SELECT NEW com.example.cng_booking.projections.SlotRecordsHistoryDTO(
                sr.slotId, sr.qrCode, sr.status, sr.slot, p.address, sr.vehicleNumber, p.pumpName)
            FROM slot_records sr JOIN sr.pump p
            WHERE sr.user = :user
            """)
    Page<SlotRecordsHistoryDTO> readByUser(@Param("user") Users user, Pageable pageable);
}
