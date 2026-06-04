import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail } from 'lucide-react';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';

const theme = themeClasses.orange;

const decodeJwtSub = (token) => {
  try {
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length < 2) return '';
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const json = JSON.parse(atob(padded));
    return json?.sub ? String(json.sub) : '';
  } catch {
    return '';
  }
};

export default function WorkerProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    workerId: '',
    workerName: '',
    email: '',
  });
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const load = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      let user;
      try {
        user = JSON.parse(storedUser);
      } catch {
        return;
      }

      const tokenWorkerId = decodeJwtSub(user.token);
      const workerId = tokenWorkerId || user.identifier || '';

      // Start with best-effort local data; then reconcile from API (source of truth).
      setProfile((p) => ({
        ...p,
        workerId,
        workerName: user.name || user.identifier || '',
        email: user.email || '',
      }));

      if (!workerId) return;

      try {
        const res = await api.get('/pump-workers/list');
        const list = res?.data?.data || [];
        const found = list.find((w) => String(w.workerId) === String(workerId));
        if (found) {
          setProfile({
            workerId: found.workerId || workerId,
            workerName: found.workerName || user.name || workerId,
            email: found.email || user.email || '',
          });
        }
      } catch {
        setErrorText('Failed to load worker email/details. Please try again.');
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="container mx-auto px-0 max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/worker/home')}
            className="rounded-full p-2 bg-white shadow-sm border border-orange-100 hover:bg-orange-50 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
          <div className={`${theme.bg} p-7 text-white`}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5" />
              {profile.workerName || '—'}
            </h2>
            <p className="text-white/80 text-sm mt-1">{profile.email || ''}</p>
          </div>

          <div className="p-7 space-y-6">
            {errorText && <p className="text-sm text-red-600">{errorText}</p>}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Worker Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <User className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Worker ID</p>
                    <p className="font-semibold text-gray-900">{profile.workerId || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{profile.email || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Worker profile is personalized using the logged-in account details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

