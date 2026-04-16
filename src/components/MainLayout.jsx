"use client"

import { Outlet, useLocation } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import Profile from "./Profile"

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const contentRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0)
    }
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Navbar - Full Width */}
      <Navbar 
        onProfileClick={() => setShowProfile(true)} 
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          onProfileClick={() => setShowProfile(true)}
        />

        {/* Main Content */}
        <div ref={contentRef} className="flex-1 overflow-hidden bg-gray-50" style={{ display: 'flex', flexDirection: 'column' }}>
          {location.pathname.includes('leave-management') ? (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Outlet />
            </div>
          ) : (
            <div className="p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full overflow-y-auto flex-1">
              <Outlet />
            </div>
          )}
        </div>
      </div>

      <Profile open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  )
}

export default MainLayout
