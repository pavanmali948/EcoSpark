import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar,
  Settings
} from 'lucide-react';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';
import { subscribePumpUpdates } from '../../utils/realtimeClient';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import PopupMessage from '../../components/PopupMessage';
import { formatWallClockTo12h } from '../../utils/timeFormat';

const theme = themeClasses.emerald;

const pad2 = (n) => String(n).padStart(2, '0');

function hhmmTo24From12(h12, minute, ampm) {
  let h = Number(h12);
  const m = Number(minute);
  if (Number.isNaN(h) || Number.isNaN(m)) return '00:00';
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${pad2(h)}:${pad2(m)}`;
}

function parse24To12Parts(hhmm) {
  const raw = (hhmm || '09:00').slice(0, 5);
  const [hs, ms] = raw.split(':');
  const H = Number(hs || 0);
  const M = Number(ms || 0);
  const ampm = H >= 12 ? 'PM' : 'AM';
  const h12 = H % 12 || 12;
  return { h12, m: M, ampm };
}

function TimeSelect12h({ label, value, onChange, disabled }) {
  const { h12, m, ampm } = parse24To12Parts(value);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const selClass = `flex-1 min-w-[4.5rem] px-2 py-2.5 rounded-lg border ${theme.border} bg-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none`;

  return (
    <div>
      {label ? <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span> : null}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className={selClass}
          value={h12}
          disabled={disabled}
          aria-label={`${label} hour`}
          onChange={(e) => onChange(hhmmTo24From12(e.target.value, m, ampm))}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-gray-400 font-medium">:</span>
        <select
          className={selClass}
          value={m}
          disabled={disabled}
          aria-label={`${label} minute`}
          onChange={(e) => onChange(hhmmTo24From12(h12, e.target.value, ampm))}
        >
          {minutes.map((mm) => (
            <option key={mm} value={mm}>
              {pad2(mm)}
            </option>
          ))}
        </select>
        <select
          className={`${selClass} min-w-[5.5rem]`}
          value={ampm}
          disabled={disabled}
          aria-label={`${label} AM or PM`}
          onChange={(e) => onChange(hhmmTo24From12(h12, m, e.target.value))}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

function ManageSlots() {
  // Pump settings
  const [pumpSettings, setPumpSettings] = useState({
    openingTime: '06:00',
    closingTime: '22:00',
    defaultCapacity: 10
  });

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingIntervals, setExistingIntervals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');
  const [slotStats, setSlotStats] = useState([]);
  const [errorText, setErrorText] = useState('');
  const [popup, setPopup] = useState({ open: false, title: 'Message', message: '', variant: 'info' });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const pumpLicenseNo = user.licenseNo || user.identifier;

  const fetchSlotStats = async () => {
    if (!pumpLicenseNo) return;
    const res = await api.get(`/pumps/${encodeURIComponent(pumpLicenseNo)}/slots`);
    if (res.data?.success) {
      setSlotStats(res.data.data || []);
    }
  };

  // Fetch existing intervals
  useEffect(() => {
    const fetchExistingIntervals = async () => {
      try {
        const [res, settingsRes] = await Promise.all([
          api.get('/pumps/slots'),
          api.get('/pumps/settings'),
        ]);
        if (res.data?.success) {
          setExistingIntervals(res.data.data || []);
        }
        if (settingsRes.data?.success) {
          const s = settingsRes.data.data || {};
          setPumpSettings((prev) => ({
            ...prev,
            openingTime: (s.openingTime || prev.openingTime).slice(0, 5),
            closingTime: (s.closingTime || prev.closingTime).slice(0, 5),
          }));
        }
        await fetchSlotStats();
        setErrorText('');
      } catch (err) {
        console.error('Failed to fetch existing intervals', err);
        setErrorText(getApiErrorMessage(err, 'Failed to fetch slot data'));
      }
    };
    fetchExistingIntervals();
  }, [pumpLicenseNo]);

  useEffect(() => {
    if (!pumpLicenseNo || !user?.token) return undefined;
    return subscribePumpUpdates(pumpLicenseNo, user.token, (msg) => {
      if (msg?.type === 'PUMP_UPDATED') {
        Promise.all([api.get('/pumps/slots'), fetchSlotStats()])
          .then(([intervalRes]) => {
            if (intervalRes.data?.success) {
              setExistingIntervals(intervalRes.data.data || []);
            }
            setErrorText('');
          })
          .catch((err) => {
            setErrorText(getApiErrorMessage(err, 'Failed to refresh slots'));
          });
      }
    });
  }, [pumpLicenseNo, user?.token]);

  // Generate slots from existing intervals
  const generateSlots = () => {
    const newSlots = existingIntervals.map(interval => {
      const startStr = String(interval.start ?? '');
      const endStr = String(interval.end ?? '');
      const startTime = (startStr.match(/\d{2}:\d{2}/) || [startStr.slice(0, 5)])[0];
      const endTime = (endStr.match(/\d{2}:\d{2}/) || [endStr.slice(0, 5)])[0];
      const slotId = `slot_${interval.intervalId}`;
      const live = slotStats.find(s => String(s.id) === String(interval.intervalId));
      
      // Check if slot already exists to preserve settings
      const existingSlot = slots.find(s => s.id === slotId);
      
      return {
        id: slotId,
        startTime,
        endTime,
        capacity: existingSlot?.capacity || pumpSettings.defaultCapacity,
        booked: live?.bookedCount ?? existingSlot?.booked ?? 0,
        isEnabled: existingSlot?.isEnabled !== undefined ? existingSlot.isEnabled : true
      };
    });
    setSlots(newSlots);
  };

  // Update slots when existing intervals change
  useEffect(() => {
    generateSlots();
  }, [existingIntervals, slotStats, pumpSettings.defaultCapacity]);

  // Update all slot capacities when default capacity changes
  useEffect(() => {
    setSlots(prevSlots =>
      prevSlots.map(slot => ({
        ...slot,
        capacity: pumpSettings.defaultCapacity
      }))
    );
  }, [pumpSettings.defaultCapacity]);

  // Get slot status color
  const getSlotColor = (slot) => {
    if (!slot.isEnabled) {
      return 'bg-gray-200 border-gray-300';
    }

    const percentage = (slot.booked / slot.capacity) * 100;

    if (percentage >= 100) {
      return 'bg-red-100 border-red-300';
    } else if (percentage >= 60) {
      return 'bg-yellow-100 border-yellow-300';
    } else {
      return 'bg-green-100 border-green-300';
    }
  };

  const getSlotStatusText = (slot) => {
    if (!slot.isEnabled) return 'Disabled';

    const percentage = (slot.booked / slot.capacity) * 100;

    if (percentage >= 100) return 'Full';
    if (percentage >= 60) return '60%+';
    return 'Available';
  };

  const getSlotStatusIcon = (slot) => {
    if (!slot.isEnabled) {
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }

    const percentage = (slot.booked / slot.capacity) * 100;

    if (percentage >= 100) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    } else if (percentage >= 60) {
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const handleCapacityChange = (slotId, newCapacity) => {
    setSlots(slots.map(slot =>
      slot.id === slotId ? { ...slot, capacity: parseInt(newCapacity) || 0 } : slot
    ));
  };

  const toggleSlotEnabled = (slotId) => {
    setSlots(slots.map(slot =>
      slot.id === slotId ? { ...slot, isEnabled: !slot.isEnabled } : slot
    ));
  };

  const addNewSlot = async () => {
    if (!newSlotStart || !newSlotEnd) {
      setPopup({ open: true, title: 'Validation', message: 'Please enter both start and end times', variant: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/pumps/slots', {
        start: newSlotStart + ':00',
        end: newSlotEnd + ':00'
      });
      
      // Refresh intervals
      const [res] = await Promise.all([
        api.get('/pumps/slots'),
        fetchSlotStats()
      ]);
      if (res.data.success) {
        setExistingIntervals(res.data.data);
      }
      
      setNewSlotStart('09:00');
      setNewSlotEnd('10:00');
      setErrorText('');
    } catch (err) {
      console.error('Failed to add slot', err);
      const message = getApiErrorMessage(err, 'Failed to add slot');
      setPopup({ open: true, title: 'Add Slot failed', message, variant: 'error' });
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/pumps/settings', {
        openingTime: `${pumpSettings.openingTime}:00`,
        closingTime: `${pumpSettings.closingTime}:00`,
      });

      // Create new intervals that don't exist
      for (const slot of slots) {
        const startTime = slot.startTime + ':00'; // Add seconds
        const endTime = slot.endTime + ':00';
        
        const exists = existingIntervals.some(interval => 
          interval.start === startTime && interval.end === endTime
        );
        
        if (!exists) {
          await api.post('/pumps/slots', {
            start: startTime,
            end: endTime
          });
        }
      }
      
      // Refresh existing intervals
      const [res] = await Promise.all([
        api.get('/pumps/slots'),
        fetchSlotStats()
      ]);
      if (res.data.success) {
        setExistingIntervals(res.data.data);
      }
      
      setPopup({ open: true, title: 'Saved', message: 'Slots saved successfully!', variant: 'success' });
      setErrorText('');
    } catch (err) {
      console.error('Failed to save slots', err);
      const message = getApiErrorMessage(err, 'Failed to save slots');
      setPopup({ open: true, title: 'Save failed', message, variant: 'error' });
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <PopupMessage
        open={popup.open}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
      />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Slots</h1>
          <p className="text-gray-600">Configure pump hours, slot capacity, and availability</p>
          {errorText && (
            <p className="text-sm text-red-600 mt-2">{errorText}</p>
          )}
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className={`w-5 h-5 ${theme.text}`} />
            Pump Settings
          </h2>

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold text-amber-900 mb-1">Indian Standard Time (IST)</p>
            <p>
              Station <strong>opening / closing</strong> is your storefront window for accepting bookings.
              <strong> Slot intervals</strong> are the customer time windows—use the same 12-hour clock so they
              never drift from what you configured. Values are saved as wall-clock times (IST).
            </p>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                Station opens
              </div>
              <TimeSelect12h
                label=""
                value={pumpSettings.openingTime}
                onChange={(v) => setPumpSettings({ ...pumpSettings, openingTime: v })}
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                Station closes
              </div>
              <TimeSelect12h
                label=""
                value={pumpSettings.closingTime}
                onChange={(v) => setPumpSettings({ ...pumpSettings, closingTime: v })}
                disabled={loading}
              />
            </div>

            {/* Default Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Default Capacity
                </div>
              </label>
              <input
                type="number"
                value={pumpSettings.defaultCapacity}
                onChange={(e) => setPumpSettings({ ...pumpSettings, defaultCapacity: parseInt(e.target.value) || 0 })}
                min="1"
                max="50"
                className={`w-full px-4 py-3 rounded-lg border ${theme.border} focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none`}
              />
            </div>

            {/* Pump open/closed toggle removed */}

          </div>

          {/* Date Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Date
              </div>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full md:w-64 px-4 py-3 rounded-lg border ${theme.border} focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none`}
            />
          </div>
        </div>

        {/* Add New Slot Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className={`w-5 h-5 ${theme.text}`} />
            Add New Slot
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TimeSelect12h
              label="Slot starts"
              value={newSlotStart}
              onChange={setNewSlotStart}
              disabled={loading}
            />
            <TimeSelect12h
              label="Slot ends"
              value={newSlotEnd}
              onChange={setNewSlotEnd}
              disabled={loading}
            />
            <div className="flex items-end">
              <button
                onClick={addNewSlot}
                disabled={loading}
                className={`${theme.bg} ${theme.hover} text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2`}
              >
                <Save className="w-5 h-5" />
                Add Slot
              </button>
            </div>
          </div>
        </div>

        {/* Slots Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Available Slots ({slots.length} slots)</h2>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`${theme.bg} ${theme.hover} text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50`}
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Available (0-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
              <span className="text-sm text-gray-700">Filling Up (60%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-sm text-gray-700">Full (100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-700">Disabled</span>
            </div>
          </div>

          {/* Slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-xl border-2 transition-all ${getSlotColor(slot)}`}
              >
                {/* Slot Time */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-800">
                      {formatWallClockTo12h(slot.startTime)} – {formatWallClockTo12h(slot.endTime)} IST
                    </span>
                  </div>
                  {getSlotStatusIcon(slot)}
                </div>

                {/* Capacity */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 mb-1 block">Capacity</label>
                  <input
                    type="number"
                    value={slot.capacity}
                    onChange={(e) => handleCapacityChange(slot.id, e.target.value)}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none text-sm"
                  />
                </div>

                {/* Bookings */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Booked:</span>
                    <span className="font-semibold">{slot.booked} / {slot.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${(slot.booked / slot.capacity) * 100 >= 100
                        ? 'bg-red-500'
                        : (slot.booked / slot.capacity) * 100 >= 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        }`}
                      style={{ width: `${Math.min((slot.booked / slot.capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status & Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    {getSlotStatusText(slot)}
                  </span>
                  <button
                    onClick={() => toggleSlotEnabled(slot.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${slot.isEnabled
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    {slot.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {slots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No slots generated. Please set opening and closing times.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ManageSlots;
