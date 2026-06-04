import { FaHome, FaRegCalendarCheck, FaHistory, FaUsersCog } from 'react-icons/fa'
import { MdManageAccounts } from 'react-icons/md'
import { BsFuelPump, BsQrCodeScan } from 'react-icons/bs'


const NAVIGATION = {
  user: [
    {
      label: 'Home',
      path: '/user/home',
      icon: FaHome
    },
    {
      label: 'Book Slot',
      path: '/user/bookslot',
      icon: FaRegCalendarCheck
    },
    {
      label: 'History',
      path: '/user/history',
      icon: FaHistory
    },
  ],
  pump_admin: [
    {
      label: 'Home',
      path: '/admin/home',
      icon: FaHome
    },
    {
      label: 'Manage Slots',
      path: '/admin/manageSlots',
      icon: BsFuelPump
    },
    {
      label: 'Manage Workers',
      path: '/admin/manageWorkers',
      icon: MdManageAccounts
    },
    {
      label: 'Subscription',
      path: '/admin/subscription',
      icon: FaHistory
    },
  ],
  worker: [
    {
      label: 'Home',
      path: '/worker/home',
      icon: FaHome
    },
    {
      label: 'Customers Handled',
      path: '/worker/customersHandled',
      icon: FaUsersCog
    },
    {
      label: 'Scan QR',
      path: '/worker/scanQR',
      icon: BsQrCodeScan
    }
  ],
  super_admin: [
    {
      label: 'Dashboard',
      path: '/super-admin/home',
      icon: FaHome
    },
    {
      label: 'Profile',
      path: '/super-admin/profile',
      icon: MdManageAccounts
    }
  ]
};

export default NAVIGATION;