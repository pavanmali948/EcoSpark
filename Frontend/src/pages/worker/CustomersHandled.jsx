import React, { useState, useEffect, useCallback } from 'react';
import {
  XCircle,
  Users,
  Calendar,
  Clock,
  Car,
  MapPin,
  CreditCard,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';
import { subscribePumpUpdates } from '../../utils/realtimeClient';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

const theme = themeClasses.emerald;

function mapApiToRow(p, index) {
  return {
    bookingId: p.slotRecordId || p.qrCode || `b-${index}`,
    vehicleNumber: p.vehicleNumber || '—',
    pumpName: p.pumpName || 'Station',
    address: p.address || '',
    bookedAt: p.bookedAt || new Date().toISOString(),
    slotStart: p.slotStart,
    slotEnd: p.slotEnd,
    qrCode: p.qrCode,
    amount: 10,
  };
}

const CustomersHandled = () => {
  const [handledQueue, setHandledQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [errorText, setErrorText] = useState('');

  const loadHandled = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const res = await api.get('/slot-records/get-completed-slots');
      if (res.data?.success) {
        const rows = (res.data.data || []).map(mapApiToRow);
        setHandledQueue(rows);
        setErrorText('');
      }
    } catch (err) {
      setErrorText(getApiErrorMessage(err, 'Failed to load handled customers'));
    }
  }, []);

  useEffect(() => {
    loadHandled();
    const t = setInterval(loadHandled, 15000);
    return () => clearInterval(t);
  }, [loadHandled]);

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
      if (msg?.type === 'PUMP_UPDATED') loadHandled();
    });
  }, [loadHandled]);

  const formatTimeRange = (startT, endT) => {
    if (!startT || !endT) return 'N/A';
    const opts = { hour: 'numeric', minute: 'numeric' };
    const d = new Date().toISOString().slice(0, 10);
    const start = new Date(`${d}T${String(startT).slice(0, 5)}:00`).toLocaleTimeString([], opts);
    const end = new Date(`${d}T${String(endT).slice(0, 5)}:00`).toLocaleTimeString([], opts);
    return `${start} - ${end}`;
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const filtered = handledQueue.filter((booking) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (booking.vehicleNumber || '').toLowerCase().includes(q) ||
      String(booking.bookingId).toLowerCase().includes(q) ||
      (booking.pumpName || '').toLowerCase().includes(q) ||
      (booking.qrCode || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterDate === 'all') return true;

    const bookedDate = new Date(booking.bookedAt).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    if (filterDate === 'today') return bookedDate === today;

    return true;
  });

  const todayCount = handledQueue.filter((b) => {
    const bookedDate = new Date(b.bookedAt).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return bookedDate === today;
  }).length;

  const totalAmount = filtered.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-600" />
            Customers handled
          </h1>
          <p className="text-gray-600">
            Completed bookings verified by staff at your station
          </p>
          {errorText && <p className="text-sm text-red-600 mt-2">{errorText}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Handled total</p>
                  <p className="text-3xl font-bold text-gray-800">{handledQueue.length}</p>
                </div>
                <div className={`w-12 h-12 ${theme.bg} rounded-full flex items-center justify-center`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Handled today</p>
                  <p className="text-3xl font-bold text-gray-800">{todayCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Listed total (fee)</p>
                  <p className="text-3xl font-bold text-gray-800">₹{totalAmount}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by vehicle, QR, or station..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 h-12 rounded-xl border border-gray-200 bg-white px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-white/50 border-b border-gray-100">
            <CardTitle className="flex items-center justify-between">
              <span>Handled bookings ({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No handled bookings</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchQuery ? 'Try adjusting your search filters' : 'Verified customers will appear here automatically'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((booking, index) => (
                  <div
                    key={`${booking.bookingId}-${index}`}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 ${theme.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800">
                              #{String(booking.bookingId).slice(-8)}
                            </h3>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                              Handled
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Car className="w-4 h-4" />
                              <span className="font-mono font-semibold">{booking.vehicleNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{booking.pumpName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(booking.bookedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                {booking.slotStart && booking.slotEnd
                                  ? formatTimeRange(booking.slotStart, booking.slotEnd)
                                  : formatTime(booking.bookedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Fee</p>
                        <p className="text-2xl font-bold text-green-600">₹{booking.amount || 0}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Booked: {new Date(booking.bookedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomersHandled;
