import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail } from 'lucide-react';
import themeClasses from '../../utils/themeClasses';
import api from '../../utils/api';
import PopupMessage from '../../components/PopupMessage';

const theme = themeClasses.blue;

export default function UserProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: '',
    email: '',
  });

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [popup, setPopup] = useState({ open: false, title: 'Message', message: '', variant: 'info' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const user = JSON.parse(storedUser);
      setProfile({
        username: user.name || user.identifier || '',
        // login identifier for USER role is the registered email (CustomDetailsService loads by email)
        email: user.email || user.identifier || '',
      });
    } catch {
      // ignore
    }
  }, []);

  const showPopup = (title, message, variant = 'error') => {
    setPopup({ open: true, title, message, variant });
  };

  const submitChangePassword = async () => {
    const identifier =
      profile.email ||
      (() => {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          return u.identifier || u.email || '';
        } catch {
          return '';
        }
      })();

    if (!identifier) {
      showPopup('Validation', 'User identifier/email not found. Please log in again.', 'error');
      return;
    }
    if (!currentPassword) return showPopup('Validation', 'Enter your current password.', 'error');
    if (!newPassword) return showPopup('Validation', 'Enter your new password.', 'error');
    if (!confirmPassword) return showPopup('Validation', 'Confirm your new password.', 'error');
    if (newPassword !== confirmPassword) return showPopup('Validation', 'New password and confirmation do not match.', 'error');

    try {
      await api.post('/auth/change-password-user', {
        identifier,
        currentPassword,
        newPassword,
      });
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showPopup('Success', 'Password changed successfully. You can log in with your new password.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password.';
      showPopup('Change Password failed', msg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <PopupMessage
        open={popup.open}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
      />
      <div className="container mx-auto px-0 max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/user/home')}
            className="rounded-full p-2 bg-white shadow-sm border border-blue-100 hover:bg-blue-50 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
          <div className={`${theme.bg} p-7 text-white`}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5" />
              {profile.username || '—'}
            </h2>
            <p className="text-white/80 text-sm mt-1">{profile.email || ''}</p>
          </div>

          <div className="p-7 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Customer Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Username</p>
                    <p className="font-semibold text-gray-900">{profile.username || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{profile.email || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className={`px-5 py-2 rounded-lg font-semibold transition ${theme.bg} ${theme.hover} text-white`}
              >
                Change Password
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Profile shows only the details collected during customer registration.
            </p>
          </div>
        </div>
      </div>

      {changePasswordOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChangePasswordOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-blue-100 shadow-xl overflow-hidden">
            <div className={`${theme.bg} text-white px-5 py-4`}>
              <h2 className="text-lg font-bold">Change Password</h2>
              <p className="text-sm opacity-90 mt-1">Update your account password safely.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full mt-1 p-3 rounded-lg border ${theme.border} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full mt-1 p-3 rounded-lg border ${theme.border} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full mt-1 p-3 rounded-lg border ${theme.border} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitChangePassword}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${theme.bg} ${theme.hover} text-white`}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

