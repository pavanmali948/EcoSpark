// ROLE_CONFIG.js
import { User, Fuel, HardHat, ShieldCheck } from "lucide-react";

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
    inputLabel: 'Worker email or ID',
    inputPlaceholder: 'worker@example.com',
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

export default ROLE_CONFIG;
