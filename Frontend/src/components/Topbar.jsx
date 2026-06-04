import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, ChevronDown, Menu, Fuel } from 'lucide-react'
import themeClasses from '../utils/themeClasses'

const Topbar = ({ userRole = 'user', userName, userEmail, isSidebarOpen, setIsSidebarOpen }) => {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Get theme based on user role (same as Sidebar)
  const roleColorMap = {
    user: 'blue',
    worker: 'orange',
    pump_admin: 'emerald',
    super_admin: 'rose'
  }

  const themeColor = roleColorMap[userRole] || 'blue'
  const theme = themeClasses[themeColor]

  // Format user role display name
  const roleDisplayName = userRole === 'pump_admin'
    ? 'Pump Admin'
    : userRole.charAt(0).toUpperCase() + userRole.slice(1)

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userName) {
      const names = userName.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return userName.substring(0, 2).toUpperCase()
    }
    return roleDisplayName.substring(0, 2).toUpperCase()
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <header className={`${theme.bg} text-white shadow-md fixed top-0 left-0 right-0 z-[60]`}>
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left side - Hamburger Menu & Logo */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button - Hidden on desktop */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} className="text-white" />
          </button>

          {/* EcoSpark Logo */}
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-3 focus:outline-none"
            aria-label="Go to landing page"
          >
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
              <Fuel size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">EcoSpark</h2>
              <p className="text-xs opacity-75">CNG Booking</p>
            </div>
          </button>
        </div>

        {/* Right side - User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
              hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50
            `}
            aria-label="User profile menu"
          >
            {/* User Avatar */}
            <div className={`
              w-10 h-10 rounded-full ${theme.lightBg} ${theme.text} 
              flex items-center justify-center font-semibold text-sm
              border-2 border-white/30
            `}>
              {getUserInitials()}
            </div>

            {/* User Info (hidden on mobile, shown on larger screens) */}
            <div className="hidden md:block text-left min-w-0 max-w-[220px]">
              <p className="text-sm font-medium truncate" title={userName || roleDisplayName}>
                {userName || roleDisplayName}
              </p>
              {userRole === 'user' ? (
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-medium">
                  User
                </span>
              ) : (
                <p className="text-xs mt-0.5 opacity-75 truncate" title={userEmail || `${roleDisplayName} Account`}>
                  {userEmail || `${roleDisplayName} Account`}
                </p>
              )}
            </div>

            {/* Dropdown Icon */}
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />

              {/* Dropdown Content */}
              <div className={`
                absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50
                border border-gray-200 overflow-hidden
              `}>
                {/* User Info Section */}
                <div className={`${theme.lightBg} px-4 py-3 border-b ${theme.border}`}>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {userName || roleDisplayName}
                  </p>
                  {userRole === 'user' ? (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-medium">
                      User
                    </span>
                  ) : (
                    <p className="text-xs mt-1 text-gray-600 break-all">
                      {userEmail || `${roleDisplayName} Account`}
                    </p>
                  )}
                  <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${theme.bg} text-white`}>
                    {roleDisplayName}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      // Navigate to profile based on user role
                      const profilePath = userRole === 'pump_admin'
                        ? '/admin/profile'
                        : userRole === 'super_admin'
                          ? '/super-admin/profile'
                          : `/${userRole}/profile`
                      navigate(profilePath)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <User size={16} className={theme.text} />
                    View Profile
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar

