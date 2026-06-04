import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Fuel,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../utils/api';
import { formatWallClockTo12h } from '../../utils/timeFormat';

const formatDate = (isoLike) => {
  try {
    if (!isoLike) return '—';
    const d = new Date(isoLike);
    if (String(d) === 'Invalid Date') return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

const formatTimeOnly = (timeLike) => {
  try {
    // Expected: "HH:MM" or "HH:MM:SS" (from Java LocalTime#toString)
    const s = String(timeLike || '');
    if (!s.includes(':')) return '—';
    const [hhRaw, mmRaw] = s.split(':');
    const hh = Number(hhRaw);
    const mm = Number(mmRaw);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return '—';
    const period = hh >= 12 ? 'PM' : 'AM';
    const hh12 = hh % 12 || 12;
    return `${hh12}:${String(mm).padStart(2, '0')} ${period}`;
  } catch {
    return '—';
  }
};

const formatTimeRange = (startTimeLike, endTimeLike) => {
  const a = formatTimeOnly(startTimeLike);
  const b = formatTimeOnly(endTimeLike);
  if (a === '—' || b === '—') return '—';
  return `${a} - ${b}`;
};

const statusToBadge = (status) => {
  const st = String(status || '').toLowerCase();
  const config = {
    confirmed: { variant: 'default', className: 'bg-green-500 hover:bg-green-500', label: 'Confirmed' },
    pending: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-500', label: 'Pending' },
    completed: { variant: 'default', className: 'bg-blue-500 hover:bg-blue-500', label: 'Completed' },
    cancelled: { variant: 'destructive', className: 'bg-red-500 hover:bg-red-500', label: 'Cancelled' },
    notcompleted: { variant: 'secondary', className: 'bg-orange-500 hover:bg-orange-500', label: 'Missed' },
  }[st];

  return config ? (
    <Badge className={`${config.className} text-white`}>{config.label}</Badge>
  ) : (
    <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">Pending</Badge>
  );
};

const statusToIcon = (status) => {
  const st = String(status || '').toLowerCase();
  switch (st) {
    case 'confirmed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'notcompleted':
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

export default function UserHome() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');

  const [currentBooking, setCurrentBooking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [historyNonPendingCount, setHistoryNonPendingCount] = useState(0);
  const [historyCompletedCount, setHistoryCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserName(user.name || user.identifier || 'User');
      setErrorText('');
      setLoading(true);

      try {
        const [pendingRes, historyRes] = await Promise.all([
          api.get('/slot-records/get-pending-slots', { params: { userId: user.identifier } }),
          api.get('/slot-records/get-user-slot-history', { params: { userId: user.identifier } }),
        ]);

        const pending = pendingRes.data?.data || [];
        setPendingCount(pending.length || 0);
        const current = pending
          .slice()
          .sort((a, b) => {
            const at = new Date(a.bookedAt || a.slotRecordId || 0).getTime();
            const bt = new Date(b.bookedAt || b.slotRecordId || 0).getTime();
            if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
            return bt - at; // most recent pending first
          })[0];

        const mappedCurrent = current
          ? {
              id: current.slotRecordId,
              pumpName: current.pumpName || '',
              location: current.address || '',
              // Pending slot DTO provides times in `slotStart/slotEnd` but date is derived from `bookedAt`
              date: formatDate(current.bookedAt),
              time: `${formatTimeRange(current.slotStart, current.slotEnd)} IST`,
              status: 'pending',
              vehicleNumber: current.vehicleNumber || '',
            }
          : null;

        const historyPage = historyRes.data?.data;
        const records = historyPage?.content || [];
        const nonPendingRecords = records.filter((r) => String(r.status || '').toLowerCase() !== 'pending');
        setHistoryNonPendingCount(nonPendingRecords.length || 0);
        setHistoryCompletedCount(
          nonPendingRecords.filter((r) => String(r.status || '').toLowerCase() === 'completed').length || 0
        );

        const mappedHistory = nonPendingRecords.slice(0, 4).map((r, index) => {
          const st = String(r.status || '').toLowerCase();
          // The backend history DTO does not include the original booked timestamp,
          // so we show the slot time mapped onto today's date for display.
          const todayISO = new Date().toISOString().slice(0, 10);
          const interval = r.slotInterval || {};
          const startHHmm = String(interval.start || '').slice(0, 5) || '—';
          const endHHmm = String(interval.end || '').slice(0, 5) || '—';

          return {
            id: r.qrCode || r.slotId || `row-${index}`,
            pumpName: r.pumpName || '',
            location: r.address || '',
              date: formatDate(r.createdAt),
            time:
              startHHmm !== '—' && endHHmm !== '—'
                ? `${formatWallClockTo12h(startHHmm)} – ${formatWallClockTo12h(endHHmm)} IST`
                : '—',
            status: st || 'pending',
            vehicleNumber: r.vehicleNumber || '',
          };
        });

        if (!mounted) return;
        setCurrentBooking(mappedCurrent);
        setRecentBookings(mappedHistory);
      } catch (err) {
        console.error('Failed to load user home data', err);
        if (!mounted) return;
        setErrorText(err.response?.data?.message || err.message || 'Failed to load your bookings.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();

    const t = setInterval(() => load(), 12000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mounted = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user]);

  const stats = useMemo(() => {
    const totalBookings = historyNonPendingCount + pendingCount;
    const upcomingBookings = pendingCount;
    const completedBookings = historyCompletedCount;
    return { totalBookings, upcomingBookings, completedBookings };
  }, [pendingCount, historyNonPendingCount, historyCompletedCount]);

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 break-words">
              Welcome, <span className="break-all">{userName}</span>! 👋
            </h1>
            <p className="text-gray-600">Manage your CNG bookings and track your refueling history</p>
          </div>
          <Button
            onClick={() => navigate('/user/bookslot')}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Book New Slot
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.upcomingBookings}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.completedBookings}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {errorText && <p className="text-sm text-red-600">{errorText}</p>}

        {/* Current Booking Section */}
        {currentBooking && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Current Booking
              </h2>
            </div>
            <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{currentBooking.pumpName}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {currentBooking.location}
                        </div>
                      </div>
                      {statusToBadge(currentBooking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{currentBooking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{currentBooking.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Fuel className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">{currentBooking.vehicleNumber}</span>
                      </div>
                      {/* booking id intentionally hidden */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Bookings Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Recent Bookings
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/user/history')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {loading ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center text-gray-600">Loading your bookings...</CardContent>
            </Card>
          ) : recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/user/history')}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{statusToIcon(booking.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-1">{booking.pumpName}</h3>
                              <div className="flex items-center text-gray-600 text-sm mb-2">
                                <MapPin className="w-4 h-4 mr-1" />
                                {booking.location}
                              </div>
                            </div>
                            {statusToBadge(booking.status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Fuel className="w-4 h-4" />
                              <span>{booking.vehicleNumber}</span>
                            </div>
                            {/* booking id intentionally hidden */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recent Bookings</h3>
                <p className="text-gray-500 mb-4">You haven't made any bookings yet</p>
                <Button
                  onClick={() => navigate('/user/bookslot')}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Book Your First Slot
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

