import React from "react";
import { Link } from "react-router-dom";
import { Fuel, ArrowRight } from "lucide-react";

import cngBg from "../assets/cng-bg.png";

export default function PublicHome() {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${cngBg})`,
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto min-h-screen flex items-center px-6 lg:px-12">
        <div className="max-w-2xl">
          {/* Logo Section */}
          {/* EcoSpark Logo */}
          <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 flex items-center justify-center">
              <Fuel className="w-9 h-9 text-emerald-400" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                EcoSpark
              </h1>

              <p className="text-sm text-emerald-200">Smart CNG Slot Booking</p>
            </div>
          </div>

          {/* Welcome Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/20 mb-6 backdrop-blur">
            <span className="text-emerald-300 text-sm font-semibold tracking-widest uppercase">
              Welcome
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Book your CNG fill time.
            <br />
            <span className="text-emerald-400">Skip the queue.</span>
          </h2>

          {/* Description */}
          <p className="text-lg text-slate-200 leading-relaxed mb-10 max-w-xl">
            Drivers, station staff and administrators use the same platform with
            role-based access. Reserve your slot, reduce waiting time and enjoy
            a seamless fueling experience.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/30"
            >
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register?role=user"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 font-semibold transition-all duration-300"
            >
              Register as Customer
            </Link>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-6 mt-12 text-sm">
            <div className="bg-black/30 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
              ⚡ Fast Booking
            </div>

            <div className="bg-black/30 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
              🚗 No Long Queues
            </div>

            <div className="bg-black/30 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
              🌱 Eco Friendly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
