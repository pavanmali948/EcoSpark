import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Fuel, ShieldCheck, ChevronRight } from "lucide-react";
import ROLE_CONFIG from "../utils/ROLE_CONFIG";
import themeClasses from "../utils/themeClasses";
import api from "../utils/api";
import PopupMessage from "../components/PopupMessage";

const SUPER_ADMIN_ROLE = "super_admin";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [popup, setPopup] = useState({
    open: false,
    title: "Message",
    message: "",
    variant: "info",
  });
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    try {
      const user = JSON.parse(stored);
      if (user?.role === SUPER_ADMIN_ROLE && user?.token) {
        navigate("/super-admin/home", { replace: true });
      }
    } catch {
      localStorage.removeItem("user");
    }
  }, [navigate]);

  const activeConfig = ROLE_CONFIG[SUPER_ADMIN_ROLE];
  const theme = themeClasses[activeConfig.color];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!identifier || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    try {
      const response = await api.post("/auth/login", {
        role: "SUPER_ADMIN",
        identifier,
        password,
      });

      if (response.data && response.data.success) {
        const d = response.data.data;
        const userData = {
          role: SUPER_ADMIN_ROLE,
          identifier,
          name: d.workerProfileName || identifier,
          token: d.token,
          timestamp: new Date().toLocaleTimeString(),
        };
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/super-admin/home");
      } else {
        setError(
          response.data.message || "Failed to login. Please check credentials.",
        );
      }
    } catch (err) {
      const responseData = err.response?.data;
      const apiFieldErrors = Array.isArray(responseData?.errors)
        ? responseData.errors
        : [];

      if (apiFieldErrors.length > 0) {
        const nextFieldErrors = apiFieldErrors.reduce((acc, item) => {
          if (item?.field && item?.message) {
            acc[item.field] = item.message;
          }
          return acc;
        }, {});
        setFieldErrors(nextFieldErrors);
      }

      const backendMessage = (responseData?.message || "").toLowerCase();
      if (
        backendMessage.includes("not found") ||
        backendMessage.includes("invalid password")
      ) {
        setError("Invalid email or password");
      } else {
        setError(responseData?.message || "An error occurred during login.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <PopupMessage
        open={popup.open}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
      />
      <div className="flex flex-col lg:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[650px]">
        <div
          className={`hidden lg:flex flex-col justify-between w-2/5 p-12 bg-linear-to-br ${theme.gradient} text-white`}
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Fuel size={26} />
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-2xl font-bold"
              >
                EcoSpark
              </button>
            </div>

            <h2 className="text-4xl font-bold mb-4">
              Portal for {activeConfig.name}s
            </h2>
            <p className="opacity-90">{activeConfig.description}</p>
          </div>
        </div>

        <div className="w-full lg:w-3/5 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <Fuel size={22} className={theme.text} />
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`text-xl font-bold ${theme.text}`}
            >
              EcoSpark
            </button>
          </div>

          <div className="mb-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${theme.bg} text-white`}
            >
              <ShieldCheck size={18} />
              <span className="text-sm font-semibold">{activeConfig.name}</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700">
                {activeConfig.inputLabel}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`w-full mt-1 p-3 rounded-lg border border-gray-300 focus:ring-2 ${theme.ring}`}
                placeholder={activeConfig.inputPlaceholder}
              />
              {fieldErrors.identifier && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.identifier}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 rounded-lg border border-gray-300 focus:ring-2 ${theme.ring}`}
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className={`text-sm font-medium ${theme.text} hover:underline`}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2">
                <ShieldCheck size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 rounded-lg text-white font-semibold flex justify-center gap-2 ${theme.bg} ${theme.hover}`}
            >
              Login <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </div>

      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
          onClick={(e) => e.target === e.currentTarget && setForgotOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3
              id="forgot-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              Reset your password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Self-service password reset is not enabled yet. Contact your
              organization&apos;s deployment administrator or use the database
              recovery process.
            </p>
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
