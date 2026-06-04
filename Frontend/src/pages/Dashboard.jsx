import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { LogOut } from 'lucide-react'

const Dashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState(null)
  const [userIdentifier, setUserIdentifier] = useState(null)

  useEffect(() => {
    // Get user data from location state or localStorage
    const stateData = location.state
    
    if (stateData?.userRole) {
      setUserRole(stateData.userRole)
      setUserIdentifier(stateData.userIdentifier)
      } else {
        // Check localStorage if state not available
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUserRole(userData.role)
            setUserIdentifier(userData.identifier)
          } catch (error) {
            // Invalid stored data, fall back to default role
            setUserRole('user')
            setUserIdentifier('guest')
            // persist the default role so sidebar mapping works
            localStorage.setItem('user', JSON.stringify({ role: 'user', identifier: 'guest' }))
          }
        } else {
          // No user data found — keep default user role as requested
          setUserRole('user')
          setUserIdentifier('guest')
          localStorage.setItem('user', JSON.stringify({ role: 'user', identifier: 'guest' }))
        }
      }
  }, [location, navigate])

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user')
    navigate('/')
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar userRole={userRole} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {userIdentifier}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <div className="max-w-6xl">
            {/* Welcome Card */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to EcoSpark</h2>
              <p className="text-gray-600">
                You are logged in as <span className="font-semibold">{userIdentifier}</span> with role <span className="font-semibold text-blue-600">{userRole}</span>
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder Cards */}
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Analytics</h3>
                <p className="text-sm text-gray-600">View your usage statistics and insights</p>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">⚙️</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Settings</h3>
                <p className="text-sm text-gray-600">Manage your account preferences</p>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">📋</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Reports</h3>
                <p className="text-sm text-gray-600">Access your reports and history</p>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-blue-700">Role-based Navigation:</span> The sidebar on the left displays navigation links specific to your role ({userRole}). Your access and available features are customized based on your permissions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
