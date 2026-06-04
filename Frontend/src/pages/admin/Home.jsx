import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Users, Car, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../utils/api';
import { subscribePumpUpdates } from '../../utils/realtimeClient';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { getCurrentSubscription } from '../../services/subscriptionService';
import { formatIsoInstantIST, formatWallClockTo12h } from '../../utils/timeFormat';

const AdminHome = () => {
  const [rows, setRows] = useState([]);
  const [workerStats, setWorkerStats] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [errorText, setErrorText] = useState('');

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const pumpLicenseNo = user.licenseNo || user.identifier;

  const loadQueue = useCallback(async () => {
    const [pendingRes, workersRes, subscriptionRes] = await Promise.allSettled([
      api.get('/slot-records/get-pending-slots'),
      api.get('/pump-workers/handled-count-today'),
      getCurrentSubscription(),
    ]);

    let message = '';

    if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.success) {
      setRows(pendingRes.value.data.data || []);
    } else if (pendingRes.status === 'rejected') {
      message = getApiErrorMessage(pendingRes.reason, 'Failed to load pending bookings');
    }

    if (workersRes.status === 'fulfilled' && workersRes.value.data?.success) {
      setWorkerStats(workersRes.value.data.data || []);
    }

    if (subscriptionRes.status === 'fulfilled') {
      setSubscription(subscriptionRes.value || null);
      if (subscriptionRes.value?.status === 'EXPIRED' && !message) {
        message = 'Subscription expired. Please renew from Subscription page.';
      }
    }

    if (message) {
      setErrorText(message);
    } else {
      setErrorText('');
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const t = setInterval(loadQueue, 15000);
    return () => clearInterval(t);
  }, [loadQueue]);

  useEffect(() => {
    if (!pumpLicenseNo || !user?.token) return undefined;
    return subscribePumpUpdates(pumpLicenseNo, user.token, (msg) => {
      if (msg?.type === 'PUMP_UPDATED') {
        loadQueue();
      }
    });
  }, [loadQueue, pumpLicenseNo, user?.token]);

  const groupedBySlot = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      const slotKey = `${String(r.slotStart || '').slice(0, 5)}-${String(r.slotEnd || '').slice(0, 5)}`;
      if (!m.has(slotKey)) m.set(slotKey, []);
      m.get(slotKey).push(r);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const formatSlotGroupTitle = (key) => {
    if (key.length >= 11 && key[5] === '-') {
      const a = key.slice(0, 5);
      const b = key.slice(6);
      return `${formatWallClockTo12h(a)} – ${formatWallClockTo12h(b)}`;
    }
    return key;
  };

  return (
    <div className="p-6 bg-emerald-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Pump Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Live booking queue by slot for your pump.</p>
      {errorText && <p className="text-sm text-red-600 mb-4">{errorText}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Pending bookings</p><p className="text-3xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Slots in queue</p><p className="text-3xl font-bold">{groupedBySlot.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Realtime</p><p className="text-3xl font-bold">On</p></CardContent></Card>
      </div>

      {subscription && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Current Subscription</p>
            <p className="text-xl font-bold text-gray-800">
              {subscription.planName || 'Not Assigned'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {subscription.planName
                ? `Status: ${subscription.status} | Expires: ${subscription.endDate ? formatIsoInstantIST(subscription.endDate) : 'N/A'} (IST)`
                : 'Super admin has not assigned a subscription yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Worker handled count (today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workerStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No workers or no handled customers today yet.</p>
          ) : (
            <div className="space-y-2">
              {workerStats.map((w) => (
                <div key={w.workerId} className="flex items-center justify-between p-3 rounded-lg bg-white border">
                  <span className="font-medium">{w.workerName || w.workerId}</span>
                  <span className="text-emerald-700 font-semibold">{w.handledCount} handled</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {groupedBySlot.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-gray-500">No pending bookings yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {groupedBySlot.map(([slot, list]) => (
            <Card key={slot} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" />{formatSlotGroupTitle(slot)}</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1"><Users className="w-4 h-4" />{list.length} pending</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.map((r) => (
                  <div key={r.slotRecordId} className="p-3 rounded-lg bg-white border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold">{r.vehicleNumber || '—'}</span>
                      <span className="text-sm text-gray-500">{r.customerUsername || 'customer'}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatIsoInstantIST(r.bookedAt)} IST</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHome;

