// initializeDummyData.js - Initialize dummy pump and slot data

/**
 * Generates time slots for a day
 */
const generateTimeSlots = (date) => {
    const slots = [];
    const slotDuration = 60; // minutes
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM

    for (let hour = startHour; hour < endHour; hour++) {
        const startISO = new Date(date);
        startISO.setHours(hour, 0, 0, 0);

        const endISO = new Date(date);
        endISO.setHours(hour + 1, 0, 0, 0);

        // Randomly vary capacity and booked count for realism
        const maxCapacity = Math.floor(Math.random() * 5) + 8; // 8-12 capacity
        const bookedCount = Math.floor(Math.random() * (maxCapacity - 2)); // Some bookings

        slots.push({
            id: `slot_${hour}_${date}`,
            startISO: startISO.toISOString(),
            endISO: endISO.toISOString(),
            date: date,
            maxCapacity,
            bookedCount,
            status: bookedCount >= maxCapacity ? 'full' : 'open'
        });
    }

    return slots;
};

/**
 * Initialize dummy pump data
 */
export const initializeDummyPumps = () => {
    const today = new Date().toISOString().slice(0, 10);

    const pumps = [
        {
            id: '1',
            name: 'Shell CNG Station',
            location: 'Sector 18, Noida',
            distance: '2.3 km',
            rating: 4.5,
            latitude: 28.5678,  // Noida coordinates
            longitude: 77.3210,
            slots: generateTimeSlots(today)
        },
        {
            id: '2',
            name: 'BP CNG Station',
            location: 'Connaught Place, Delhi',
            distance: '5.7 km',
            rating: 4.2,
            latitude: 28.6315,  // CP coordinates
            longitude: 77.2167,
            slots: generateTimeSlots(today)
        },
        {
            id: '3',
            name: 'Indian Oil CNG',
            location: 'Dwarka Sector 10, Delhi',
            distance: '8.1 km',
            rating: 4.0,
            latitude: 28.5921,  // Dwarka coordinates
            longitude: 77.0460,
            slots: generateTimeSlots(today).map(s => ({ ...s, status: 'closed' }))
        },
        {
            id: '4',
            name: 'HP CNG Station',
            location: 'Rohini Sector 7, Delhi',
            distance: '12.5 km',
            rating: 4.7,
            latitude: 28.7489,  // Rohini coordinates
            longitude: 77.1177,
            slots: generateTimeSlots(today)
        },
        {
            id: '5',
            name: 'Adani CNG Pump',
            location: 'Saket, Delhi',
            distance: '6.2 km',
            rating: 4.3,
            latitude: 28.5244,  // Saket coordinates
            longitude: 77.2066,
            slots: generateTimeSlots(today)
        }
    ];

    // Store each pump in localStorage
    pumps.forEach(pump => {
        localStorage.setItem(`cng_pump_${pump.id}`, JSON.stringify(pump));
    });

    console.log('✅ Dummy pump data initialized successfully!');
    console.log(`📍 ${pumps.length} pumps created with time slots for ${today}`);

    return pumps;
};

/**
 * Check if pumps are already initialized
 */
export const checkPumpsInitialized = () => {
    return localStorage.getItem('cng_pump_1') !== null;
};

/**
 * Get all pumps
 */
export const getAllPumps = () => {
    const pumps = [];
    for (let i = 1; i <= 5; i++) {
        const pumpData = localStorage.getItem(`cng_pump_${i}`);
        if (pumpData) {
            pumps.push(JSON.parse(pumpData));
        }
    }
    return pumps;
};

/**
 * Clear all pump data (for testing)
 */
export const clearPumpData = () => {
    for (let i = 1; i <= 10; i++) {
        localStorage.removeItem(`cng_pump_${i}`);
    }
    console.log('🗑️ All pump data cleared');
};
