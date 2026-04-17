
import { useState, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { useNotifications } from "../context/NotificationContext"

import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize"
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts"
import PeopleIcon from "@mui/icons-material/People"
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
import BarChartIcon from "@mui/icons-material/BarChart"
import GroupIcon from "@mui/icons-material/Group"
import HomeIcon from "@mui/icons-material/Home"

const Sidebar = ({ sidebarOpen, onProfileClick }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const employeeName = localStorage.getItem("employeeName") || "Employee"
  const role = localStorage.getItem("role")
  const { pendingRequests, liveWorkingCount } = useNotifications()

  const homePath = role === "admin" ? "/admin-home" : "/employee-home"
  const [openDropdowns, setOpenDropdowns] = useState({})
  const toggleDropdown = (key) => setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }))

  const adminSections = [
    {
      heading: "MAIN",
      items: [
        { key: homePath, icon: <DashboardCustomizeIcon fontSize="small" />, label: "Dashboard", onClick: () => navigate(homePath), badge: liveWorkingCount },
      ],
    },
    {
      heading: "PEOPLE",
      items: [
        {
          key: "/employee-section", icon: <PeopleIcon fontSize="small" />, label: "Employees",
          onClick: () => toggleDropdown("/employee-section"),
          children: [
            { key: "/employee", icon: <PeopleIcon fontSize="small" />, label: "Add Employee", onClick: () => navigate("/employee") },
            { key: "/employee-management", icon: <ManageAccountsIcon fontSize="small" />, label: "Employee Management", onClick: () => navigate("/employee-management") },
          ],
        },
      ],
    },
    {
      heading: "ATTENDANCE",
      items: [
        { key: "/leave-management", icon: <BeachAccessIcon fontSize="small" />, label: "Leave Management", onClick: () => navigate("/leave-management") },
        {
          key: "/requests", icon: <AssignmentIcon fontSize="small" />, label: "Requests",
          onClick: () => toggleDropdown("/requests"), badge: pendingRequests.total,
          children: [
            { key: "/requests/leave", icon: <BeachAccessIcon fontSize="small" />, label: "Leave", onClick: () => navigate("/requests/leave"), badge: pendingRequests.leave },
            { key: "/requests/wfh", icon: <HomeWorkIcon fontSize="small" />, label: "Work From Home", onClick: () => navigate("/requests/wfh"), badge: pendingRequests.wfh },
            { key: "/requests/compoff", icon: <AccessTimeIcon fontSize="small" />, label: "Comp Off", onClick: () => navigate("/requests/compoff"), badge: pendingRequests.comp_off },
          ],
        },
      ],
    },
    {
      heading: "PAYROLL",
      items: [
        { key: "/Salary", icon: <PaymentsIcon fontSize="small" />, label: "Salary Management", onClick: () => navigate("/Salary") },
        { key: "/assets", icon: <DevicesIcon fontSize="small" />, label: "Assets", onClick: () => navigate("/assets") },
        { key: "/admin-notes", icon: <NoteAltIcon fontSize="small" />, label: "Admin Notes", onClick: () => navigate("/admin-notes") },
      ],
    },
    {
      heading: "ACCOUNTING",
      items: [
        {
          key: "/accounting", icon: <ReceiptLongIcon fontSize="small" />, label: "Accounting",
          onClick: () => toggleDropdown("/accounting"),
          children: [
            { key: "/accounting/dashboard", icon: <BarChartIcon fontSize="small" />, label: "Dashboard", onClick: () => navigate("/accounting/dashboard") },
            { key: "/accounting/customers", icon: <GroupIcon fontSize="small" />, label: "Customers", onClick: () => navigate("/accounting/customers") },
            { key: "/accounting/invoices", icon: <DescriptionIcon fontSize="small" />, label: "Invoices", onClick: () => navigate("/accounting/invoices") },
            { key: "/accounting/payments", icon: <AccountBalanceWalletIcon fontSize="small" />, label: "Payments", onClick: () => navigate("/accounting/payments") },
            { key: "/accounting/expenses", icon: <MoneyOffIcon fontSize="small" />, label: "Expenses", onClick: () => navigate("/accounting/expenses") },
            { key: "/accounting/salary-expense", icon: <SavingsIcon fontSize="small" />, label: "Salary Expense", onClick: () => navigate("/accounting/salary-expense") },
          ],
        },
      ],
    },
  ]

  const employeeSections = [
    {
      heading: "MAIN",
      items: [
        { key: homePath, icon: <HomeIcon fontSize="small" />, label: "Dashboard", onClick: () => navigate(homePath) },
      ],
    },
    {
      heading: "MY WORK",
      items: [
        {
          key: "/requests", icon: <AssignmentIcon fontSize="small" />, label: "Requests",
          onClick: () => toggleDropdown("/requests"),
          children: [
            { key: "/leave-request", icon: <BeachAccessIcon fontSize="small" />, label: "Leave", onClick: () => navigate("/leave-request") },
            { key: "/wfh-request", icon: <HomeWorkIcon fontSize="small" />, label: "Work From Home", onClick: () => navigate("/wfh-request") },
            { key: "/comp-off", icon: <AccessTimeIcon fontSize="small" />, label: "Comp Off", onClick: () => navigate("/comp-off") },
          ],
        },
        { key: "/employee-form", icon: <ManageAccountsIcon fontSize="small" />, label: "Complete Profile", onClick: () => navigate("/employee-form") },
        { key: "/my-payslip", icon: <PaymentsIcon fontSize="small" />, label: "My Payslip", onClick: () => navigate("/my-payslip") },
      ],
    },
  ]

  const sections = role === "admin" ? adminSections : employeeSections

  const [flyout, setFlyout] = useState(null) // { key, top } for collapsed flyout

  const renderItem = (item, isChild = false) => {
    const isActive = item.children
      ? item.children.some(child => location.pathname === child.key)
      : location.pathname === item.key
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openDropdowns[item.key]

    const handleCollapsedClick = (e, it) => {
      if (!sidebarOpen && hasChildren) {
        const rect = e.currentTarget.getBoundingClientRect()
        setFlyout(flyout?.key === it.key ? null : { key: it.key, top: rect.top, item: it })
      } else {
        it.onClick()
        setFlyout(null)
      }
    }

    return (
      <div key={item.key} className="relative">
        <button
          onClick={(e) => handleCollapsedClick(e, item)}
          title={!sidebarOpen ? item.label : ""}
          className={`group flex items-center w-full rounded-lg text-sm transition-all duration-150 
            ${isChild ? "px-3 py-1.5" : "px-3 py-2"}
            ${isActive
              ? "text-orange-400"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full">
              <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"} `}>
                {item.icon}
              </span>
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className={`ml-auto flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white`}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronDownIcon
                  onClick={(e) => { e.stopPropagation(); toggleDropdown(item.key) }}
                  className={`w-3.5 h-3.5 transition-transform duration-200 cursor-pointer ${isOpen ? "rotate-180" : ""} ${isActive ? "text-white" : "text-gray-500"}`}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full relative">
              <span className={`${isActive ? "text-white" : "text-gray-400"}`}>{item.icon}</span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
          )}
        </button>

        {hasChildren && isOpen && sidebarOpen && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
            {item.children.map((child) => renderItem(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}
      style={{ background: "linear-gradient(180deg, #0f3460 0%, #16213e 60%, #1a1a2e 100%)" }}
    >
      {/* Nav */}
      <nav className="flex-1 pt-6 pb-4 px-2 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {sections.map((section) => (
          <div key={section.heading} className="mb-4">
            {sidebarOpen && (
              <p className="text-[9px] font-bold text-gray-500 px-3 mb-1.5 tracking-widest uppercase">
                {section.heading}
              </p>
            )}
            {!sidebarOpen && <div className="h-px bg-white/10 mx-2 mb-2" />}
            <div className="space-y-0.5">
              {section.items.map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* Flyout for collapsed sidebar */}
      {!sidebarOpen && flyout && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setFlyout(null)} />
          <div
            className="fixed z-50 bg-[#16213e] border border-white/10 rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{
              top: Math.min(flyout.top, window.innerHeight - (flyout.item.children.length * 40 + 40)),
              left: 64
            }}
          >
            <p className="text-[10px] font-bold text-gray-500 px-3 py-1.5 uppercase tracking-widest">
              {flyout.item.label}
            </p>
            {flyout.item.children.map((child) => (
              <button
                key={child.key}
                onClick={() => { child.onClick(); setFlyout(null) }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors
                  ${ location.pathname === child.key
                    ? 'text-orange-400 bg-white/10'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="flex-shrink-0">{child.icon}</span>
                <span>{child.label}</span>
                {child.badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">
                    {child.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar


