import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  User,
  Fuel,
  Key,
  Mail,
  MapPin,
  Navigation,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import ROLE_CONFIG from "../utils/ROLE_CONFIG";
import themeClasses from "../utils/themeClasses";
import api from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");

  // Set initial role from URL parameter, fallback to "user"
  const allowedRoles = ["user", "worker", "pump_admin"];

const [currentRole, setCurrentRole] = useState(
  allowedRoles.includes(roleFromUrl) ? roleFromUrl : "user"
);

  // Update role when URL parameter changes
  useEffect(() => {
  const roleParam = searchParams.get("role");

  if (["user", "worker", "pump_admin"].includes(roleParam)) {
    setCurrentRole(roleParam);
  }
}, [searchParams]);

  // Registration state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPumpName, setRegPumpName] = useState("");
  const [regLicense, setRegLicense] = useState("");
  const [regLocation, setRegLocation] = useState({ lat: "", lng: "" });

  // Shared password
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const activeConfig = ROLE_CONFIG[currentRole];
  const theme = themeClasses[activeConfig.color];

  // -------------------------------------------------------------
  // Get GPS location
  // -------------------------------------------------------------
  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegLocation({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setIsGettingLocation(false);
      },
      () => {
        setError("Unable to get location.");
        setIsGettingLocation(false);
      }
    );
  };

  // -------------------------------------------------------------
  // Submit registration
  // -------------------------------------------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (currentRole === "user") {
        if (!regUsername || !regEmail || !password) {
          setError("Please fill in all user registration fields.");
          setIsLoading(false);
          return;
        }

        const payload = {
          username: regUsername.trim(),
          email: regEmail.trim(),
          password,
        };
        console.debug("[Register] POST /auth/register-user", {
          ...payload,
          password: "[redacted]",
        });

        const res = await api.post("/auth/register-user", payload);

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Registration failed");
        }
      } else if (currentRole === "pump_admin") {
        if (!regPumpName || !regLicense || !password || !regLocation.lat) {
          setError("Please complete all Pump Admin fields including Location.");
          setIsLoading(false);
          return;
        }

        const res = await api.post("/auth/register-pump", {
          licenseNo: regLicense,
          pumpName: regPumpName,
          streetName: "Self-Registered",
          landmark: "Self-Registered",
          pincode: 100000,
          latitude: parseFloat(regLocation.lat),
          longitude: parseFloat(regLocation.lng),
          password: password
        });

        if (!res.data.success) {
          throw new Error(res.data.message);
        }
      } else {
        setError("Registration not supported for this role.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg("Account created successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        navigate(`/login?role=${currentRole}`);
      }, 1500);

    } catch (err) {
      console.error("[Register] failed", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      const responseData = err.response?.data;
      const apiFieldErrors = Array.isArray(responseData?.errors) ? responseData.errors : [];

      if (apiFieldErrors.length > 0) {
        const nextFieldErrors = apiFieldErrors.reduce((acc, item) => {
          if (item?.field && item?.message) {
            acc[item.field] = item.message;
          }
          return acc;
        }, {});
        setFieldErrors(nextFieldErrors);
      }

      const status = err.response?.status;
      let message =
        responseData?.message || err.message || "Registration failed. Please check your inputs.";

      if (status === 503 || message.toLowerCase().includes("database")) {
        message =
          "Server cannot reach the database. Start MySQL on localhost:3306, create database cng_booking, and check Backend application.properties (root/root).";
      } else if (status === 500 && message === "Internal server error") {
        message =
          "Server error during registration. Check the backend console — usually MySQL password or connection.";
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[650px]">
        {/* LEFT PANEL */}
        <div
          className={`hidden lg:flex flex-col justify-between w-2/5 p-12 bg-linear-to-br ${theme.gradient} text-white`}
        >
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Fuel size={26} className="text-white" />
              <h1 className="text-2xl font-bold tracking-tight">
                <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center">
                  EcoSpark
                </button>
              </h1>
            </div>

            <h2 className="text-4xl font-bold mb-6">Join the Network</h2>
            <p className="text-lg opacity-90">
              Create an account to start managing your fuel needs or station
              operations.
            </p>
          </div>

          <div className="opacity-60 text-sm">Secure System v2.0</div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-3/5 p-8 md:p-12">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <h2 className={`text-2xl font-bold ${theme.text}`}>
              Register as {activeConfig.name}
            </h2>
          </div>

          {/* Role Select */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {Object.keys(ROLE_CONFIG)
    .filter((key) => key !== "super_admin")
    .map((key) => {
              const cfg = ROLE_CONFIG[key];
              const Icon = cfg.icon;
              const isActive = currentRole === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!cfg.canRegister}
                  onClick={() => {
                    setCurrentRole(key);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className={`
                    p-3 rounded-xl flex flex-col items-center border
                    ${
                      isActive
                        ? `${themeClasses[cfg.color].bg} text-white shadow-md`
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }
                    ${!cfg.canRegister ? "opacity-40 cursor-not-allowed" : ""}
                  `}
                >
                  <Icon size={20} />
                  <span className="text-xs">{cfg.name}</span>
                </button>
              );
            })}
          </div>

          {/* REGISTER FORM */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* RESTRICTED ROLE MESSAGE */}
            {!activeConfig.canRegister && (
              <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <ShieldCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">
                  Registration Restricted
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
                  Accounts for {activeConfig.name}s must be created by an
                  administrator.
                </p>
              </div>
            )}

            {/* USER FIELDS */}
            {activeConfig.canRegister && currentRole === "user" && (
              <>
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className={`w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 ${theme.ring}`}
                      placeholder="choose a username"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 ${theme.ring}`}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </>
            )}

            {/* PUMP ADMIN FIELDS */}
            {activeConfig.canRegister && currentRole === "pump_admin" && (
              <>
                {/* Pump Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pump Station Name
                  </label>
                  <div className="relative">
                    <Fuel
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="text"
                      value={regPumpName}
                      onChange={(e) => setRegPumpName(e.target.value)}
                      className={`w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 ${theme.ring}`}
                      placeholder="City Central Fuels"
                    />
                  </div>
                </div>

                {/* License */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                    <input
                      type="text"
                      value={regLicense}
                      onChange={(e) => setRegLicense(e.target.value)}
                      className={`w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 ${theme.ring}`}
                      placeholder="LIC-9928-XX"
                    />
                  </div>
                </div>

                {/* Location (GPS) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location Coordinates
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin
                        size={18}
                        className="absolute left-3 top-3.5 text-gray-400"
                      />
                      <input
                        type="text"
                        readOnly
                        value={
                          regLocation.lat
                            ? `${regLocation.lat}, ${regLocation.lng}`
                            : ""
                        }
                        className="w-full pl-10 p-3 border border-gray-300 bg-gray-50 rounded-lg"
                        placeholder="Lat, Lng"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Navigation
                        size={20}
                        className={isGettingLocation ? "animate-spin" : ""}
                      />
                      <span className="hidden sm:inline">GPS</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PASSWORD FIELD */}
            {activeConfig.canRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Key
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 ${theme.ring}`}
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
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                {activeConfig.canRegister && currentRole === "user" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Password: 6–20 characters, at least one digit and one uppercase letter (e.g. Test123).
                  </p>
                )}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg flex gap-2">
                <ShieldCheck size={16} /> {error}
              </div>
            )}

            {/* SUCCESS */}
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg flex gap-2">
                <ShieldCheck size={16} /> {successMsg}
              </div>
            )}

            {/* SUBMIT */}
            {activeConfig.canRegister && (
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg text-white font-semibold flex justify-center gap-2 ${theme.bg} ${theme.hover}`}
              >
                {isLoading ? "Creating Account..." : "Register"}{" "}
                <ChevronRight size={20} />
              </button>
            )}

            {/* SWITCH TO LOGIN */}
            <p className="text-center text-sm mt-2">
              Already have an account?{" "}
              <Link
                to={`/login?role=${currentRole}`}
                className={`font-bold ${theme.text} hover:underline`}
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
