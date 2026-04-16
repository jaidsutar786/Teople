import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #3B82F6',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 5,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    flex: 2,
  },
  value: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #E5E7EB',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableCol: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 5,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    marginTop: 5,
    fontWeight: 'bold',
    borderRadius: 3,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1pt solid #E5E7EB',
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  netSalarySection: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 5,
    border: '1pt solid #3B82F6',
    marginTop: 10,
  },
  compOffSection: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 5,
    border: '1pt solid #F59E0B',
    marginTop: 10,
  }
});

// Salary Slip PDF Component
const SalarySlipPDF = ({ employeeInfo, salaryData, employeeDetails, month, year }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>Teople Technologies</Text>
        <Text style={styles.title}>SALARY SLIP</Text>
        <Text style={{ fontSize: 10, textAlign: 'center', color: '#6B7280' }}>
          Period: {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <Text style={{ fontSize: 9, textAlign: 'center', color: '#6B7280', marginTop: 5 }}>
          Payment Date: {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Employee Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employee Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Employee ID:</Text>
          <Text style={styles.value}>TS{employeeInfo.id?.toString().padStart(4, '0')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.value}>{employeeInfo.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{employeeDetails?.department || employeeInfo.department || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{employeeDetails?.position || employeeInfo.position || 'N/A'}</Text>
        </View>
      </View>

      {/* Company Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={[styles.value, { textAlign: 'left', flex: 3 }]}>
            95, Maske Vasti Rd, Ravet, Pimpri-Chinchwad, Maharashtra 412101
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>+91 9420206555</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>admin@teople.co.in</Text>
        </View>
      </View>

      {/* Earnings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol}>Description</Text>
            <Text style={styles.tableCol}>Amount (₹)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>Basic Salary</Text>
            <Text style={styles.tableCol}>
              {Number(salaryData.gross_monthly_salary || 0).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>House Rent Allowance</Text>
            <Text style={styles.tableCol}>0.00</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>Other Allowances</Text>
            <Text style={styles.tableCol}>0.00</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.tableCol}>Total Earnings</Text>
            <Text style={styles.tableCol}>
              {Number(salaryData.gross_monthly_salary || 0).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Deductions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deductions</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol}>Description</Text>
            <Text style={styles.tableCol}>Amount (₹)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>Professional Tax</Text>
            <Text style={styles.tableCol}>
              {Number(salaryData.professional_tax || 0).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>Provident Fund</Text>
            <Text style={styles.tableCol}>0.00</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>Other Deductions</Text>
            <Text style={styles.tableCol}>0.00</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.tableCol}>Total Deductions</Text>
            <Text style={styles.tableCol}>
              {Number(salaryData.professional_tax || 0).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Net Salary */}
      <View style={styles.netSalarySection}>
        <View style={styles.row}>
          <Text style={[styles.label, { fontSize: 12, fontWeight: 'bold', color: '#1F2937' }]}>
            Net Salary Payable:
          </Text>
          <Text style={[styles.value, { fontSize: 14, color: '#3B82F6' }]}>
            ₹ {Number(salaryData.final_salary || 0).toLocaleString('en-IN', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
      </View>

      {/* Comp Off Usage Section */}
      {salaryData.comp_off_used > 0 && (
        <View style={styles.compOffSection}>
          <Text style={[styles.sectionTitle, { backgroundColor: '#F59E0B', color: '#FFFFFF' }]}>
            Comp Off Usage
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Comp Off Days Used:</Text>
            <Text style={styles.value}>{salaryData.comp_off_used || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Remaining Balance:</Text>
            <Text style={styles.value}>{salaryData.comp_off_carry_forward || 0} hours</Text>
          </View>
        </View>
      )}

      {/* Attendance Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Working Days:</Text>
          <Text style={styles.value}>{salaryData.total_working_days || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Present Days:</Text>
          <Text style={styles.value}>{salaryData.present_days || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Leave Days:</Text>
          <Text style={styles.value}>{salaryData.leave_days || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>WFH Days:</Text>
          <Text style={styles.value}>{salaryData.wfh_days || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Comp Off Days:</Text>
          <Text style={styles.value}>{salaryData.comp_off_days || 0}</Text>
        </View>
      </View>

      {/* Calculation Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calculation Method</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Salary Calculation:</Text>
          <Text style={styles.value}>
            {salaryData.salary_calculation_method === 'with_comp_off' ? 'With Comp Off' : 'Without Comp Off'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Per Day Salary:</Text>
          <Text style={styles.value}>
            ₹ {((Number(salaryData.gross_monthly_salary || 0) / Number(salaryData.total_working_days || 1))).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>This is a computer-generated salary slip and does not require signature</Text>
        <Text>For any queries, please contact HR Department | Phone: +91 9876543210 | Email: hr@techsolutions.com</Text>
        <Text style={{ marginTop: 5 }}>Generated on: {new Date().toLocaleString()}</Text>
      </View>
    </Page>
  </Document>
);

// Salary Slip Display Component
const SalarySlipDisplay = ({ 
  currentSalaryData, 
  employeeInfo, 
  employeeDetails, 
  setShowSalarySlip, 
  handleDownloadPDF, 
  generatingPDF, 
  month, 
  year 
}) => {
  if (!currentSalaryData) return null;

  // Use per day salary from backend response
  const perDaySalary = currentSalaryData.per_day_salary 
    ? Number(currentSalaryData.per_day_salary)
    : (currentSalaryData.total_days_in_month > 0 
        ? Number(currentSalaryData.gross_monthly_salary) / Number(currentSalaryData.total_days_in_month)
        : 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Salary Slip Preview</h3>
          <button
            onClick={() => setShowSalarySlip(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* PDF Download Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Download Salary Slip</h4>
            <p className="text-sm text-blue-700 mb-3">
              Download a professionally formatted PDF version of your salary slip.
            </p>
            <PDFDownloadLink 
              document={
                <SalarySlipPDF 
                  employeeInfo={employeeInfo}
                  salaryData={currentSalaryData}
                  employeeDetails={employeeDetails}
                  month={month}
                  year={year}
                />
              }
              fileName={`Salary_Slip_${employeeInfo.name}_${year}_${month + 1}.pdf`}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              {({ loading }) => (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {loading ? 'Generating PDF...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>

          {/* Salary Slip Content */}
          <div className="bg-white border-2 border-blue-600 rounded-lg p-8 mb-6">
            {/* Header */}
            <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teople Technologies</h1>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">SALARY SLIP</h2>
              <p className="text-gray-600">
                Period: {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-gray-500 text-sm">Payment Date: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Employee Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gray-100 p-2 rounded">Employee Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-semibold">TS{employeeInfo.id?.toString().padStart(4, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee Name:</span>
                    <span className="font-semibold">{employeeInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-semibold">{employeeDetails?.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Designation:</span>
                    <span className="font-semibold">{employeeDetails?.position || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gray-100 p-2 rounded">Company Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong>95, Maske Vasti Rd, Ravet, Pimpri-Chinchwad, Maharashtra 412101</p>
                  <p><strong>Phone:</strong> +91 9420206555</p>
                  <p><strong>Email:</strong> admin@teople.co.in</p>
                  <p><strong>Website:</strong> www.teople.co.in</p>
                </div>
              </div>
            </div>

            {/* Salary Calculation */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gray-100 p-2 rounded">Salary Calculation</h3>
              <div className="space-y-4">
                {/* Gross Salary */}
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-semibold text-gray-700">Gross Monthly Salary</p>
                    <p className="text-sm text-gray-600">
                      {currentSalaryData.total_working_days} working days × ₹{perDaySalary.toFixed(2)}/day
                    </p>
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    ₹{Number(currentSalaryData.gross_monthly_salary).toLocaleString('en-IN', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>

                {/* Professional Tax Deduction */}
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-semibold text-gray-700">Professional Tax</p>
                    <p className="text-sm text-gray-600">Statutory deduction</p>
                  </div>
                  <p className="text-xl font-bold text-red-700">
                    - ₹{Number(currentSalaryData.professional_tax).toLocaleString('en-IN', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>

                {/* Net Salary */}
                <div className="flex justify-between items-center p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div>
                    <p className="text-xl font-bold text-gray-900">Net Salary Payable</p>
                    <p className="text-gray-600">Amount transferred to bank account</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    ₹ {Number(currentSalaryData.final_salary).toLocaleString('en-IN', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Comp Off Usage */}
            {currentSalaryData.comp_off_used > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">Comp Off Usage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-yellow-700">Comp Off Days Used</p>
                    <p className="text-xl font-bold text-yellow-900">{currentSalaryData.comp_off_used}</p>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700">Remaining Balance</p>
                    <p className="text-xl font-bold text-yellow-900">{currentSalaryData.comp_off_carry_forward} hours</p>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 bg-gray-100 p-2 rounded">Attendance Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium">Working Days</p>
                  <p className="text-xl font-bold text-gray-900">{currentSalaryData.total_working_days}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Present</p>
                  <p className="text-xl font-bold text-gray-900">{currentSalaryData.present_days}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Leave</p>
                  <p className="text-xl font-bold text-gray-900">{currentSalaryData.leave_days || 0}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700 font-medium">WFH</p>
                  <p className="text-xl font-bold text-gray-900">{currentSalaryData.wfh_days || 0}</p>
                </div>
                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                  <p className="text-sm text-cyan-700 font-medium">Comp Off</p>
                  <p className="text-xl font-bold text-gray-900">{currentSalaryData.comp_off_days || 0}</p>
                </div>
              </div>
            </div>

            {/* Calculation Details */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Calculation Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Calculation Method</p>
                  <p className="font-semibold">
                    {currentSalaryData.salary_calculation_method === 'with_comp_off' ? 'With Comp Off' : 'Without Comp Off'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Per Day Salary</p>
                  <p className="font-semibold">₹{perDaySalary.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-600">
              <p>This is a computer-generated salary slip and does not require signature</p>
              <p>For any queries, please contact HR Department | Phone: +91 9876543210 | Email: hr@techsolutions.com</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <PrinterIcon className="h-5 w-5" />
              Print Slip
            </button>

            <button
              onClick={() => setShowSalarySlip(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySlipDisplay;