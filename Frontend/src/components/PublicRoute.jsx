import React from 'react'
import { Navigate } from 'react-router-dom'

const PublicRoute = ({ children }) => {
  // Get user from localStorage
  const storedUser = localStorage.getItem('user')
  let user = null

  if (storedUser) {
    try {
      user = JSON.parse(storedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }

  // If user is authenticated, redirect to their role's home page
  if (user && user.role) {
    const roleHomeMap = {
      user: '/user/home',
      worker: '/worker/home',
      pump_admin: '/admin/home',
      super_admin: '/super-admin/home'
    }

    // Validate role exists in map
    if (roleHomeMap[user.role]) {
      return <Navigate to={roleHomeMap[user.role]} replace />
    }

    // If role is invalid, clear storage and show login (stops loop)
    console.warn('Invalid user role found:', user.role)
    localStorage.removeItem('user')
  }

  return children
}

export default PublicRoute

