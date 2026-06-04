import React, { useState, useEffect } from "react";
// (intentionally no icons)

export default function ManageSlotView() {
  const [openingTime, setOpeningTime] = useState("06:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [capacity, setCapacity] = useState(10);
  const [slots, setSlots] = useState([]);

  // Generate time slots automatically
  const generateSlots = () => {
    const result = [];
    let open = parseInt(openingTime.split(":")[0]);
    let close = parseInt(closingTime.split(":")[0]);

    if (close <= open) return []; 

    for (let hour = open; hour < close; hour++) {
      const booked = Math.floor(Math.random() * capacity); // mock backend
      result.push({
        start: hour,
        end: hour + 1,
        booked,
        capacity,
      });
    }

    return result;
  };

  useEffect(() => {
    setSlots(generateSlots());
  }, [openingTime, closingTime, capacity]);

  const getSlotColor = (booked, capacity) => {
    const percentage = (booked / capacity) * 100;

    if (percentage === 100) return "bg-red-50 border-red-500";
    if (percentage >= 70) return "bg-yellow-50 border-yellow-500";
    return "bg-green-50 border-green-500";
  };

  const formatTime = (hour) => {
    const display = hour % 12 || 12;
    const suffix = hour < 12 ? "AM" : "PM";
    return `${display}:00 ${suffix}`;
  };

  return (
    <div className="space-y-10">

      {/* SETTINGS PANEL */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Slot Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Opening Time */}
          <div>
            <label className="text-sm font-medium text-gray-700">Opening Time</label>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-full p-3 border rounded-lg mt-1"
            />
          </div>

          {/* Closing Time */}
          <div>
            <label className="text-sm font-medium text-gray-700">Closing Time</label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full p-3 border rounded-lg mt-1"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="text-sm font-medium text-gray-700">Capacity Per Slot</label>
            <input
              type="number"
              value={capacity}
              min={1}
              max={50}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full p-3 border rounded-lg mt-1"
            />
          </div>
        </div>

      </div>

      {/* SLOT GRID */}
      <div>
        <h2 className="text-xl font-bold mb-4">Generated Slots</h2>

        {slots.length === 0 && (
          <p className="text-gray-600">Adjust opening & closing time to generate slots.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 transition-all ${getSlotColor(
                slot.booked,
                slot.capacity
              )}`}
            >
              <div className="text-sm font-semibold mb-1">
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </div>
              <div className="text-xs text-gray-600">
                {slot.booked}/{slot.capacity} booked
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
