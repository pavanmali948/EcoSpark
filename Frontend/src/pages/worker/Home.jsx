import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';
import { subscribePumpUpdates } from '../../utils/realtimeClient';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { formatWallClockTo12h, formatIsoInstantIST } from '../../utils/timeFormat';

const theme = themeClasses.emerald;

const WorkerHome = () => {
  const navigate = useNavigate();
  const [pendingPreview, setPendingPreview] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorText, setErrorText] = useState('');

  const loadQueue = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const res = await api.get('/slot-records/get-pending-slots', { params: {} });
      if (res.data?.success) {
        const list = res.data.data || [];
        setPendingCount(list.length);
        setPendingPreview(list.slice(0, 5));
        setErrorText('');
      }
    } catch (err) {
      setErrorText(getApiErrorMessage(err, 'Failed to load queue'));
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const t = setInterval(loadQueue, 15000);
    return () => clearInterval(t);
  }, [loadQueue]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return undefined;
    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      return undefined;
    }
    if (!user.licenseNo || !user.token) return undefined;
    return subscribePumpUpdates(user.licenseNo, user.token, (msg) => {
      if (msg?.type === 'PUMP_UPDATED') loadQueue();
    });
  }, [loadQueue]);

  const formatSlotRange = (start, end) => {
    const a = formatWallClockTo12h(String(start || '').slice(0, 8));
    const b = formatWallClockTo12h(String(end || '').slice(0, 8));
    if (a === '—' || b === '—') return '—';
    return `${a} – ${b}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Worker Dashboard</h1>
          <p className="text-gray-600">Verify customer bookings and watch the live pump queue.</p>
          {errorText && <p className="text-sm text-red-600 mt-2">{errorText}</p>}
        </div>

        <Card className={`border-0 shadow-xl rounded-2xl mb-8 bg-gradient-to-r ${theme.gradient} text-white overflow-hidden`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <QrCode className="w-8 h-8" />
                  Scan Customer QR Code
                </h2>
                <p className="text-white/90 mb-6">
                  Verify customer bookings quickly by scanning their QR code
                </p>
                <Button
                  onClick={() => navigate('/worker/scanQR')}
                  className="bg-emerald-900 text-white hover:bg-emerald-800 font-semibold px-6 py-3 rounded-xl"
                >
                  Start Scanning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <QrCode className="w-20 h-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${theme.bg} rounded-full flex items-center justify-center`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Pending in queue</p>
              <p className="text-4xl font-bold text-gray-800 mb-2">{pendingCount}</p>
              <p className="text-xs text-gray-500">
                Refreshes when customers book or slots are verified
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Shown below</p>
              <p className="text-4xl font-bold text-gray-800 mb-2">5 max</p>
              <p className="text-xs text-gray-500">Latest pending bookings preview</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Live updates</p>
              <p className="text-4xl font-bold text-gray-800 mb-2">On</p>
              <p className="text-xs text-gray-500">WebSocket + periodic sync</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-white/50 border-b border-gray-100">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${theme.text}`} />
                Latest pending bookings
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/worker/customersHandled')}
                className="text-emerald-600 hover:text-emerald-700"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pendingPreview.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-2">No pending bookings right now</p>
                <p className="text-sm text-gray-400 mb-6">
                  When users book at your pump, they will show up here in real time
                </p>
                <Button
                  onClick={() => navigate('/worker/scanQR')}
                  className={`bg-gradient-to-r ${theme.gradient} hover:opacity-90`}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPreview.map((row, index) => (
                  <div
                    key={`${row.qrCode || row.slotRecordId}-${index}`}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-xl border border-amber-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${theme.bg} rounded-full flex items-center justify-center`}>
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{row.vehicleNumber || '—'}</p>
                        <p className="text-sm text-gray-600">{row.pumpName || 'Pump'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Slot {formatSlotRange(row.slotStart, row.slotEnd)} IST
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-700">Pending</p>
                      <p className="text-xs text-gray-500">Booked {formatIsoInstantIST(row.bookedAt)} IST</p>
                    </div>
                  </div>
                ))}

                {pendingCount > 5 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate('/worker/customersHandled')}
                  >
                    View all {pendingCount} in queue
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerHome;
