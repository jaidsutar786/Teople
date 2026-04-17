import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ConfigProvider } from "antd";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "./components/MainLayout";
import EmployeeTable from "./components/EmployeeTable";
import SalaryManagement from "./components/salary";
import WFHRequestForm from "./components/WFHRequestForm";
import CompOffForm from "./components/CompOffForm";
import LeaveRequestForm from "./components/LeaveRequestForm";

import "./index.css";
import SalaryAttendance, { SalaryAttendanceRoute } from "./components/SalaryCreate";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeHome from "./components/EmployeeInfo/EmployeeHome";
import AdminHome from "../src/components/AdminHome";
import { NotificationProvider } from "./context/NotificationContext";
import Notifications from "./components/Notifications";
import EmployeeSalarySlips from "./components/EmployeeSalarySlips";
import EmployeePayslip from "./components/EmployeePayslip";
import MyOfferLetter from "./components/MyOfferLetter";
import MultiStepEmployeeForm from "./components/EmployeeInfo/MultiStepEmployeeForm";
import EmployeeDetailedProfile from "./components/EmployeeDetailedProfile";
import EmployeeManagement from "./components/EmployeeManagement";
import LeaveManagement from "./components/LeaveManagement";
import AdminNotes from "./components/AdminNotes";
import Assets from "./components/Assets";
import AccountingDashboard from "./components/accounting/AccountingDashboard";
import InvoiceManagement from "./components/accounting/InvoiceManagement";
import PaymentManagement from "./components/accounting/PaymentManagement";
import ExpenseManagement from "./components/accounting/ExpenseManagement";
import SalaryExpenseManagement from "./components/accounting/SalaryExpenseManagement";
import CustomerManagement from "./components/accounting/CustomerManagement";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <NotificationProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#f97316',
            colorPrimaryHover: '#ea580c',
            colorPrimaryActive: '#c2410c',
          },
          components: {
            Button: {
              defaultBorderColor: '#f97316',
              defaultColor: '#f97316',
              defaultHoverBorderColor: '#ea580c',
              defaultHoverColor: '#ea580c',
            },
          },
        }}
      >
      <Router>
        <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-home" element={<AdminHome />} />
          <Route path="/dashboard" element={<Navigate to="/admin-home" replace />} />
          <Route path="/requests/leave" element={<Dashboard activeTab="leaves" />} />
          <Route path="/requests/wfh" element={<Dashboard activeTab="wfh" />} />
          <Route path="/requests/compoff" element={<Dashboard activeTab="compoff" />} />
          <Route path="/employee" element={<EmployeeTable />} />
          <Route path="/employee-management" element={<EmployeeManagement />} />
          <Route path="/Salary" element={<SalaryManagement />} />
          <Route path="/salary-attendance/:id" element={<SalaryAttendanceRoute />} />
          <Route path="/leave-management" element={<LeaveManagement />} />
          <Route path="/admin-notes" element={<AdminNotes />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/accounting/dashboard"     element={<AccountingDashboard />} />
          <Route path="/accounting/customers"     element={<CustomerManagement />} />
          <Route path="/accounting/invoices"      element={<InvoiceManagement />} />
          <Route path="/accounting/payments"      element={<PaymentManagement />} />
          <Route path="/accounting/expenses"      element={<ExpenseManagement />} />
          <Route path="/accounting/salary-expense" element={<SalaryExpenseManagement />} />
        </Route>

        {/* Employee Routes */}
        <Route
          element={
            <PrivateRoute allowedRoles={["employee"]}>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* Employee Form - Optional */}
          <Route path="/employee-form" element={<MultiStepEmployeeForm />} />
          
          {/* Employee Routes - Direct access without form completion check */}
          <Route path="/employee-home" element={<EmployeeHome />} />
          <Route path="/employee-salary" element={<EmployeeSalarySlips />} />
          <Route path="/my-payslip" element={<EmployeePayslip />} />
          <Route path="/my-offer-letter" element={<MyOfferLetter />} />
          <Route path="/my-profile" element={<EmployeeDetailedProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/wfh-request" element={<WFHRequestForm />} />
          <Route path="/comp-off" element={<CompOffForm />} />
          <Route path="/leave-request" element={<LeaveRequestForm />} />
        </Route>



        {/* Unauthorized Page */}
        <Route path="/unauthorized" element={<h1>Unauthorized</h1>} />
      </Routes>
      </Router>
      </ConfigProvider>
    </NotificationProvider>
  );
}

export default App;