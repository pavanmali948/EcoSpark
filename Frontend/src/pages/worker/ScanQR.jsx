import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Clock,
  Car,
  Calendar,
  CreditCard,
  Scan,
  Upload,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateQRPayload } from '../../utils/qrUtils';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';
import { formatWallClockTo12h } from '../../utils/timeFormat';

const theme = themeClasses.emerald;

const CAMERA_REGION_ID = 'worker-qr-camera-region';
const FILE_SCAN_REGION_ID = 'worker-qr-file-anchor';

const ScanQR = () => {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [booking, setBooking] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const cancelledRef = useRef(false);
  const handleDecodedRef = useRef(null);

  const interpretQrPayload = useCallback((raw) => {
    const trimmed = String(raw).trim();
    try {
      const o = JSON.parse(trimmed);
      if (o.qrCode && typeof o.qrCode === 'string') {
        return {
          qrCode: o.qrCode,
          vehicleNumber: o.vehicleNumber || '—',
          pumpName: o.pumpName || 'Station',
          slotStart: o.slotStart,
          slotEnd: o.slotEnd,
          bookingNumber: o.bookingNumber,
          dateISO: o.dateISO || new Date().toISOString(),
        };
      }
      const legacy = validateQRPayload(trimmed);
      if (legacy) {
        return {
          qrCode: trimmed,
          vehicleNumber: legacy.vehicleNumber || '—',
          pumpName: legacy.pumpName || 'Station',
          slotStart: legacy.slotStart,
          slotEnd: legacy.slotEnd,
          bookingNumber: legacy.bookingNumber,
          dateISO: legacy.dateISO || new Date().toISOString(),
        };
      }
    } catch {
      /* raw token string from backend */
    }
    if (trimmed.length > 8) {
      return {
        qrCode: trimmed,
        vehicleNumber: '—',
        pumpName: 'Station',
        slotStart: null,
        slotEnd: null,
        bookingNumber: null,
        dateISO: new Date().toISOString(),
      };
    }
    return null;
  }, []);

  const handleScanSuccess = useCallback(
    (qrData) => {
      setScannerActive(false);
      const parsed = interpretQrPayload(qrData);
      if (!parsed) {
        setError('Invalid QR code format');
        setScannedData(null);
        setBooking(null);
        return;
      }

      setScannedData({ ...parsed, rawQrCode: qrData });
      setBooking({
        id: parsed.qrCode.slice(-12),
        vehicleNumber: parsed.vehicleNumber,
        amount: 10,
        pumpName: parsed.pumpName,
        dateISO: parsed.dateISO,
        slotStart: parsed.slotStart,
        slotEnd: parsed.slotEnd,
        bookingNumber: parsed.bookingNumber,
        qrCode: parsed.qrCode,
      });
      setError('');
    },
    [interpretQrPayload]
  );

  handleDecodedRef.current = handleScanSuccess;

  useEffect(() => {
    if (!scannerActive) {
      setCameraLoading(false);
      return undefined;
    }

    cancelledRef.current = false;
    setCameraLoading(true);
    setError('');

    const startCamera = async () => {
      await new Promise((r) => setTimeout(r, 200));
      if (cancelledRef.current) return;

      const region = document.getElementById(CAMERA_REGION_ID);
      if (!region) {
        setError('Scanner container not ready. Try again.');
        setScannerActive(false);
        setCameraLoading(false);
        return;
      }

      const html5QrCode = new Html5Qrcode(CAMERA_REGION_ID, { verbose: false });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1,
      };

      const onSuccess = (decodedText) => {
        if (cancelledRef.current) return;
        handleDecodedRef.current?.(decodedText);
      };
      const onScanError = () => {};

      const cameras = await Html5Qrcode.getCameras();
      /** Prefer rear camera when labels are available (mobile). */
      let cameraConfig;
      if (cameras?.length) {
        const back = cameras.find((c) => /back|rear|environment|wide/i.test(c.label));
        cameraConfig = back ? back.id : cameras[0].id;
      } else {
        cameraConfig = { facingMode: 'environment' };
      }

      await html5QrCode.start(cameraConfig, config, onSuccess, onScanError);

      if (!cancelledRef.current) {
        setCameraLoading(false);
      }
    };

    startCamera().catch((err) => {
      console.error('Camera start failed:', err);
      if (!cancelledRef.current) {
        setError(
          'Camera could not start. Allow camera permission, use HTTPS or localhost, or upload a QR image / paste below.'
        );
        setScannerActive(false);
        setCameraLoading(false);
      }
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear();
        } catch {
          /* ignore */
        }
        html5QrCodeRef.current = null;
      }
    });

    return () => {
      cancelledRef.current = true;
      const instance = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      if (instance) {
        instance
          .stop()
          .then(() => {
            try {
              instance.clear();
            } catch {
              /* ignore */
            }
          })
          .catch(() => {
            try {
              instance.clear();
            } catch {
              /* ignore */
            }
          });
      }
      setCameraLoading(false);
    };
  }, [scannerActive]);

  const startScanner = () => {
    setVerificationResult(null);
    setError('');
    setScannerActive(true);
  };

  const stopScanner = () => {
    setScannerActive(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      setError('Please enter QR code data');
      return;
    }
    handleScanSuccess(manualInput);
    setManualInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setVerificationResult(null);

    try {
      const hidden = document.getElementById(FILE_SCAN_REGION_ID);
      if (!hidden) {
        setError('Scanner not ready.');
        return;
      }

      const reader = new Html5Qrcode(FILE_SCAN_REGION_ID, { verbose: false });
      const text = await reader.scanFile(file, false);
      try {
        reader.clear();
      } catch {
        /* ignore */
      }
      handleScanSuccess(text);
    } catch (err) {
      console.error(err);
      setError('Could not read a QR code from this image. Try a clearer photo or paste the JSON/text.');
    }
  };

  const handleVerifyBooking = async () => {
    if (!booking) return;

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};

      if (!user.licenseNo) {
        setVerificationResult({
          success: false,
          message: 'Station license is missing. Log out and log in again so your pump context loads.',
        });
        return;
      }

      const res = await api.post('/slot-records/verify-slot-booking', {
        qrCode: scannedData?.rawQrCode || booking.qrCode,
        licenseNo: user.licenseNo,
      });

      if (res.data?.success) {
        setVerificationResult({
          success: true,
          message: 'Booking verified successfully!',
        });
        setBooking({
          ...booking,
          verificationStatus: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: user.identifier || 'worker',
        });
      } else {
        setVerificationResult({
          success: false,
          message: res.data?.message || 'Verification failed.',
        });
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message || 'Verification failed';
      const msgLower = String(serverMessage).toLowerCase();
      const normalizedMessage =
        msgLower.includes('qr expired') || msgLower.includes('already used') || msgLower.includes('qr has already')
          ? 'QR already used'
          : serverMessage;
      setVerificationResult({
        success: false,
        message: normalizedMessage,
      });
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setBooking(null);
    setVerificationResult(null);
    setError('');
    setManualInput('');
    setScannerActive(false);
  };

  const formatTimeRange = (startWallClock, endWallClock) => {
    const a = formatWallClockTo12h(startWallClock);
    const b = formatWallClockTo12h(endWallClock);
    if (a === '—' || b === '—') return '—';
    return `${a} – ${b} IST`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      {/* Off-DOM anchor for html5-qrcode file scanning (must exist in document) */}
      <div
        id={FILE_SCAN_REGION_ID}
        className="fixed w-px h-px overflow-hidden opacity-0 pointer-events-none"
        aria-hidden
      />

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Scan className="w-8 h-8 text-emerald-600" />
            Scan QR Code
          </h1>
          <p className="text-gray-600">Verify customer bookings by scanning their QR code</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  QR Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!scannerActive && !scannedData && (
                  <div className="text-center space-y-4">
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Camera className="w-24 h-24 text-gray-300" />
                    </div>
                    <Button
                      type="button"
                      onClick={startScanner}
                      className={`w-full h-12 text-lg bg-gradient-to-r ${theme.gradient} hover:opacity-90 rounded-xl`}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Start camera scanner
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-xl border-emerald-200"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload QR image
                    </Button>
                    <p className="text-xs text-gray-500">
                      Use rear camera on phone, or upload a screenshot of the customer&apos;s QR.
                    </p>
                  </div>
                )}

                {scannerActive && (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-black min-h-[280px] flex items-center justify-center">
                      <div id={CAMERA_REGION_ID} className="w-full" />
                      {cameraLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-2 z-10">
                          <Loader2 className="w-10 h-10 animate-spin" />
                          <span className="text-sm">Starting camera…</span>
                        </div>
                      )}
                    </div>
                    <Button type="button" onClick={stopScanner} variant="outline" className="w-full">
                      Stop scanner
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-white/50 border-b border-gray-100">
                <CardTitle className="text-base">Manual input (backup)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Paste full QR JSON or raw booking code…"
                    className="h-10 font-mono text-sm"
                  />
                  <Button type="submit" variant="outline" className="w-full">
                    Use pasted text
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            {booking ? (
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className={`${theme.bg} text-white`}>
                  <CardTitle>Booking details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-800">{booking.id}</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 ${theme.text} flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Station</p>
                      <p className="font-semibold text-gray-800">{booking.pumpName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Calendar className={`w-5 h-5 ${theme.text} flex-shrink-0`} />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(booking.dateISO).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className={`w-5 h-5 ${theme.text} flex-shrink-0`} />
                      <div>
                        <p className="text-xs text-gray-500">Time slot</p>
                        <p className="text-sm font-medium text-gray-800">
                          {formatTimeRange(booking.slotStart, booking.slotEnd)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Car className={`w-5 h-5 ${theme.text} flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Vehicle number</p>
                      <p className="font-mono font-bold text-lg text-gray-800">{booking.vehicleNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 ${theme.bg} rounded text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1`}
                    >
                      #
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Slot number</p>
                      <p className="font-semibold text-gray-800">#{booking.bookingNumber ?? '—'}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Amount</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">₹{booking.amount}</span>
                    </div>
                  </div>

                  {verificationResult && (
                    <div
                      className={`p-4 rounded-xl border-2 ${
                        verificationResult.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {verificationResult.success ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                        <div>
                          <p
                            className={`font-semibold ${
                              verificationResult.success ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {verificationResult.success ? 'Success!' : 'Failed'}
                          </p>
                          <p
                            className={`text-sm ${
                              verificationResult.success ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {verificationResult.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    {!verificationResult && (
                      <Button
                        type="button"
                        onClick={handleVerifyBooking}
                        className={`w-full h-12 text-lg bg-gradient-to-r ${theme.gradient} hover:opacity-90 rounded-xl`}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Verify booking
                      </Button>
                    )}
                    <Button type="button" onClick={resetScanner} variant="outline" className="w-full">
                      Scan another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg rounded-2xl h-full">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-16 h-16 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No booking scanned</h3>
                  <p className="text-sm text-gray-500">
                    Start the camera, upload a QR image, or paste the code manually
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
