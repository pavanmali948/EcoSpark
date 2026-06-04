import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation()

  // Parse user on each render so role/token changes are reflected immediately.
  const storedUser = localStorage.getItem('user')
  let user = null
  if (storedUser) {
    try {
      user = JSON.parse(storedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      user = null
    }
  }

  // If no user, redirect to login
  if (!user || !user.role) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If role-based access is required and user role is not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleHomeMap = {
      user: '/user/home',
      worker: '/worker/home',
      pump_admin: '/admin/home',
      super_admin: '/super-admin/home'
    }

    // If role is valid but not allowed here, redirect to their home
    // If role is invalid, targetPath will be /login
    const targetPath = roleHomeMap[user.role] || '/login'

    if (!roleHomeMap[user.role]) {
      console.warn('Invalid user role in ProtectedRoute:', user.role)
      localStorage.removeItem('user')
      return <Navigate to="/login" replace />
    }

    // Only redirect if not already going to the correct path
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />
    }
  }

  return children
}

export default ProtectedRoute

