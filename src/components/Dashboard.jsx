import React from "react";
import WFHManagerDashboard from "./WFHManagerDashboard"; // ✅ Only WFH Import

const Dashboard = ({ activeTab }) => {
  return (
    <div className="dashboard-container p-6">
      <WFHManagerDashboard activeTab={activeTab} />
    </div>
  );
};

export default Dashboard;
