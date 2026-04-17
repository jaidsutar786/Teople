import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  DocumentChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import {
  getDashboardSummary,
  getMonthlySalaryTrend,
  getDepartmentWiseSalary,
  getAttendanceAnalytics,
  getSalaryDistribution,
  getRecentActivities,
  sendCompOffUsageNotifications,
} from '../api';

const AdminDashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [salaryDistribution, setSalaryDistribution] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedYear]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log('🔄 Loading dashboard data...');

      const [
        summary,
        trend,
        department,
        attendance,
        distribution,
        activities
      ] = await Promise.all([
        getDashboardSummary().catch(err => {
          console.error('❌ Error loading summary:', err);
          return { total_employees: 0, salaries_this_month: 0, total_salary_amount: 0 };
        }),
        getMonthlySalaryTrend(selectedYear).catch(err => {
          console.error('❌ Error loading trend:', err);
          return { months: [], salary_data: [], employee_count_data: [] };
        }),
        getDepartmentWiseSalary().catch(err => {
          console.error('❌ Error loading department data:', err);
          return { departments: [], salary_totals: [], employee_counts: [] };
        }),
        getAttendanceAnalytics().catch(err => {
          console.error('❌ Error loading attendance:', err);
          return { present_days: 0, leave_days: 0, wfh_days: 0, comp_off_days: 0 };
        }),
        getSalaryDistribution().catch(err => {
          console.error('❌ Error loading distribution:', err);
          return { ranges: [], counts: [] };
        }),
        getRecentActivities().catch(err => {
          console.error('❌ Error loading activities:', err);
          return [];
        })
      ]);

      console.log('✅ Dashboard data loaded successfully');
      console.log('📊 Attendance Data:', attendance);
      console.log('📈 Salary Distribution:', distribution);

      setSummaryData(summary);
      setMonthlyTrend(trend);
      setDepartmentData(department);
      setAttendanceData(attendance);
      setSalaryDistribution(distribution);
      setRecentActivities(activities);

    } catch (error) {
      console.error('❌ Critical error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCompOffNotifications = async () => {
    setNotifSending(true);
    setNotifResult(null);
    try {
      const now = new Date();
      const data = await sendCompOffUsageNotifications(now.getMonth() + 1, now.getFullYear());
      setNotifResult({ success: true, message: data.message, sent_to: data.sent_to, skipped: data.skipped });
    } catch (e) {
      setNotifResult({ success: false, message: e?.response?.data?.error || 'Kuch galat hua' });
    } finally {
      setNotifSending(false);
    }
  };

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart options and data configurations
  const monthlyTrendOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Monthly Salary Trend - ${selectedYear}`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label.includes('Salary')) {
                label += formatCurrency(context.parsed.y);
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '₹' + value.toLocaleString();
          }
        },
        title: {
          display: true,
          text: 'Salary Amount (₹)'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Number of Employees'
        }
      },
    },
  };

  const monthlyTrendChartData = {
    labels: monthlyTrend?.months || [],
    datasets: [
      {
        label: 'Total Salary',
        data: monthlyTrend?.salary_data || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y',
        type: 'bar',
      },
      {
        label: 'Employees Paid',
        data: monthlyTrend?.employee_count_data || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        yAxisID: 'y1',
        type: 'line',
        tension: 0.4,
        fill: false,
      }
    ],
  };

  const departmentChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Department-wise Salary Distribution (Current Month)',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)} (${departmentData?.employee_counts[context.dataIndex]} employees)`;
          }
        }
      }
    },
  };

  const departmentChartData = {
    labels: departmentData?.departments || [],
    datasets: [
      {
        label: 'Total Salary',
        data: departmentData?.salary_totals || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const attendanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Distribution (Current Month)',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = attendanceData?.percentages?.[label.toLowerCase()] || 0;
            return `${label}: ${value} days (${percentage}%)`;
          }
        }
      }
    },
  };

  const attendanceChartData = {
    labels: ['Present', 'Leave', 'WFH', 'Comp Off'],
    datasets: [
      {
        label: 'Days',
        data: [
          attendanceData?.present_days || 0,
          attendanceData?.leave_days || 0,
          attendanceData?.wfh_days || 0,
          attendanceData?.comp_off_days || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(6, 182, 212, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(6, 182, 212, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const salaryDistributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Employee Salary Distribution (Current Month)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Employees'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Salary Ranges (₹)'
        }
      }
    },
  };

  const salaryDistributionData = {
    labels: salaryDistribution?.ranges || [],
    datasets: [
      {
        label: 'Number of Employees',
        data: salaryDistribution?.counts || [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if critical data is missing
  if (!summaryData && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Unable to load dashboard data.</p>
          <button onClick={loadDashboardData} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Salary and Attendance Analytics</p>
          </div>
        </div>
      </div>

      {/* Year Selector */}
      <div className="mb-6 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600 mt-6">
          Current Month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Employees"
          value={summaryData?.total_employees || 0}
          subtitle="Active employees"
          icon={<UsersIcon className="h-6 w-6" />}
          color="blue"
        />
        <SummaryCard
          title="Salaries This Month"
          value={summaryData?.salaries_this_month || 0}
          subtitle="Processed salaries"
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="green"
        />
        <SummaryCard
          title="Total Salary Amount"
          value={formatCurrency(summaryData?.total_salary_amount || 0)}
          subtitle="This month's payout"
          icon={<DocumentChartBarIcon className="h-6 w-6" />}
          color="purple"
        />
        <SummaryCard
          title="Pending Requests"
          value={(summaryData?.pending_leaves || 0) + (summaryData?.pending_wfh || 0)}
          subtitle="Approval required"
          icon={<ClockIcon className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Key Insights Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">October 2024:</span> {formatCurrency(14400)} total salary for 3 employees
          </div>
          <div>
            <span className="font-medium">November 2024:</span> {formatCurrency(9600)} total salary for 2 employees
          </div>
          <div>
            <span className="font-medium">Attendance:</span> {attendanceData?.percentages?.present || 0}% present rate
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Bar options={monthlyTrendOptions} data={monthlyTrendChartData} />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>October:</strong> {formatCurrency(14400)} (3 employees)</p>
            <p><strong>November:</strong> {formatCurrency(9600)} (2 employees)</p>
          </div>
        </div>

        {/* Department-wise Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Bar options={departmentChartOptions} data={departmentChartData} />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Engineering Department:</strong> {formatCurrency(14400)} (3 employees)</p>
            <p><strong>Average Salary:</strong> {formatCurrency(4800)} per employee</p>
          </div>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Doughnut options={attendanceChartOptions} data={attendanceChartData} />
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p><strong>Total Working Days:</strong> {attendanceData?.total_working_days || 0}</p>
            <p><strong>Present Rate:</strong> {attendanceData?.percentages?.present || 0}%</p>
          </div>
        </div>

        {/* Salary Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <Bar options={salaryDistributionOptions} data={salaryDistributionData} />
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>All employees</strong> are in ₹0-20,000 salary range</p>
            <p><strong>Average Salary:</strong> {formatCurrency(4800)} per employee</p>
          </div>
        </div>
      </div>

      {/* Recent Activities and Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Salary Activities</h3>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.employee_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.year, activity.month - 1).toLocaleString('default', { month: 'long' })} {activity.year} • {activity.present_days} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(activity.amount)}</p>
                    <p className="text-xs text-gray-500">{activity.generated_at}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <StatItem
              label="Comp Off Balance"
              value={`${summaryData?.total_comp_off_hours || 0} hours`}
            />
            <StatItem
              label="Average Attendance"
              value={`${attendanceData?.percentages?.present || 0}%`}
            />
            <StatItem
              label="Leave Rate"
              value={`${attendanceData?.percentages?.leave || 0}%`}
            />
            <StatItem
              label="WFH Rate"
              value={`${attendanceData?.percentages?.wfh || 0}%`}
            />
            <StatItem
              label="Avg Salary/Employee"
              value={formatCurrency(4800)}
            />
            <StatItem
              label="Total Processed"
              value={formatCurrency(14400 + 9600)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full bg-white">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Stat Item Component
const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-200">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export default AdminDashboard;


