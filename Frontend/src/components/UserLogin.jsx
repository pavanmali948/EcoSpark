import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Key, Fuel, HardHat, ShieldCheck, LogOut, ChevronRight, Eye, EyeOff, Mail, MapPin, Navigation } from 'lucide-react';

// --- Configuration ---
// This object defines the behavior and appearance for each role
const ROLE_CONFIG = {
  user: {
    id: 'user',
    name: 'Customer',
    inputLabel: 'Username or Email',
    inputPlaceholder: 'john.doe@example.com',
    icon: User,
    color: 'blue',
    description: 'Access your refueling history and rewards.',
    canRegister: true
  },
  worker: {
    id: 'worker',
    name: 'Pump Worker',
    inputLabel: 'Worker ID',
    inputPlaceholder: 'WRK-8821',
    icon: HardHat,
    color: 'orange',
    description: 'Log shifts and pump operations.',
    canRegister: false
  },
  pump_admin: {
    id: 'pump_admin',
    name: 'Pump Admin',
    inputLabel: 'Station License No',
    inputPlaceholder: 'LIC-992-AX',
    icon: Fuel,
    color: 'emerald',
    description: 'Manage inventory, pricing, and staff.',
    canRegister: true
  },
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    inputLabel: 'Admin Username',
    inputPlaceholder: 'root_admin',
    icon: ShieldCheck,
    color: 'rose',
    description: 'System-wide configuration and oversight.',
    canRegister: false
  }
};

