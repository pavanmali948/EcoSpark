import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import HomeLayout from './pages/HomeLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import PublicHome from './pages/PublicHome'

// User Routes
import UserHome from './pages/user/Home'
import BookSlot from './pages/user/BookSlot'
import PumpTrack from './pages/user/PumpTrack'
import UserHistory from './pages/user/UserHistory'
import UserProfile from './pages/user/UserProfile'
import Booking from './components/Booking'
import ChatbotPage from './pages/shared/Chatbot'

// Admin Routes
import AdminHome from './pages/admin/Home'
import ManageSlots from './pages/admin/ManageSlots'
import ManageWorkers from './pages/admin/ManageWorkers'
import PumpAdminProfile from './pages/admin/PumpAdminProfile'
import AdminSubscriptionPage from './pages/admin/Subscription'

// Worker Routes
import WorkerHome from './pages/worker/Home'
import CustomersHandled from './pages/worker/CustomersHandled'
import ScanQR from './pages/worker/ScanQR'
import WorkerProfile from './pages/worker/WorkerProfile'
import SuperAdminHome from './pages/superadmin/Home'
import SuperAdminProfile from './pages/superadmin/Profile'
import SuperAdminLogin from './pages/superAdminLogin'

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/superadmin" element={<SuperAdminLogin />} />
      <Route path="/login/super-admin" element={<Navigate to="/superadmin" replace />} />
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected Routes - User */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<UserHome />} />
        <Route path="bookslot" element={<BookSlot />} />
        <Route path="track/:pumpId" element={<PumpTrack />} />
        <Route path="slots/:pumpId" element={<Booking />} />
        <Route path="history" element={<UserHistory />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="profile" element={<UserProfile />} />
        <Route index element={<Navigate to="/user/home" replace />} />
      </Route>

      {/* Protected Routes - Worker */}
      <Route
        path="/worker/*"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<WorkerHome />} />
        <Route path="customersHandled" element={<CustomersHandled />} />
        <Route path="scanQR" element={<ScanQR />} />
        <Route path="profile" element={<WorkerProfile />} />
        <Route index element={<Navigate to="/worker/home" replace />} />
      </Route>

      {/* Protected Routes - Pump Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['pump_admin']}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<AdminHome />} />
        <Route path="manageSlots" element={<ManageSlots />} />
        <Route path="manageWorkers" element={<ManageWorkers />} />
        <Route path="subscription" element={<AdminSubscriptionPage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="profile" element={<PumpAdminProfile />} />
        <Route index element={<Navigate to="/admin/home" replace />} />
      </Route>

      {/* Protected Routes - Super Admin */}
      <Route
        path="/super-admin/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<SuperAdminHome />} />
        <Route path="profile" element={<SuperAdminProfile />} />
        <Route index element={<Navigate to="/super-admin/home" replace />} />
      </Route>

      <Route path="/" element={<PublicHome />} />

      {/* Default redirects */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
