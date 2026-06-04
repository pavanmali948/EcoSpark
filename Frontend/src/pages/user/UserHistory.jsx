import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  MapPin,
  Clock,
  Calendar,
  X,
  Car,
  CreditCard,
  Download,
  QrCode
} from "lucide-react";

import React from "react";
import themeClasses from "../../utils/themeClasses";
import api from "../../utils/api";

const theme = themeClasses.blue;

function combineDateAndTime(timeVal, dateISO) {
  const d = dateISO || new Date().toISOString().slice(0, 10);
  if (timeVal == null) return `${d}T00:00:00`;
  if (typeof timeVal === "string") {
    const part = timeVal.length >= 5 ? timeVal.slice(0, 5) : timeVal;
    return `${d}T${part}:00`;
  }
  if (Array.isArray(timeVal) && timeVal.length >= 2) {
    const h = String(timeVal[0]).padStart(2, "0");
    const m = String(timeVal[1]).padStart(2, "0");
    return `${d}T${h}:${m}:00`;
  }
  if (typeof timeVal === "object" && timeVal.hour !== undefined) {
    const h = String(timeVal.hour).padStart(2, "0");
    const m = String(timeVal.minute ?? 0).padStart(2, "0");
    return `${d}T${h}:${m}:00`;
  }
  return `${d}T00:00:00`;
}

function mapHistoryRecord(r, index) {
  const interval = r.slotInterval || {};
  const dateISO = new Date().toISOString().slice(0, 10);
  const slotStart = combineDateAndTime(interval.start, dateISO);
  const slotEnd = combineDateAndTime(interval.end, dateISO);
  const st = String(r.status || "").toLowerCase();
  const statusMap = {
    pending: "pending",
    completed: "completed",
    cancelled: "cancelled",
  };
  const status = statusMap[st] || st || "pending";
  return {
    id: r.qrCode || r.slotId || `row-${index}`,
    pumpName: r.pumpName || "CNG station",
    location: r.address || "",
    dateISO,
    slotStart,
    slotEnd,
    status,
    vehicleNumber: r.vehicleNumber || "—",
    bookingNumber: index + 1,
    amount: 10,
    qrPayload: r.qrCode,
  };
}

const formatTimeRange = (startISO, endISO) => {
  if (!startISO || !endISO) return "N/A";
  const opts = { hour: "numeric", minute: "numeric" };
  const start = new Date(startISO).toLocaleTimeString([], opts);
  const end = new Date(endISO).toLocaleTimeString([], opts);
  return `${start} - ${end}`;
};

function UserHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = React.useState([]);
  const [selectedBooking, setSelectedBooking] = React.useState(null);

  // Load bookings from backend
  const loadBookings = React.useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      const res = await api.get(`/slot-records/get-user-slot-history`, {
        params: { userId: user.identifier }
      });
      
      if (res.data?.success) {
        const records = res.data.data.content || [];
        setHistory(records.map(mapHistoryRecord));
      }
    } catch (err) {
      console.error("Failed to load user history", err);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  React.useEffect(() => {
    const t = setInterval(() => loadBookings(), 20000);
    return () => clearInterval(t);
  }, [loadBookings]);

  // Reload bookings when window gains focus (e.g., after booking)
  React.useEffect(() => {
    const handleFocus = () => {
      loadBookings();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadBookings]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-[#1AB759]" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-[#1AB759]" />;
      case "pending":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "no-show":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return (
          <span className="px-3 py-1 bg-[#1AB759] text-white text-xs rounded-full">
            Verified
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-[#1AB759] text-white text-xs rounded-full">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">
            Cancelled
          </span>
        );
      case "no-show":
        return (
          <span className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-full">
            No Show
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">

      {/* HEADER */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/user")}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-2xl">Booking History</h1>
              <p className="text-sm text-gray-600">View your past bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* STAT CARDS */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl shadow-lg bg-white p-6 text-center">
            <div className={`text-3xl ${theme.text} mb-1`}>{history.length}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="rounded-2xl shadow-lg bg-white p-6 text-center">
            <div className={`text-3xl ${theme.text} mb-1`}>
              {history.filter(h => h.status === "completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="rounded-2xl shadow-lg bg-white p-6 text-center">
            <div className="text-3xl text-red-500 mb-1">
              {history.filter(h => h.status === "cancelled").length}
            </div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No bookings found.</div>
          ) : (
            history.map((booking, index) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="rounded-2xl shadow-lg bg-white p-6 hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-start space-x-4">

                  {/* Timeline Indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center`}>
                      {getStatusIcon(booking.status)}
                    </div>

                    {index < history.length - 1 && (
                      <div className={`w-0.5 h-full ${theme.bg} mt-2`}></div>
                    )}
                  </div>

                  {/* Booking Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg">{booking.pumpName || "Unknown Station"}</h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {booking.location}
                        </div>
                      </div>

                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(booking.dateISO).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTimeRange(booking.slotStart, booking.slotEnd)}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

      </div>


      {/* DETAIL SIDE PANEL */}
      {selectedBooking && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
            onClick={() => setSelectedBooking(null)}
          ></div>

          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto">

            {/* Header */}
            <div className={`${theme.bg} p-6 text-white sticky top-0 z-10`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="hover:bg-white/20 rounded-full p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">ID:</span>
                <span className="text-white font-mono text-sm">{selectedBooking.id}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Status</label>
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedBooking.status)}
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Station Info */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-3 block">Station Details</label>
                <div className={`${theme.lightBg} p-4 rounded-xl border ${theme.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{selectedBooking.pumpName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedBooking.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Booking Information */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-3 block">Booking Information</label>
                <div className="space-y-3">

                  {/* Date */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className={`w-5 h-5 ${theme.text}`} />
                      <span className="text-sm text-gray-600">Date</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedBooking.dateISO).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className={`w-5 h-5 ${theme.text}`} />
                      <span className="text-sm text-gray-600">Time Slot</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatTimeRange(selectedBooking.slotStart, selectedBooking.slotEnd)}
                    </span>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className={`w-5 h-5 ${theme.text}`} />
                      <span className="text-sm text-gray-600">Vehicle</span>
                    </div>
                    <span className="font-semibold text-gray-900 font-mono">{selectedBooking.vehicleNumber}</span>
                  </div>

                  {/* Slot Number */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 ${theme.bg} rounded text-white flex items-center justify-center text-xs font-bold`}>
                        #
                      </div>
                      <span className="text-sm text-gray-600">Slot Number</span>
                    </div>
                    <span className="font-semibold text-gray-900">#{selectedBooking.bookingNumber}</span>
                  </div>

                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Payment */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-3 block">Payment</label>
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Amount Paid</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">₹{selectedBooking.amount}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* QR Code Display */}
              {selectedBooking.qrDataURL && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-3 block">Booking QR Code</label>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-dashed border-blue-200">
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-3 rounded-lg shadow-md mb-3">
                        <img
                          src={selectedBooking.qrDataURL}
                          alt="Booking QR Code"
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600 mb-3">
                        Show this QR code to the worker at the pump
                      </p>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = selectedBooking.qrDataURL;
                          a.download = `booking_${selectedBooking.id}.png`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        }}
                        className={`w-full ${theme.bg} ${theme.hover} text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm`}
                      >
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Status */}
              {selectedBooking.verificationStatus === 'verified' && selectedBooking.verifiedAt && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-3 block">Verification</label>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-700">Service Completed</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Verified on {new Date(selectedBooking.verifiedAt).toLocaleString()}
                    </p>
                    {selectedBooking.verifiedBy && (
                      <p className="text-xs text-gray-500 mt-1">
                        By: {selectedBooking.verifiedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {(selectedBooking.status === "completed" || selectedBooking.status === "verified") && (
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      navigate("/user/bookslot");
                    }}
                    className={`w-full ${theme.bg} ${theme.hover} text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}
                  >
                    <RotateCcw className="w-5 h-5" />
                    Book Again at This Station
                  </button>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserHistory;

