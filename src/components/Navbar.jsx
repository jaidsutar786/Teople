
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bars3Icon, UserCircleIcon, ArrowRightOnRectangleIcon, BellIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { useNotifications } from "../context/NotificationContext"
import NotificationModal from "./NotificationModal"
import EmployeeDocDrawer from "./EmployeeDocDrawer"
import api from "../api"

const Navbar = ({ onProfileClick, onToggleSidebar }) => {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)
  const [docDrawerOpen, setDocDrawerOpen] = useState(false)
  const [docDrawerTab, setDocDrawerTab] = useState("offer")
  const [profilePic, setProfilePic] = useState(null)
  const dropdownRef = useRef(null)
  const { employeeNotifications } = useNotifications()
  const role = localStorage.getItem("role")
  const employeeName = localStorage.getItem("employeeName") || "User"

  useEffect(() => {
    const handler = (e) => { setDocDrawerTab(e.detail || "offer"); setDocDrawerOpen(true) }
    window.addEventListener("open-doc-drawer", handler)
    return () => window.removeEventListener("open-doc-drawer", handler)
  }, [])

  useEffect(() => {
    const fetchPic = async () => {
      try {
        if (localStorage.getItem("role") !== "employee") return
        const res = await api.get("/employee-form/get/")
        if (res.data?.employee?.profile_picture) setProfilePic(res.data.employee.profile_picture)
      } catch { }
    }
    fetchPic()
    window.addEventListener("profile-updated", fetchPic)
    return () => window.removeEventListener("profile-updated", fetchPic)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => { localStorage.clear(); navigate("/", { replace: true }) }

  return (
    <div className="h-14 bg-white flex items-center justify-between px-4 relative z-10 border-b border-gray-200">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all duration-200"
        >
          <Bars3Icon className="h-5 w-5 text-gray-500" />
        </button>

      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {role === "employee" && (
          <button
            onClick={() => setDocDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:block">My Documents</span>
          </button>
        )}

        {role === "employee" && (
          <button
            onClick={() => setNotificationModalOpen(true)}
            className="relative w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all duration-200"
          >
            <BellIcon className="h-5 w-5 text-gray-500" />
            {employeeNotifications.total > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: profilePic ? "transparent" : "linear-gradient(135deg, #f97316, #ea580c)" }}
            >
              {profilePic
                ? <img src={profilePic} alt="avatar" className="w-7 h-7 object-cover rounded-full" />
                : <span className="text-white text-xs font-bold">{employeeName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-gray-800 leading-tight">{employeeName}</div>
              <div className="text-[10px] text-gray-400 capitalize leading-tight">{role}</div>
            </div>
            <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-gray-100" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.12)" }}>
              <div className="px-4 py-2.5 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">{employeeName}</div>
                <div className="text-xs text-gray-400 capitalize">{role}</div>
              </div>
              <button
                onClick={() => { onProfileClick(); setDropdownOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <UserCircleIcon className="h-4 w-4 text-gray-400" />
                <span>My Profile</span>
              </button>
              <div className="h-px bg-gray-100 mx-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-500"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <NotificationModal isOpen={notificationModalOpen} onClose={() => setNotificationModalOpen(false)} />
      <EmployeeDocDrawer open={docDrawerOpen} onClose={() => setDocDrawerOpen(false)} activeTab={docDrawerTab} />
    </div>
  )
}

export default Navbar


