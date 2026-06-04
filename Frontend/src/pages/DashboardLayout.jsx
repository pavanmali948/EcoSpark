import { Sidebar } from 'lucide-react'
import React from 'react'

const DashboardLayout = () => {
  return (
    <div>
        <Sidebar />
        <Outlet />
    </div>
  )
}

export default DashboardLayout