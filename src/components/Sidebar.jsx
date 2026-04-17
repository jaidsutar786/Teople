import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { useNotifications } from "../context/NotificationContext"

import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize"
import LayersIcon from "@mui/icons-material/Layers"
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts"
import PeopleIcon from "@mui/icons-material/People"
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch"
import BeachAccessIcon from "@mui/icons-material/BeachAccess"
import AssignmentIcon from "@mui/icons-material/Assignment"
import HomeWorkIcon from "@mui/icons-material/HomeWork"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import NoteAltIcon from "@mui/icons-material/NoteAlt"
import DevicesIcon from "@mui/icons-material/Devices"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"
import PaymentsIcon from "@mui/icons-material/Payments"
import DescriptionIcon from "@mui/icons-material/Description"
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import MoneyOffIcon from "@mui/icons-material/MoneyOff"
import SavingsIcon from "@mui/icons-material/Savings"
import HandshakeIcon from "@mui/icons-material/Handshake"
import BarChartIcon from "@mui/icons-material/BarChart"
import GroupIcon from "@mui/icons-material/Group"
import BugReportIcon from "@mui/icons-material/BugReport"
import HomeIcon from "@mui/icons-material/Home"

const Sidebar = ({ sidebarOpen, onProfileClick }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const employeeName = localStorage.getItem("employeeName") || "Employee"
  const role = localStorage.getItem("role")
  const { pendingRequests, employeeNotifications, liveWorkingCount } = useNotifications()

  const dashboardPath = role === "admin" ? "/dashboard" : "/employee-home"
  const homePath = role === "admin" ? "/admin-home" : "/employee-home"

  const [openDropdowns, setOpenDropdowns] = useState({})
  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Admin sections — headings based on actual project components
  const adminSections = [
    {
      heading: "DASHBOARD",
      items: [
        {
          key: homePath,
          icon: <DashboardCustomizeIcon fontSize="small" />,
          label: "Dashboard",
          onClick: () => navigate(homePath),
          badge: liveWorkingCount,
        },
      ],
    },
    {
      heading: "EMPLOYEE",
      items: [
        {
          key: "/employee-section",
          icon: <PeopleIcon fontSize="small" />,
          label: "Employees",
          onClick: () => toggleDropdown("/employee-section"),
          children: [
            {
              key: "/employee",
              icon: <PeopleIcon fontSize="small" />,
              label: "Add Employee",
              onClick: () => navigate("/employee"),
            },
            {
              key: "/employee-management",
              icon: <ManageAccountsIcon fontSize="small" />,
              label: "Employee Management",
              onClick: () => navigate("/employee-management"),
            },
          ],
        },
      ],
    },
    {
      heading: "ATTENDANCE & LEAVE",
      items: [
        {
          key: "/leave-management",
          icon: <BeachAccessIcon fontSize="small" />,
          label: "Leave Management",
          onClick: () => navigate("/leave-management"),
        },
        {
          key: "/dashboard",
          icon: <AssignmentIcon fontSize="small" />,
          label: "Requests",
          onClick: () => toggleDropdown("/dashboard"),
          badge: pendingRequests.total,
          children: [
            {
              key: "/requests/leave",
              icon: <BeachAccessIcon fontSize="small" />,
              label: "Leave",
              onClick: () => navigate("/requests/leave"),
              badge: pendingRequests.leave,
            },
            {
              key: "/requests/wfh",
              icon: <HomeWorkIcon fontSize="small" />,
              label: "Work From Home",
              onClick: () => navigate("/requests/wfh"),
              badge: pendingRequests.wfh,
            },
            {
              key: "/requests/compoff",
              icon: <AccessTimeIcon fontSize="small" />,
              label: "Comp Off",
              onClick: () => navigate("/requests/compoff"),
              badge: pendingRequests.comp_off,
            },
          ],
        },
      ],
    },
    {
      heading: "PAYROLL",
      items: [
        {
          key: "/Salary",
          icon: <PaymentsIcon fontSize="small" />,
          label: "Salary Management",
          onClick: () => navigate("/Salary"),
        },
        {
          key: "/assets",
          icon: <DevicesIcon fontSize="small" />,
          label: "Assets",
          onClick: () => navigate("/assets"),
        },
        {
          key: "/admin-notes",
          icon: <NoteAltIcon fontSize="small" />,
          label: "Admin Notes",
          onClick: () => navigate("/admin-notes"),
        },
      ],
    },
    {
      heading: "ACCOUNTING",
      items: [
        {
          key: "/accounting",
          icon: <ReceiptLongIcon fontSize="small" />,
          label: "Accounting",
          onClick: () => toggleDropdown("/accounting"),
          children: [
            {
              key: "/accounting/dashboard",
              icon: <BarChartIcon fontSize="small" />,
              label: "Dashboard",
              onClick: () => navigate("/accounting/dashboard"),
            },
            {
              key: "/accounting/customers",
              icon: <GroupIcon fontSize="small" />,
              label: "Customers",
              onClick: () => navigate("/accounting/customers"),
            },
            {
              key: "/accounting/invoices",
              icon: <DescriptionIcon fontSize="small" />,
              label: "Invoices",
              onClick: () => navigate("/accounting/invoices"),
            },
            {
              key: "/accounting/payments",
              icon: <AccountBalanceWalletIcon fontSize="small" />,
              label: "Payments",
              onClick: () => navigate("/accounting/payments"),
            },
            {
              key: "/accounting/expenses",
              icon: <MoneyOffIcon fontSize="small" />,
              label: "Expenses",
              onClick: () => navigate("/accounting/expenses"),
            },
            {
              key: "/accounting/salary-expense",
              icon: <SavingsIcon fontSize="small" />,
              label: "Salary Expense",
              onClick: () => navigate("/accounting/salary-expense"),
            },
          ],
        },
      ],
    },
  ]

  // Employee sections
  const employeeSections = [
    {
      heading: "DASHBOARD",
      items: [
        {
          key: homePath,
          icon: <HomeIcon fontSize="small" />,
          label: "Dashboard",
          onClick: () => navigate(homePath),
        },
      ],
    },
    {
      heading: "MY WORK",
      items: [
        {
          key: "/requests",
          icon: <AssignmentIcon fontSize="small" />,
          label: "Requests",
          onClick: () => toggleDropdown("/requests"),
          children: [
            {
              key: "/leave-request",
              icon: <BeachAccessIcon fontSize="small" />,
              label: "Leave",
              onClick: () => navigate("/leave-request"),
            },
            {
              key: "/wfh-request",
              icon: <HomeWorkIcon fontSize="small" />,
              label: "Work From Home",
              onClick: () => navigate("/wfh-request"),
            },
            {
              key: "/comp-off",
              icon: <AccessTimeIcon fontSize="small" />,
              label: "Comp Off",
              onClick: () => navigate("/comp-off"),
            },
          ],
        },
        {
          key: "/employee-form",
          icon: <ManageAccountsIcon fontSize="small" />,
          label: "Complete Profile",
          onClick: () => navigate("/employee-form"),
        },
        {
          key: "/my-payslip",
          icon: <PaymentsIcon fontSize="small" />,
          label: "My Payslip",
          onClick: () => navigate("/my-payslip"),
        },
      ],
    },
  ]

  const sections = role === "admin" ? adminSections : employeeSections

  const renderItem = (item) => {
    const isActive = location.pathname === item.key
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openDropdowns[item.key]

    return (
      <div key={item.key}>
        <button
          onClick={item.onClick}
          className={`group flex items-center w-full px-3 py-2 rounded-lg text-sm transition-all duration-150
            ${isActive ? "bg-white text-orange-500 shadow-sm" : "text-gray-800 hover:bg-white/70 hover:text-gray-900"}`}
          title={!sidebarOpen ? item.label : ""}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full">
              <span className={`flex-shrink-0 ${isActive ? "text-orange-500" : "text-gray-500 group-hover:text-gray-900"}`}>
                {item.icon}
              </span>
              <span className="truncate flex-1 text-left font-normal text-inherit">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto flex-shrink-0 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronDownIcon
                  onClick={(e) => { e.stopPropagation(); toggleDropdown(item.key) }}
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 cursor-pointer ${isOpen ? "rotate-180" : ""}`}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full relative">
              <span className={`${isActive ? "text-orange-500" : "text-gray-500"}`}>{item.icon}</span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
          )}
        </button>

        {hasChildren && isOpen && sidebarOpen && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-2">
            {item.children.map((child) => renderItem(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-[#f3f5f7] border-r border-gray-200 overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}>
      <nav className="flex-1 pt-4 pb-2 px-2 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {sections.map((section) => (
          <div key={section.heading} className="mb-2">
            {sidebarOpen && (
              <p className="text-[10px] font-bold text-orange-600 px-3 mb-1 tracking-wider">
                {section.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className={`px-3 py-3 border-t border-gray-200 ${!sidebarOpen ? "flex justify-center" : ""}`}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">{employeeName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">{employeeName}</div>
              <div className="text-xs text-gray-500 capitalize truncate">{role}</div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">{employeeName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
