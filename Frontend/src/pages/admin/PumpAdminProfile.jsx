import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../utils/api';
import themeClasses from '../../utils/themeClasses';

const theme = themeClasses.emerald;

export default function PumpAdminProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [pump, setPump] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setErrorText('Not logged in.');
      setLoading(false);
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      setErrorText('Invalid session.');
      setLoading(false);
      return;
    }

    const licenseNo = user.licenseNo || user.identifier;
    if (!licenseNo) {
      setErrorText('Pump license not found.');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const res = await api.get('/pumps');
        const found = res.data?.data?.find((p) => String(p.id) === String(licenseNo));
        setPump(found || null);
      } catch (err) {
        console.error('Failed to load pump profile', err);
        setErrorText('Failed to load pump profile.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-emerald-50 min-h-screen">
        <p className="text-gray-700">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-emerald-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Pump Admin Profile</h1>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-100" onClick={() => navigate('/admin/home')}>
            Back to Dashboard
          </Button>
        </div>

        {errorText && <p className="text-red-600">{errorText}</p>}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Pump</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pump Name</p>
                <p className="text-lg font-semibold">{pump?.name || '—'}</p>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${theme.bg} text-white`}>
                Pump Admin
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="text-gray-900 font-medium">{pump?.id || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900 font-medium">{pump?.location || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-gray-900 font-medium">{pump?.rating || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Coordinates</p>
                <p className="text-gray-900 font-medium">
                  {pump ? `${pump.latitude}, ${pump.longitude}` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

