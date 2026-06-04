import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight } from 'lucide-react'
import NAVIGATION from '../utils/NAVIGATION'
import themeClasses from '../utils/themeClasses'

const Sidebar = ({ userRole = 'user', onLogout, isOpen, setIsOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Default logout handler if not provided
  const handleLogout = onLogout || (() => {
    console.log('Logout clicked')
    localStorage.removeItem('user')
    navigate('/')
  })

  // Get theme based on user role
  const roleColorMap = {
    user: 'blue',
    worker: 'orange',
    pump_admin: 'emerald',
    super_admin: 'rose'
  }

  const themeColor = roleColorMap[userRole] || 'blue'
  const theme = themeClasses[themeColor]
  const links = NAVIGATION[userRole] || []

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed top-[73px] left-0 right-0 bottom-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-[73px] left-0 
          h-[calc(100vh-73px)]
          w-56 bg-white shadow-lg transition-transform duration-300 z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >

        {/* Navigation Links */}
        <nav className="flex-1 p-4 pt-6 lg:pt-6 overflow-y-auto flex flex-col min-h-0">
          <div className="space-y-2">
            {links && links.length > 0 ? (
              links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive(link.path)
                      ? `${theme.bg} text-white shadow-md`
                      : `text-gray-700 hover:${theme.lightBg}`
                    }
                  `}
                >
                  <span className={`${isActive(link.path) ? 'text-white' : theme.text}`}>
                    {link.icon ? (
                      <link.icon size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center py-4">
                No navigation links available
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-colors hover:cursor-pointer
              border ${theme.border} ${theme.text} hover:${theme.lightBg}
            `}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar