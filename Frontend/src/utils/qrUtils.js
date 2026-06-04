// qrUtils.js - QR Code and Booking Verification Utilities

/**
 * Validates the structure of a QR code payload
 * @param {string} qrData - The scanned QR code data
 * @returns {Object|null} - Parsed booking data or null if invalid
 */
export const validateQRPayload = (qrData) => {
    try {
        const parsed = JSON.parse(qrData);

        // Check required fields
        const requiredFields = ['bookingId', 'vehicleNumber', 'pumpName', 'slotStart', 'slotEnd', 'bookingNumber', 'dateISO'];
        const hasAllFields = requiredFields.every(field => parsed.hasOwnProperty(field));

        if (!hasAllFields) {
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Invalid QR payload:', error);
        return null;
    }
};

/**
 * Checks if a booking is eligible for verification
 * @param {Object} booking - The booking object
 * @returns {Object} - { eligible: boolean, reason: string }
 */
export const isBookingEligibleForVerification = (booking) => {
    if (!booking) {
        return { eligible: false, reason: 'Booking not found' };
    }

    if (booking.verificationStatus === 'verified') {
        return { eligible: false, reason: 'Booking already verified' };
    }

    // Check if booking date is valid (not in the past, with some tolerance)
    const bookingDate = new Date(booking.slotStart);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (bookingDate < oneDayAgo) {
        return { eligible: false, reason: 'Booking expired (more than 24 hours old)' };
    }

    if (booking.status === 'cancelled') {
        return { eligible: false, reason: 'Booking was cancelled' };
    }

    return { eligible: true, reason: 'OK' };
};

/**
 * Finds a booking by ID in localStorage
 * @param {string} bookingId - The booking ID
 * @returns {Object|null} - Booking object or null if not found
 */
export const findBookingById = (bookingId) => {
    try {
        const allBookings = JSON.parse(localStorage.getItem('cng_bookings') || '[]');
        return allBookings.find(b => b.id === bookingId) || null;
    } catch (error) {
        console.error('Error finding booking:', error);
        return null;
    }
};

/**
 * Updates booking verification status
 * @param {string} bookingId - The booking ID
 * @param {string} workerEmail - The worker's email or ID
 * @returns {boolean} - Success status
 */
export const verifyBooking = (bookingId, workerEmail = 'worker@cngpump.com') => {
    try {
        const allBookings = JSON.parse(localStorage.getItem('cng_bookings') || '[]');
        const bookingIndex = allBookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
            return false;
        }

        // Update booking with verification details
        allBookings[bookingIndex] = {
            ...allBookings[bookingIndex],
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString(),
            verifiedBy: workerEmail,
            status: 'verified'
        };

        localStorage.setItem('cng_bookings', JSON.stringify(allBookings));

        // Also save to worker's verified bookings
        saveToWorkerHistory(allBookings[bookingIndex], workerEmail);

        return true;
    } catch (error) {
        console.error('Error verifying booking:', error);
        return false;
    }
};

/**
 * Saves verified booking to worker's history
 * @param {Object} booking - The verified booking
 * @param {string} workerEmail - The worker's email or ID
 */
const saveToWorkerHistory = (booking, workerEmail) => {
    try {
        const workerHistory = JSON.parse(localStorage.getItem('worker_verifications') || '[]');

        workerHistory.push({
            bookingId: booking.id,
            vehicleNumber: booking.vehicleNumber,
            pumpName: booking.pumpName,
            verifiedAt: booking.verifiedAt,
            verifiedBy: workerEmail,
            amount: booking.amount,
            slotStart: booking.slotStart,
            slotEnd: booking.slotEnd
        });

        localStorage.setItem('worker_verifications', JSON.stringify(workerHistory));
    } catch (error) {
        console.error('Error saving to worker history:', error);
    }
};

/**
 * Gets all verified bookings by a specific worker
 * @param {string} workerEmail - The worker's email or ID
 * @returns {Array} - Array of verified bookings
 */
export const getWorkerVerifiedBookings = (workerEmail) => {
    try {
        const workerHistory = JSON.parse(localStorage.getItem('worker_verifications') || '[]');
        return workerEmail
            ? workerHistory.filter(v => v.verifiedBy === workerEmail)
            : workerHistory;
    } catch (error) {
        console.error('Error getting worker history:', error);
        return [];
    }
};

/**
 * Gets verification statistics for today
 * @returns {Object} - Statistics object
 */
export const getTodayVerificationStats = () => {
    try {
        const workerHistory = JSON.parse(localStorage.getItem('worker_verifications') || '[]');
        const today = new Date().toISOString().slice(0, 10);

        const todayVerifications = workerHistory.filter(v => {
            const verifiedDate = new Date(v.verifiedAt).toISOString().slice(0, 10);
            return verifiedDate === today;
        });

        return {
            totalToday: todayVerifications.length,
            total: workerHistory.length,
            todayBookings: todayVerifications
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return { totalToday: 0, total: 0, todayBookings: [] };
    }
};
