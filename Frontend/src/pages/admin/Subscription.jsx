import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  createSubscriptionOrder,
  getCurrentSubscription,
  getSubscriptionPlans,
  verifySubscription,
} from "../../services/subscriptionService";
import { Check, Shield, Sparkles, Zap } from "lucide-react";
import { formatDateIST, formatIsoInstantIST } from "../../utils/timeFormat";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const tierVisual = (index, total) => {
  if (total <= 1) return { ring: "ring-2 ring-emerald-400/60", badge: "Popular", icon: Sparkles };
  if (index === 0) return { ring: "ring-2 ring-slate-300", badge: "Starter", icon: Shield };
  if (index === total - 1) return { ring: "ring-2 ring-amber-400/80", badge: "Best value", icon: Zap };
  return { ring: "ring-1 ring-emerald-200", badge: null, icon: Sparkles };
};

export default function AdminSubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedPlanId, setFocusedPlanId] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const pumpAdminId = user?.licenseNo || user?.identifier;

  const loadData = async () => {
    const [planRes, currentRes] = await Promise.all([getSubscriptionPlans(), getCurrentSubscription()]);
    setPlans(planRes || []);
    setActive(currentRes || null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const subscribe = async (planId) => {
    setLoading(true);
    setFocusedPlanId(planId);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) return;
      const order = await createSubscriptionOrder({ planId, pumpAdminId });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || order.key,
        amount: order.amount,
        currency: "INR",
        name: "EcoSpark — Pump Subscription",
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await verifySubscription({
              planId,
              pumpAdminId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await loadData();
          } finally {
            setLoading(false);
            setFocusedPlanId(null);
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setLoading(false);
        setFocusedPlanId(null);
      });
      rzp.open();
    } catch {
      setLoading(false);
      setFocusedPlanId(null);
    }
  };

  const isActive = active?.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Billing</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Subscription &amp; plans</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Choose a plan to keep your pump live on EcoSpark. Pricing is shown upfront—same flow shoppers expect
            on modern marketplaces.
          </p>
        </div>

        {active && (
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Current subscription</p>
                <p className="text-2xl font-bold mt-1">{active.planName || "—"}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/25">
                    {active.status || "UNKNOWN"}
                  </Badge>
                  {active.startDate && (
                    <span className="text-sm text-white/85">
                      Since {formatDateIST(active.startDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-100">Renews / ends</p>
                <p className="text-xl font-semibold">
                  {active.endDate ? `${formatIsoInstantIST(active.endDate)} IST` : "—"}
                </p>
                {!isActive && (
                  <p className="text-sm text-amber-200 mt-2">Renew below to restore platform access.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, idx) => {
            const tier = tierVisual(idx, plans.length);
            const Icon = tier.icon;
            const perDay =
              plan.durationDays > 0 ? (plan.price / plan.durationDays).toFixed(2) : null;

            return (
              <Card
                key={plan.id}
                className={`relative border-0 shadow-xl rounded-2xl overflow-hidden bg-white flex flex-col ${tier.ring}`}
              >
                {tier.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-900 text-white">
                      {tier.badge}
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2 pt-8">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">{plan.name || `Plan ${plan.id}`}</CardTitle>
                  <p className="text-sm text-slate-500 font-normal mt-1">
                    Full access to bookings, workers, and slot tools for your station.
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-2 pb-8 px-6">
                  <div className="mb-6">
                    <p className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                      <span className="text-slate-500 text-sm">/ {plan.durationDays} days</span>
                    </p>
                    {perDay && (
                      <p className="text-xs text-slate-400 mt-1">About ₹{perDay} / day</p>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 mb-8 flex-1">
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      Live booking queue &amp; QR verification
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      Worker roles &amp; slot management
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      Priority listing during active subscription
                    </li>
                  </ul>
                  <Button
                    onClick={() => subscribe(plan.id)}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-semibold shadow-md"
                  >
                    {loading && focusedPlanId === plan.id ? "Processing…" : "Subscribe securely"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
            <CardContent className="p-12 text-center text-slate-600">
              No plans available yet. Your super admin can add plans from the dashboard.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
