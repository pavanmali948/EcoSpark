import React, { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Edit,
  Trash2,
  Save,
  X,
  Loader2
} from 'lucide-react';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';
import PopupMessage from '../../components/PopupMessage';

const theme = themeClasses.emerald;

export default function ManageWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [popup, setPopup] = useState({ open: false, title: 'Message', message: '', variant: 'info' });

  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const title = useMemo(() => (editingWorker ? 'Edit Worker' : 'Add New Worker'), [editingWorker]);

  const [formData, setFormData] = useState({
    workerName: '',
    email: '',
    password: ''
  });

  const getWorkersCacheKey = (licenseNo) => `pump_workers_cache_${licenseNo || 'unknown'}`;

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  const readCachedWorkers = () => {
    const user = getCurrentUser();
    const licenseNo = user?.licenseNo || user?.identifier;
    if (!licenseNo) return [];
    try {
      const raw = localStorage.getItem(getWorkersCacheKey(licenseNo));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCachedWorkers = (nextWorkers) => {
    const user = getCurrentUser();
    const licenseNo = user?.licenseNo || user?.identifier;
    if (!licenseNo) return;
    try {
      localStorage.setItem(getWorkersCacheKey(licenseNo), JSON.stringify(nextWorkers || []));
    } catch {
      // Ignore cache write failures (quota/private mode).
    }
  };

  const loadWorkers = async () => {
    setLoading(true);
    setErrorText('');
    const cachedWorkers = readCachedWorkers();
    if (cachedWorkers.length > 0) {
      setWorkers(cachedWorkers);
    }
    try {
      const user = getCurrentUser();
      const licenseNo = user?.licenseNo || user?.identifier;
      const res = await api.get('/pump-workers/list', {
        params: licenseNo ? { licenseNo } : {},
      });
      if (res.data?.success) {
        const nextWorkers = res.data.data || [];
        setWorkers(nextWorkers);
        writeCachedWorkers(nextWorkers);
      } else {
        setErrorText(res.data?.message || 'Failed to fetch workers.');
      }
    } catch (err) {
      console.error('Failed to fetch workers', err);
      setErrorText(err.response?.data?.message || err.message || 'Failed to fetch workers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const openAddModal = () => {
    setEditingWorker(null);
    setFormData({ workerName: '', email: '', password: '' });
    setShowModal(true);
  };

  const openEditModal = (worker) => {
    setEditingWorker(worker);
    setFormData({
      workerName: worker.workerName || '',
      email: worker.email || '',
      password: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWorker(null);
    setFormData({ workerName: '', email: '', password: '' });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.workerName || !formData.workerName.trim()) return 'Worker name is required.';
    if (!formData.email || !formData.email.trim()) return 'Email is required.';
    if (!formData.email.includes('@')) return 'Please enter a valid email address.';

    if (!editingWorker) {
      if (!formData.password) return 'Password is required.';
      if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    } else if (formData.password && formData.password.length < 6) {
      return 'Password must be at least 6 characters (or leave blank).';
    }

    return '';
  };

  const handleAddWorker = async () => {
    const msg = validate();
    if (msg) {
      setPopup({ open: true, title: 'Validation', message: msg, variant: 'error' });
      return;
    }

    const user = getCurrentUser() || {};
    const licenseNo = user.licenseNo || user.identifier;

    if (!licenseNo) {
      setPopup({
        open: true,
        title: 'Session expired',
        message: 'Pump license not found. Please log in again.',
        variant: 'error',
      });
      return;
    }

    try {
      const payload = {
        licenseNo,
        workerName: formData.workerName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      const res = await api.post('/auth/register-pump-workers', payload);
      if (!res.data?.success) {
        setPopup({
          open: true,
          title: 'Add Worker failed',
          message: res.data?.message || 'Failed to add worker.',
          variant: 'error',
        });
        return;
      }

      const createdWorker = {
        workerId: res.data?.data || `temp-${Date.now()}`,
        workerName: payload.workerName,
        email: payload.email,
        createdAt: new Date().toISOString(),
      };
      setWorkers((prev) => {
        const exists = prev.some((w) => w.workerId === createdWorker.workerId);
        const next = exists ? prev : [createdWorker, ...prev];
        writeCachedWorkers(next);
        return next;
      });
      closeModal();
      await loadWorkers();
    } catch (err) {
      console.error('Error adding worker', err);
      setPopup({
        open: true,
        title: 'Add Worker failed',
        message: err.response?.data?.message || err.message || 'Error adding worker.',
        variant: 'error',
      });
    }
  };

  const handleEditWorker = async () => {
    if (!editingWorker) return;
    const msg = validate();
    if (msg) {
      setPopup({ open: true, title: 'Validation', message: msg, variant: 'error' });
      return;
    }

    try {
      const payload = {
        workerId: editingWorker.workerId,
        workerName: formData.workerName.trim(),
        email: formData.email.trim(),
        password: formData.password // optional; blank means "keep current"
      };

      const res = await api.put('/pump-workers/update-creds', payload);
      if (!res.data?.success) {
        setPopup({
          open: true,
          title: 'Update failed',
          message: res.data?.message || 'Failed to update worker.',
          variant: 'error',
        });
        return;
      }

      closeModal();
      setWorkers((prev) => {
        const next = prev.map((w) => (
          w.workerId === editingWorker.workerId
            ? { ...w, workerName: payload.workerName, email: payload.email }
            : w
        ));
        writeCachedWorkers(next);
        return next;
      });
      await loadWorkers();
    } catch (err) {
      console.error('Error updating worker', err);
      setPopup({
        open: true,
        title: 'Update failed',
        message: err.response?.data?.message || err.message || 'Error updating worker.',
        variant: 'error',
      });
    }
  };

  const handleDeleteWorker = async (worker) => {
    if (!worker?.workerId) return;
    if (!window.confirm('Are you sure you want to delete this worker?')) return;

    try {
      const res = await api.delete('/pump-workers/delete-worker', {
        params: { workerId: worker.workerId }
      });
      if (!res.data?.success) {
        setPopup({
          open: true,
          title: 'Delete failed',
          message: res.data?.message || 'Failed to delete worker.',
          variant: 'error',
        });
        return;
      }
      setWorkers((prev) => {
        const next = prev.filter((w) => w.workerId !== worker.workerId);
        writeCachedWorkers(next);
        return next;
      });
      await loadWorkers();
    } catch (err) {
      console.error('Error deleting worker', err);
      setPopup({
        open: true,
        title: 'Delete failed',
        message: err.response?.data?.message || err.message || 'Error deleting worker.',
        variant: 'error',
      });
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Workers</h1>
            <p className="text-gray-600">Add, edit, and manage worker accounts</p>
          </div>
          <button
            onClick={openAddModal}
            className={`${theme.bg} ${theme.hover} text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2`}
          >
            <UserPlus className="w-5 h-5" />
            Add New Worker
          </button>
        </div>

        {errorText && <p className="mb-6 text-red-600">{errorText}</p>}

        {/* Workers Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${theme.bg} text-white`}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Worker ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Worker Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading workers...
                    </td>
                  </tr>
                ) : workers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <p>No workers found. Add your first worker to get started.</p>
                    </td>
                  </tr>
                ) : (
                  workers.map((worker, index) => (
                    <tr key={worker.workerId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 ${theme.bg} rounded-full flex items-center justify-center`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">{worker.workerId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{worker.workerName || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {worker.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {worker.createdAt
                          ? new Date(worker.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(worker)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                            title="Edit Worker"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorker(worker)}
                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                            title="Delete Worker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Worker Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className={`${theme.bg} p-6 text-white rounded-t-2xl`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{title}</h3>
                  <button onClick={closeModal} className="hover:bg-white/20 rounded-full p-2 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Worker Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Worker Name
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.workerName}
                    onChange={(e) => handleInputChange('workerName', e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="worker@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </div>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={editingWorker ? 'Leave blank to keep current password' : 'Min. 6 characters'}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                  {editingWorker ? (
                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password.</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Temporary password will be used for the worker.</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingWorker ? handleEditWorker : handleAddWorker}
                    className={`flex-1 ${theme.bg} ${theme.hover} text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2`}
                  >
                    <Save className="w-5 h-5" />
                    {editingWorker ? 'Update Worker' : 'Add Worker'}
                  </button>
                  <button onClick={closeModal} className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

