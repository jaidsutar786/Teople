"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bars3Icon, UserCircleIcon, ArrowRightOnRectangleIcon, BellIcon } from "@heroicons/react/24/outline"
import { useNotifications } from "../context/NotificationContext"
import NotificationModal from "./NotificationModal"
import EmployeeDocDrawer from "./EmployeeDocDrawer"
import api from "../api"

const Navbar = ({ onProfileClick, onToggleSidebar }) => {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)
  const [docDrawerOpen, setDocDrawerOpen] = useState(false)
  const [docDrawerTab, setDocDrawerTab] = useState('offer')
  const [profilePic, setProfilePic] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      setDocDrawerTab(e.detail || 'offer')
      setDocDrawerOpen(true)
    }
    window.addEventListener('open-doc-drawer', handler)
    return () => window.removeEventListener('open-doc-drawer', handler)
  }, [])

  useEffect(() => {
    const fetchPic = async () => {
      try {
        const role = localStorage.getItem('role')
        if (role !== 'employee') return
        const res = await api.get('/employee-form/get/')
        if (res.data?.employee?.profile_picture) {
          setProfilePic(res.data.employee.profile_picture)
        }
      } catch { }
    }
    fetchPic()
    // refresh pic when profile drawer closes
    const handler = () => fetchPic()
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])
  const dropdownRef = useRef(null)
  const { employeeNotifications, refreshNotifications } = useNotifications()
  const role = localStorage.getItem("role")
  const employeeName = localStorage.getItem("employeeName") || "User"

  const handleLogout = () => {
    localStorage.clear()
    navigate("/", { replace: true })
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 relative z-10">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center transition-all duration-200"
          aria-label="Toggle Sidebar"
        >
          <Bars3Icon className="h-5 w-5 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-800">Teople Technologies</span>
      </div>

      {/* Right: Notification + User */}
      <div className="flex items-center gap-1">
        {role === "employee" && (
          <button
            onClick={() => setDocDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-orange-500 hover:bg-orange-50 border border-orange-200 transition-all duration-200 mr-1"
            aria-label="My Documents"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:block">My Documents</span>
          </button>
        )}

        {role === "employee" && (
          <button
            onClick={() => setNotificationModalOpen(true)}
            className="relative w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center transition-all duration-200"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5 text-gray-500" />
            {employeeNotifications.total > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {employeeNotifications.total > 9 ? '9+' : employeeNotifications.total}
              </span>
            )}
          </button>
        )}

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-all duration-200"
            aria-label="User Menu"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: profilePic ? 'transparent' : '#f97316' }}>
              {profilePic
                ? <img src={profilePic} alt="avatar" className="w-7 h-7 object-cover rounded-full" />
                : <span className="text-white text-xs font-semibold">{employeeName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <span className="text-sm text-gray-700 font-medium hidden sm:block">{employeeName}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 text-gray-700 z-50 border border-gray-200">
              <button
                onClick={() => { onProfileClick(); setDropdownOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
              >
                <UserCircleIcon className="h-4 w-4 text-gray-400" />
                <span>My Profile</span>
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <NotificationModal 
        isOpen={notificationModalOpen} 
        onClose={() => setNotificationModalOpen(false)} 
      />

      <EmployeeDocDrawer open={docDrawerOpen} onClose={() => setDocDrawerOpen(false)} activeTab={docDrawerTab} />
    </div>
  )
}

export default Navbar