export default function App() {
  // --- State ---
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('user');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPumpName, setRegPumpName] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regLocation, setRegLocation] = useState({ lat: '', lng: '' });
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- Handlers ---

  const handleRoleChange = (roleKey) => {
    setCurrentRole(roleKey);
    setError('');
    setSuccessMsg('');
    // Reset inputs on role switch to avoid confusion
    if (!loggedInUser) {
        setIdentifier('');
        setPassword('');
    }
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRegLocation({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        });
        setIsGettingLocation(false);
      },
      () => {
        setError('Unable to retrieve your location. Please check browser permissions.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    // Simulation of API Latency
    setTimeout(() => {
      // Logic split based on Mode (Login vs Register)
      if (isRegistering) {
        // --- Registration Validation ---
        if (currentRole === 'user') {
          if (!regUsername || !regEmail || !password) {
            setError('Please fill in all user registration fields.');
            setIsLoading(false);
            return;
          }
        } else if (currentRole === 'pump_admin') {
          if (!regPumpName || !regLicense || !password || !regLocation.lat) {
            setError('Please fill in all station details and location.');
            setIsLoading(false);
            return;
          }
        }
        
        // Mock Successful Registration
        setSuccessMsg('Account created successfully! Switching to login...');
        setTimeout(() => {
          setIsRegistering(false);
          setSuccessMsg('');
          // Pre-fill login identifier for convenience
          if (currentRole === 'user') setIdentifier(regUsername);
          if (currentRole === 'pump_admin') setIdentifier(regLicense);
        }, 1500);

      } else {
        // --- Login Validation ---
        if (!identifier || !password) {
          setError('Please fill in all credentials.');
          setIsLoading(false);
          return;
        }

        // Mock Successful Login
        const loggedInUserData = {
          role: currentRole,
          identifier: identifier,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setLoggedInUser(loggedInUserData);
        
        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify({
          role: currentRole,
          identifier: identifier
        }));
        
        // Navigate to dashboard with role parameter
        setTimeout(() => {
          navigate('/dashboard', { state: { userRole: currentRole, userIdentifier: identifier } });
        }, 500);
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIdentifier('');
    setPassword('');
    setError('');
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Navigate back to login page
    navigate('/');
  };

  // --- Helper for dynamic styles ---
  const activeConfig = ROLE_CONFIG[currentRole];

  // Map of Tailwind color classes based on the role color property
  const themeClasses = {
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
      border: 'border-blue-200',
      ring: 'focus:ring-blue-500',
      hover: 'hover:bg-blue-700',
      gradient: 'from-blue-600 to-blue-800'
    },
    orange: {
      bg: 'bg-orange-600',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50',
      border: 'border-orange-200',
      ring: 'focus:ring-orange-500',
      hover: 'hover:bg-orange-700',
      gradient: 'from-orange-600 to-orange-800'
    },
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      lightBg: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'focus:ring-emerald-500',
      hover: 'hover:bg-emerald-700',
      gradient: 'from-emerald-600 to-emerald-800'
    },
    rose: {
      bg: 'bg-rose-600',
      text: 'text-rose-600',
      lightBg: 'bg-rose-50',
      border: 'border-rose-200',
      ring: 'focus:ring-rose-500',
      hover: 'hover:bg-rose-700',
      gradient: 'from-rose-600 to-rose-800'
    }
  };

  const theme = themeClasses[activeConfig.color];
  // --- Render: Login / Register Screen ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[650px]">
        
        {/* Left Side: Visual / Info Panel */}
        <div className={`hidden lg:flex flex-col justify-between w-2/5 p-12 bg-linear-to-br ${theme.gradient} text-white transition-all duration-500 ease-in-out`}>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Fuel size={24} className="text-white" />
              </div>
              <button type="button" onClick={() => navigate('/login')} className="text-2xl font-bold tracking-tight">
                EcoSpark
              </button>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              {isRegistering ? 'Join the Network' : `Portal for ${activeConfig.name}s`}
            </h2>
            <p className="text-lg opacity-90 leading-relaxed">
              {isRegistering 
                ? 'Create an account to start managing your fuel needs or station operations.' 
                : activeConfig.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm opacity-75">
              <div className="w-8 h-px bg-white"></div>
              <span>Secure System v2.0</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login/Register Form */}
        <div className="w-full lg:w-3/5 p-8 md:p-12 flex flex-col justify-center bg-white relative">
          
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2 mb-2 text-gray-800">
              <Fuel className={theme.text} />
              <button type="button" onClick={() => navigate('/login')} className="font-bold text-xl">
                EcoSpark
              </button>
            </div>
            <h2 className={`text-2xl font-bold ${theme.text}`}>
              {isRegistering ? `Register as ${activeConfig.name}` : `${activeConfig.name} Login`}
            </h2>
          </div>

          {/* Role Selector Tabs (Disable if mid-registration maybe? leaving active for flexibility) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-500 mb-3">Select your role</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.keys(ROLE_CONFIG).map((roleKey) => {
                const config = ROLE_CONFIG[roleKey];
                const isActive = currentRole === roleKey;
                const Icon = config.icon;
                
                return (
                  <button
                    key={roleKey}
                    onClick={() => handleRoleChange(roleKey)}
                    type="button"
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                      ${isActive 
                        ? `${themeClasses[config.color].bg} text-white border-transparent shadow-md scale-105` 
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    title={config.name}
                  >
                    <Icon size={20} className="mb-1" />
                    <span className="text-xs font-medium">{config.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header & Toggle */}
          <div className="flex items-end justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 hidden lg:block">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h3>
            {/* Conditional Sub-text or restricted message */}
            {!activeConfig.canRegister && isRegistering && (
               <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                 Invite Only
               </span>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* --- REGISTRATION LOGIC --- */}
            {isRegistering ? (
              activeConfig.canRegister ? (
                <>
                  {/* User Specific Registration Fields */}
                  {currentRole === 'user' && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ring}`}
                            placeholder="Choose a username"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ring}`}
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pump Admin Specific Registration Fields */}
                  {currentRole === 'pump_admin' && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Pump Station Name</label>
                        <div className="relative">
                          <Fuel size={18} className="absolute left-3 top-3.5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={regPumpName}
                            onChange={(e) => setRegPumpName(e.target.value)}
                            className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ring}`}
                            placeholder="e.g. City Central Fuels"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">License Number</label>
                        <div className="relative">
                          <ShieldCheck size={18} className="absolute left-3 top-3.5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={regLicense}
                            onChange={(e) => setRegLicense(e.target.value)}
                            className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ring}`}
                            placeholder="e.g. LIC-9928-XX"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Location Coordinates</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input
                              type="text"
                              readOnly
                              value={regLocation.lat}
                              className={`block w-full pl-10 pr-3 py-3 border border-gray-300 bg-gray-50 rounded-lg focus:outline-none ${theme.ring}`}
                              placeholder="Latitude"
                            />
                          </div>
                          <div className="relative flex-1">
                            <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input
                              type="text"
                              readOnly
                              value={regLocation.lng}
                              className={`block w-full pl-10 pr-3 py-3 border border-gray-300 bg-gray-50 rounded-lg focus:outline-none ${theme.ring}`}
                              placeholder="Longitude"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isGettingLocation}
                            className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600 transition-colors ${isGettingLocation ? 'opacity-50' : ''}`}
                            title="Use Current Location"
                          >
                            <Navigation size={20} className={isGettingLocation ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Set GPS</span>
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">Click the GPS button to automatically set your station's location.</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <activeConfig.icon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-sm font-medium text-gray-900">Registration Restricted</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
                    New accounts for {activeConfig.name}s must be created by an administrator. Please contact support.
                  </p>
                </div>
              )
            ) : (
              // --- LOGIN LOGIC ---
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {activeConfig.inputLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <activeConfig.icon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-shadow`}
                    placeholder={activeConfig.inputPlaceholder}
                  />
                </div>
              </div>
            )}

            {/* Password Field (Common for both Login and Register) */}
            {(activeConfig.canRegister || !isRegistering) && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-shadow`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isRegistering && (
                  <div className="flex justify-end">
                    <a href="#" className={`text-sm font-medium ${theme.text} hover:underline`}>
                      Forgot Password?
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Error & Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-pulse">
                 <ShieldCheck size={16} /> {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
                 <ShieldCheck size={16} /> {successMsg}
              </div>
            )}

            {/* Submit Button */}
            {(activeConfig.canRegister || !isRegistering) && (
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white font-semibold text-lg
                  ${theme.bg} ${theme.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.ring}
                  transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (isRegistering ? 'Creating Account...' : 'Authenticating...') : (
                  <>
                    {isRegistering ? 'Register' : 'Login'} <ChevronRight size={20} />
                  </>
                )}
              </button>
            )}

            {/* Toggle Login/Register */}
            <div className="text-center mt-4">
              <span className="text-gray-600 text-sm">
                {isRegistering ? "Already have an account?" : "Don't have an account?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccessMsg('');
                }}
                className={`ml-2 text-sm font-bold ${theme.text} hover:underline focus:outline-none`}
              >
                {isRegistering ? "Sign In" : "Register Now"}
              </button>
            </div>
            
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            &copy; 2023 FuelConnect Systems. Unauthorized access is prohibited.
          </div>
        </div>
      </div>
    </div>
  );
}