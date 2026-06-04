import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import ChatbotWidget from '../components/ChatbotWidget'

const HomeLayout = () => {
  // Start with sidebar closed so content is visible first after login
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState('user')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        const role = userData.role || 'user'
        setUserRole(role)
        if (role === 'pump_admin' && userData.pumpName) {
          setUserName(userData.pumpName)
        } else {
          setUserName(userData.name || userData.identifier || '')
        }
        setUserEmail(userData.email || '')
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Keep sidebar open on desktop by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <Topbar 
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <Sidebar 
        userRole={userRole}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />
      {/* Main Content Area */}
      <main 
        className="fixed top-[73px] left-0 right-0 lg:left-56 overflow-y-auto"
        style={{ height: 'calc(100vh - 73px)' }}
      >
        <Outlet />
      </main>

      {/* Floating chatbot widget (shown only for logged-in users & pump admins) */}
      <ChatbotWidget userRole={userRole} />
    </div>
  )
}

export default HomeLayout
