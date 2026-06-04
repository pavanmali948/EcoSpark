// Booking.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CreditCard, Car, Calendar, CheckCircle, Download, Copy, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import api from "../utils/api";
import { subscribePumpUpdates } from "../utils/realtimeClient";
import getApiErrorMessage from "../utils/getApiErrorMessage";
import PopupMessage from "./PopupMessage";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";
import { formatTimeRangeIST } from "../utils/timeFormat";

const formatSlotLabel = (s) => {
  const r = formatTimeRangeIST(s.startISO, s.endISO);
  return r === '—' ? r : `${r} IST`;
};

const todayISODate = () => new Date().toISOString().slice(0, 10);

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function BookingPage() {
  const { pumpId } = useParams();
  const navigate = useNavigate();
  const pid = pumpId || "demo";

  const [pump, setPump] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [amount, setAmount] = useState(10); // mock price
  const [isPaying, setIsPaying] = useState(false);
  const [qrDataURL, setQrDataURL] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [popup, setPopup] = useState({ open: false, title: 'Message', message: '', variant: 'info' });

  const showPopup = (title, message, variant = 'error') => {
    setPopup({ open: true, title, message, variant });
  };

  useEffect(() => {
    const fetchPumpAndSlots = async () => {
      try {
        // Fetch pump details
        const pumpsRes = await api.get("/pumps");
        const found = pumpsRes.data?.data?.find(p => p.id === pid);
        if (found) {
          setPump({ id: found.id, name: found.name });
        } else {
          setPump({ id: pid, name: `Pump #${pid}` });
        }

        // Fetch slots
        const slotsRes = await api.get(`/pumps/${encodeURIComponent(pid)}/slots`);
        if (slotsRes.data?.success) {
          setSlots(slotsRes.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching pump or slots", err);
        setSlots([]);
        setErrorText(getApiErrorMessage(err, "Failed to load pump slots"));
      }
    };
    fetchPumpAndSlots();
  }, [pid]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr || !pid) return undefined;
    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      return undefined;
    }
    if (!user?.token) return undefined;
    const off = subscribePumpUpdates(pid, user.token, (msg) => {
      if (msg?.type === "PUMP_UPDATED" && msg.licenseNo === pid) {
        (async () => {
          try {
            const slotsRes = await api.get(`/pumps/${encodeURIComponent(pid)}/slots`);
            if (slotsRes.data?.success) {
              setSlots(slotsRes.data.data || []);
              setErrorText("");
            }
          } catch (e) {
            setErrorText(getApiErrorMessage(e, "Failed to refresh slots"));
          }
        })();
      }
    });
    return off;
  }, [pid]);

  const refreshSlotsFromStorage = async () => {
    try {
      const slotsRes = await api.get(`/pumps/${encodeURIComponent(pid)}/slots`);
      if (slotsRes.data?.success) {
        setSlots(slotsRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorText(getApiErrorMessage(err, "Failed to refresh slots"));
    }
  };

  const availableSlots = slots.filter(
    (s) => s.status === "open" && s.bookedCount < s.maxCapacity
  );

  // pick slot
  const selectSlot = (slotId) => {
    setSelectedSlotId(slotId);
    setQrDataURL("");
    setBookingSuccess(null);
  };

  const payAndBook = async () => {
    if (!selectedSlotId) {
      showPopup('Validation', 'Select a slot first.');
      return;
    }
    if (!vehicleNumber) {
      showPopup('Validation', 'Enter your vehicle number.');
      return;
    }

    const slot = slots.find((s) => String(s.id) === String(selectedSlotId));
    if (!slot) {
      showPopup('Booking failed', 'Slot not found. Please refresh and try again.');
      return;
    }
    if (slot.status !== "open") {
      showPopup('Booking failed', 'This slot is not available now.');
      return;
    }
    if (slot.bookedCount >= slot.maxCapacity) {
      showPopup('Booking failed', 'Slot is full.');
      return;
    }

    setIsPaying(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) {
        showPopup("Payment failed", "Unable to load Razorpay checkout.");
        setIsPaying(false);
        return;
      }

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const customerId = user ? user.identifier : "";
      const order = await createPaymentOrder({
        amount,
        customerId,
        slotId: slot.id,
        licenseNo: pid,
        vehicleNumber,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || order.key,
        amount: order.amount,
        currency: "INR",
        name: "CNG Slot Booking",
        description: "Slot booking payment",
        order_id: order.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              customerId,
              slotId: slot.id,
              licenseNo: pid,
              vehicleNumber,
            });

            if (verifyRes?.paymentStatus !== "SUCCESS") {
              showPopup("Payment failed", "Payment verification failed.");
              return;
            }

            const bookingNumber = (slot.bookedCount || 0) + 1;
            const qrImage = verifyRes.qrCodeBase64
              ? `data:image/png;base64,${verifyRes.qrCodeBase64}`
              : "";
            setQrDataURL(qrImage);
            setBookingSuccess({
              id: verifyRes.bookingId,
              qrCode: verifyRes.bookingId,
              pumpName: pump.name,
              vehicleNumber,
              dateISO: slot.date || todayISODate(),
              slotStart: slot.startISO,
              slotEnd: slot.endISO,
              bookingNumber,
            });
            await refreshSlotsFromStorage();
          } catch (err) {
            showPopup("Booking failed", getApiErrorMessage(err, "Payment verification failed."), "error");
          } finally {
            setIsPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        showPopup("Payment failed", "Transaction was not completed.");
        setIsPaying(false);
      });
      rzp.open();
    } catch (err) {
      showPopup("Payment failed", getApiErrorMessage(err, "Unable to create payment order."), "error");
      setIsPaying(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataURL) return;
    const a = document.createElement("a");
    a.href = qrDataURL;
    a.download = `booking_${bookingSuccess?.id || Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyBooking = async () => {
    try {
      // Copy the QR data payload (more useful than full object)
      const qrPayload = {
        qrCode: bookingSuccess.qrCode,
        bookingId: bookingSuccess.id,
        vehicleNumber: bookingSuccess.vehicleNumber,
        pumpName: bookingSuccess.pumpName,
        slotStart: bookingSuccess.slotStart,
        slotEnd: bookingSuccess.slotEnd,
        bookingNumber: bookingSuccess.bookingNumber,
        dateISO: bookingSuccess.dateISO,
      };

      await navigator.clipboard.writeText(JSON.stringify(qrPayload, null, 2));
      setCopySuccess(true);

      // Reset after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      showPopup('Copy failed', 'Failed to copy booking details. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 p-6">
      <PopupMessage
        open={popup.open}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
      />
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full hover:bg-white/50"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Book Slot</h1>
              <p className="text-gray-600">{pump?.name || `Pump #${pid}`}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Slots & Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Slot Selection */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-[#2E7CF6]" />
                  Select Time Slot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {errorText && (
                  <div className="col-span-full text-red-600 text-sm mb-3">{errorText}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No slots available for this pump.
                    </div>
                  ) : (
                    slots.map((s) => {
                      const isDisabled =
                        s.status !== "open" || s.bookedCount >= s.maxCapacity;

                      const isSelected = String(selectedSlotId) === String(s.id);

                      return (
                        <button
                          key={s.id}
                          onClick={() => selectSlot(s.id)}
                          disabled={isDisabled}
                          className={`
                            relative p-4 rounded-xl border text-left transition-all
                            ${isDisabled
                              ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                              : isSelected
                                ? "bg-blue-50 border-[#2E7CF6] shadow-md ring-1 ring-[#2E7CF6]"
                                : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                            }
                          `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`font-semibold ${isSelected ? "text-[#2E7CF6]" : "text-gray-700"}`}>
                              {formatSlotLabel(s)}
                            </span>
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#2E7CF6]" />}
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <div className="text-gray-500">
                              {s.bookedCount}/{s.maxCapacity} booked
                            </div>
                            <Badge
                              variant={isDisabled ? "secondary" : isSelected ? "default" : "outline"}
                              className={`
                                  ${isDisabled
                                  ? "bg-gray-200 text-gray-500"
                                  : isSelected
                                    ? "bg-[#2E7CF6] hover:bg-[#2E7CF6]"
                                    : "text-green-600 border-green-200 bg-green-50"
                                }
                                `}
                            >
                              {isDisabled ? (s.status === "full" ? "Full" : "Closed") : "Available"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Booking Details Form */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-white/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-[#1AB759]" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Vehicle Number</label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH-01-AB-1234"
                    className="h-12 text-lg uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your registration number correctly</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Booking Fee</span>
                    <span>₹{amount}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-lg text-gray-900 border-t pt-2">
                    <span>Total Payable</span>
                    <span>₹{amount}</span>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right Column: Actions / QR */}
          <div className="lg:col-span-1 space-y-6">

            {/* Pay Button / Status */}
            {!bookingSuccess ? (
              <Card className="border-0 shadow-lg rounded-2xl bg-white sticky top-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Pump</span>
                      <span className="font-medium text-right truncate max-w-[150px]">{pump?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Slot</span>
                      <span className="font-medium">
                        {selectedSlotId
                          ? formatSlotLabel(
                              slots.find((s) => String(s.id) === String(selectedSlotId)) || {}
                            )
                          : "Not selected"}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={payAndBook}
                    disabled={isPaying || !selectedSlotId || !vehicleNumber}
                    className="w-full h-12 text-lg bg-gradient-to-r from-[#1AB759] to-[#2E7CF6] hover:opacity-90 transition-opacity rounded-xl"
                  >
                    {isPaying ? "Processing..." : `Pay ₹${amount} & Book`}
                  </Button>

                  {!selectedSlotId && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-orange-500 bg-orange-50 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      Please select a slot first
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg rounded-2xl bg-white overflow-hidden sticky top-6">
                <div className="bg-[#1AB759] p-4 text-center text-white">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="font-bold text-lg">Booking Confirmed!</h3>
                </div>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="bg-white p-2 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                    {qrDataURL ? (
                      <img
                        src={qrDataURL}
                        alt="Booking QR"
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-gray-400">Loading QR...</div>
                    )}
                  </div>

                  <div className="text-sm font-medium text-gray-800 mb-1">{bookingSuccess.id}</div>
                  <div className="text-xs text-gray-500 mb-6">Show this QR at the station</div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button variant="outline" onClick={downloadQR} className="w-full flex gap-2">
                      <Download className="w-4 h-4" /> Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyBooking}
                      className={`w-full flex gap-2 transition-all ${copySuccess ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <Button variant="ghost" className="mt-4 w-full text-gray-500" onClick={() => navigate("/user/history")}>
                    View in History
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Hint */}
            <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Note
              </p>
              Arrive 5 minutes before your slot time. Late arrivals may be cancelled.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
