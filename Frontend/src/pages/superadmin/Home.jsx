import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../utils/api';
import { createSubscriptionPlan, getSubscriptionPlans } from '../../services/subscriptionService';
import { X, Users, Building2, HardHat } from 'lucide-react';

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (String(d) === 'Invalid Date') return '—';
  return d.toLocaleDateString();
};

const emptyPumpForm = {
  licenseNo: '',
  pumpName: '',
  streetName: '',
  landmark: '',
  pincode: '',
  latitude: '',
  longitude: '',
  password: '',
};

export default function SuperAdminHome() {
  const [dashboard, setDashboard] = useState(null);
  const [pumps, setPumps] = useState([]);
  const [pumpAdmins, setPumpAdmins] = useState([]);
  const [models, setModels] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [pumpModalMode, setPumpModalMode] = useState(null);
  const [pumpForm, setPumpForm] = useState(emptyPumpForm);
  const [pumpFormSaving, setPumpFormSaving] = useState(false);
  const [editLicenseNo, setEditLicenseNo] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationDays: '' });
  const [planSaving, setPlanSaving] = useState(false);

  const workersByPump = dashboard?.workersByPump ?? [];

  const load = useCallback(async (showPageLoader = false) => {
    setError('');
    if (showPageLoader) {
      setLoading(true);
    }
    try {
      const [dashRes, pumpsRes] = await Promise.all([
        api.get('/super-admin/dashboard'),
        api.get('/super-admin/pump-subscriptions'),
      ]);
      const pumpAdminsRes = await api.get('/super-admin/pump-admins');
      const usersRes = await api.get('/super-admin/users');
      const plansRes = await getSubscriptionPlans();
      setDashboard(dashRes.data?.data || null);
      setPumps(pumpsRes.data?.data || []);
      setPumpAdmins(pumpAdminsRes.data?.data || []);
      setModels(plansRes || []);
      setUsers(usersRes.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load super admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(false), 30000);
    return () => clearInterval(t);
  }, [load]);

  const openAddPump = () => {
    setEditLicenseNo(null);
    setPumpForm(emptyPumpForm);
    setPumpModalMode('add');
  };

  const openEditPump = (p) => {
    setEditLicenseNo(p.licenseNo);
    setPumpForm({
      licenseNo: p.licenseNo,
      pumpName: p.pumpName || '',
      streetName: p.streetName || '',
      landmark: p.landmark || '',
      pincode: String(p.pincode ?? ''),
      latitude: String(p.latitude ?? ''),
      longitude: String(p.longitude ?? ''),
      password: '',
    });
    setPumpModalMode('edit');
  };

  const submitPumpForm = async (e) => {
    e.preventDefault();
    setPumpFormSaving(true);
    setError('');
    try {
      if (pumpModalMode === 'add') {
        const pin = Number(pumpForm.pincode);
        const lat = Number(pumpForm.latitude);
        const lng = Number(pumpForm.longitude);
        if (!pumpForm.licenseNo?.trim() || !pumpForm.password) {
          setError('License number and password are required.');
          return;
        }
        await api.post('/super-admin/pump-admins', {
          licenseNo: pumpForm.licenseNo.trim(),
          pumpName: pumpForm.pumpName.trim(),
          streetName: pumpForm.streetName.trim(),
          landmark: pumpForm.landmark.trim(),
          pincode: pin,
          latitude: lat,
          longitude: lng,
          password: pumpForm.password,
        });
      } else if (pumpModalMode === 'edit' && editLicenseNo) {
        const pin = Number(pumpForm.pincode);
        const lat = Number(pumpForm.latitude);
        const lng = Number(pumpForm.longitude);
        await api.put(`/super-admin/pump-admins/${encodeURIComponent(editLicenseNo)}`, {
          pumpName: pumpForm.pumpName.trim(),
          streetName: pumpForm.streetName.trim(),
          landmark: pumpForm.landmark.trim(),
          pincode: pin,
          latitude: lat,
          longitude: lng,
        });
      }
      setPumpModalMode(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Pump admin save failed');
    } finally {
      setPumpFormSaving(false);
    }
  };

  const confirmDeletePump = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setError('');
    try {
      await api.delete(`/super-admin/pump-admins/${encodeURIComponent(deleteTarget.licenseNo)}`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  };

  const submitPlan = async (e) => {
    e.preventDefault();
    setPlanSaving(true);
    setError('');
    try {
      await createSubscriptionPlan({
        name: planForm.name.trim(),
        price: Number(planForm.price),
        durationDays: Number(planForm.durationDays),
      });
      setPlanModalOpen(false);
      setPlanForm({ name: '', price: '', durationDays: '' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create plan');
    } finally {
      setPlanSaving(false);
    }
  };

  const roleCard = {
    user: 'border-l-4 border-l-sky-500 bg-sky-50/80',
    pumpAdmin: 'border-l-4 border-l-emerald-500 bg-emerald-50/80',
    worker: 'border-l-4 border-l-amber-500 bg-amber-50/80',
  };

  const badge = {
    user: 'bg-sky-600 text-white',
    pumpAdmin: 'bg-emerald-600 text-white',
    worker: 'bg-amber-600 text-white',
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-rose-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
            <p className="text-gray-600">System analytics, user control, and pump subscriptions</p>
          </div>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={load}>
            Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/90 px-4 py-3 flex flex-wrap gap-4 items-center text-sm text-gray-700">
          <span className="font-medium text-gray-900">Legend:</span>
          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${badge.user}`}>
            <Users className="w-3.5 h-3.5" /> End users
          </span>
          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${badge.pumpAdmin}`}>
            <Building2 className="w-3.5 h-3.5" /> Pump admins
          </span>
          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${badge.worker}`}>
            <HardHat className="w-3.5 h-3.5" /> Workers (by station)
          </span>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        {loading ? (
          <Card>
            <CardContent className="p-6 text-gray-600">Loading dashboard...</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Active Pump Admins</p>
                  <p className="text-2xl font-bold">{dashboard?.activePumpAdmins ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="text-2xl font-bold">{dashboard?.users ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Workers</p>
                  <p className="text-2xl font-bold">{dashboard?.workers ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{dashboard?.totalBookings ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50/40">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Pump subscriptions</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Includes Razorpay enrollments and legacy super-admin assignments. &quot;Active&quot; means the
                      pump has remaining paid or assigned days.
                    </p>
                  </div>
                  <Button
                    onClick={() => setPlanModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shrink-0"
                  >
                    Add catalogue plan
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pumps.map((p) => {
                    const active = (p.remainingDays ?? 0) > 0;
                    return (
                      <div
                        key={p.licenseNo}
                        className={`rounded-2xl border p-4 shadow-sm bg-white ${
                          active ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900">{p.pumpName}</p>
                            <p className="text-xs font-mono text-gray-500">{p.licenseNo}</p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <dt className="text-gray-500">Plan</dt>
                            <dd className="font-medium text-gray-900">{p.subscriptionName || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Days left</dt>
                            <dd className="font-medium text-gray-900">{p.remainingDays ?? 0}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-gray-500">Period start</dt>
                            <dd className="font-medium text-gray-900">{fmtDate(p.subscriptionStartDate)}</dd>
                          </div>
                        </dl>
                        <p className="text-xs text-gray-500 mt-3">
                          Pump admins renew from their in-app{' '}
                          <strong>Subscription</strong> checkout (syncs here automatically).
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 border-t border-purple-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalogue (super-admin models)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="font-bold text-gray-900">{m.name}</p>
                        <p className="text-2xl font-bold text-purple-700 mt-2">
                          ₹{m.price}
                          <span className="text-sm font-normal text-gray-500"> / {m.durationDays}d</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Assignable to pumps from admin tools.</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className={`overflow-hidden ${roleCard.user}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-sky-700" />
                    <h2 className="text-lg font-semibold text-gray-900">End users</h2>
                    <span className={`text-xs px-2 py-0.5 rounded ${badge.user}`}>Customer</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Registered customers (view only)</p>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {users.map((u) => (
                      <div
                        key={u.userId}
                        className="border border-sky-200/60 bg-white rounded-lg p-3 shadow-sm"
                      >
                        <p className="font-semibold text-gray-800">{u.username}</p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`overflow-hidden xl:col-span-2 ${roleCard.pumpAdmin}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-700" />
                      <h2 className="text-lg font-semibold text-gray-900">Pump admins</h2>
                      <span className={`text-xs px-2 py-0.5 rounded ${badge.pumpAdmin}`}>Station</span>
                    </div>
                    <Button
                      onClick={openAddPump}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      Add pump admin
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {pumpAdmins.map((p) => (
                      <div
                        key={p.licenseNo}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-emerald-200/60 bg-white rounded-lg p-3 shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {p.pumpName} ({p.licenseNo})
                          </p>
                          <p className="text-sm text-gray-600">
                            {p.streetName}, {p.landmark} - {p.pincode}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Subscription: {p.subscriptionName || '—'} · {p.remainingDays ?? 0} days left
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => openEditPump(p)}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => setDeleteTarget({ licenseNo: p.licenseNo, pumpName: p.pumpName })}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className={roleCard.worker}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HardHat className="w-5 h-5 text-amber-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Workers by station</h2>
                  <span className={`text-xs px-2 py-0.5 rounded ${badge.worker}`}>Staff</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Headcount registered under each pump license (from dashboard)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {workersByPump.length === 0 ? (
                    <p className="text-sm text-gray-600 col-span-full">No worker data yet.</p>
                  ) : (
                    workersByPump.map((row) => (
                      <div
                        key={row.licenseNo}
                        className="border border-amber-200/60 bg-white rounded-lg p-3 shadow-sm"
                      >
                        <p className="font-semibold text-gray-800">{row.pumpName}</p>
                        <p className="text-xs text-gray-500 font-mono">{row.licenseNo}</p>
                        <p className="text-sm text-amber-800 mt-2">
                          <span className="font-bold text-lg">{row.workerCount}</span> workers
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add / Edit pump admin */}
      {pumpModalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
          onClick={(e) => e.target === e.currentTarget && !pumpFormSaving && setPumpModalMode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 flex items-center justify-between gap-2 px-5 py-4 border-b bg-emerald-50/90">
              <h3 className="text-lg font-semibold text-gray-900">
                {pumpModalMode === 'add' ? 'Add pump admin' : 'Edit pump admin'}
              </h3>
              <button
                type="button"
                disabled={pumpFormSaving}
                onClick={() => setPumpModalMode(null)}
                className="p-2 rounded-lg hover:bg-emerald-100 text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitPumpForm} className="p-5 space-y-3">
              {pumpModalMode === 'add' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600">License number</label>
                    <Input
                      value={pumpForm.licenseNo}
                      onChange={(e) => setPumpForm((f) => ({ ...f, licenseNo: e.target.value }))}
                      required
                      className="mt-1"
                      placeholder="e.g. PUMP-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Initial password</label>
                    <Input
                      type="password"
                      value={pumpForm.password}
                      onChange={(e) => setPumpForm((f) => ({ ...f, password: e.target.value }))}
                      required
                      className="mt-1"
                      placeholder="6–20 chars, uppercase, digit, symbol"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Must include an uppercase letter, a digit, and a special character.
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600">Pump name</label>
                <Input
                  value={pumpForm.pumpName}
                  onChange={(e) => setPumpForm((f) => ({ ...f, pumpName: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Street name</label>
                <Input
                  value={pumpForm.streetName}
                  onChange={(e) => setPumpForm((f) => ({ ...f, streetName: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Landmark</label>
                <Input
                  value={pumpForm.landmark}
                  onChange={(e) => setPumpForm((f) => ({ ...f, landmark: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Pincode</label>
                  <Input
                    type="number"
                    value={pumpForm.pincode}
                    onChange={(e) => setPumpForm((f) => ({ ...f, pincode: e.target.value }))}
                    required
                    className="mt-1"
                    min={100000}
                    max={999999}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={pumpForm.latitude}
                    onChange={(e) => setPumpForm((f) => ({ ...f, latitude: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={pumpForm.longitude}
                    onChange={(e) => setPumpForm((f) => ({ ...f, longitude: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={pumpFormSaving}
                  onClick={() => setPumpModalMode(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={pumpFormSaving}
                >
                  {pumpFormSaving ? 'Saving…' : pumpModalMode === 'add' ? 'Create' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
          onClick={(e) => e.target === e.currentTarget && !deleteBusy && setDeleteTarget(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" role="dialog">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete pump admin?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove <strong>{deleteTarget.pumpName}</strong> ({deleteTarget.licenseNo}). Workers must be
              removed first or the server will reject the delete.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteBusy}
                onClick={confirmDeletePump}
              >
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add subscription plan */}
      {planModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
          onClick={(e) => e.target === e.currentTarget && !planSaving && setPlanModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" role="dialog">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New subscription plan</h3>
              <button
                type="button"
                disabled={planSaving}
                onClick={() => setPlanModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitPlan} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Plan name</label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="mt-1"
                  placeholder="e.g. Quarterly"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Price (₹)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={planForm.price}
                  onChange={(e) => setPlanForm((f) => ({ ...f, price: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Duration (days)</label>
                <Input
                  type="number"
                  min={1}
                  value={planForm.durationDays}
                  onChange={(e) => setPlanForm((f) => ({ ...f, durationDays: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" disabled={planSaving} onClick={() => setPlanModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={planSaving}>
                  {planSaving ? 'Creating…' : 'Create plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
