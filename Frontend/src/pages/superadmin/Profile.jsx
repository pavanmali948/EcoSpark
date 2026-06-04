import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { getSubscriptionPlans } from '../../services/subscriptionService';

export default function SuperAdminProfile() {
  const [userInfo, setUserInfo] = useState(null);
  const [models, setModels] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const local = JSON.parse(localStorage.getItem('user') || '{}');
      setUserInfo(local);
      const plans = await getSubscriptionPlans();
      setModels(plans || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load profile');
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-br from-rose-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Super Admin Profile</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card>
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-semibold text-gray-800">{userInfo?.role || 'super_admin'}</p>
            <p className="text-sm text-gray-500 mt-2">Login Identifier</p>
            <p className="font-semibold text-gray-800">{userInfo?.identifier || 'superadmin@ecospark.com'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold mb-3">Subscription Plans (Live Demo)</h2>
            <div className="space-y-2">
              {models.map((m) => (
                <div key={m.id} className="border rounded-lg p-3">
                  <p className="font-semibold text-gray-800">{m.name}</p>
                  <p className="text-sm text-gray-600">
                    Duration: {m.durationDays} days | Amount: Rs {m.price}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
