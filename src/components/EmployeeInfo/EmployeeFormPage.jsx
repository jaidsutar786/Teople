import React, { useState, useEffect } from 'react';
import { submitEmployeeForm, getEmployeeProfile } from '../../api';

const EmployeeFormPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', dateOfBirth: '', gender: '', maritalStatus: '', nationality: '',
    parentName: '', contactNumber: '', alternateNumber: '', personalEmail: '',
    permanentAddress: '', currentAddress: '', emergencyContactName: '',
    emergencyContactNumber: '', bloodGroup: '', aadharNumber: '', panNumber: '',
    passportNumber: '', tenthMarks: '', tenthYear: '', twelfthMarks: '', twelfthYear: '',
    highestQualification: '', highestQualificationMarks: '', highestQualificationYear: '',
    universityName: '', experienceType: '', company1Name: '', company1Experience: '',
    company1FromDate: '', company1ToDate: '', company2Name: '', company2Experience: '',
    company2FromDate: '', company2ToDate: '', bankName: '', accountNumber: '', ifscCode: '',
    accountHolderName: '', panNumberBank: '', uanNumber: '', esicNumber: '', taxRegime: ''
  });

  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [companies, setCompanies] = useState([{ id: 1 }]);

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setDataLoading(true);
        const existingData = await getEmployeeProfile();
        
        if (existingData && existingData.personal_info) {
          const data = existingData.personal_info;
          setFormData({
            firstName: data.first_name || '',
            middleName: data.middle_name || '',
            lastName: data.last_name || '',
            dateOfBirth: data.date_of_birth || '',
            gender: data.gender || '',
            maritalStatus: data.marital_status || '',
            nationality: data.nationality || '',
            parentName: data.parent_name || '',
            contactNumber: data.contact_number || '',
            alternateNumber: data.alternate_number || '',
            personalEmail: data.personal_email || '',
            permanentAddress: data.permanent_address || '',
            currentAddress: data.current_address || '',
            emergencyContactName: data.emergency_contact_name || '',
            emergencyContactNumber: data.emergency_contact_number || '',
            bloodGroup: data.blood_group || '',
            aadharNumber: data.aadhar_number || '',
            panNumber: data.pan_number || '',
            passportNumber: data.passport_number || '',
            tenthMarks: data.tenth_marks || '',
            tenthYear: data.tenth_year || '',
            twelfthMarks: data.twelfth_marks || '',
            twelfthYear: data.twelfth_year || '',
            highestQualification: data.highest_qualification || '',
            highestQualificationMarks: data.highest_qualification_marks || '',
            highestQualificationYear: data.highest_qualification_year || '',
            universityName: data.university_name || '',
            experienceType: data.experience_type || '',
            company1Name: data.company1_name || '',
            company1Experience: data.company1_experience || '',
            company1FromDate: data.company1_from_date || '',
            company1ToDate: data.company1_to_date || '',
            company2Name: data.company2_name || '',
            company2Experience: data.company2_experience || '',
            company2FromDate: data.company2_from_date || '',
            company2ToDate: data.company2_to_date || '',
            bankName: data.bank_name || '',
            accountNumber: data.account_number || '',
            ifscCode: data.ifsc_code || '',
            accountHolderName: data.account_holder_name || '',
            panNumberBank: data.pan_number_bank || '',
            uanNumber: data.uan_number || '',
            esicNumber: data.esic_number || '',
            taxRegime: data.tax_regime || ''
          });
        }
      } catch (error) {
        console.log('No existing data found or error loading data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, fieldName) => {
    setFiles({ ...files, [fieldName]: e.target.files[0] });
  };

  const addCompany = () => {
    setCompanies([...companies, { id: companies.length + 1 }]);
  };

  const removeCompany = (id) => {
    if (companies.length > 1) {
      setCompanies(companies.filter(c => c.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      const fieldMapping = {
        firstName: 'first_name', middleName: 'middle_name', lastName: 'last_name', dateOfBirth: 'date_of_birth', parentName: 'parent_name',
        contactNumber: 'contact_number', alternateNumber: 'alternate_number', personalEmail: 'personal_email',
        permanentAddress: 'permanent_address', currentAddress: 'current_address',
        emergencyContactName: 'emergency_contact_name', emergencyContactNumber: 'emergency_contact_number',
        bloodGroup: 'blood_group', aadharNumber: 'aadhar_number', panNumber: 'pan_number',
        passportNumber: 'passport_number', tenthMarks: 'tenth_marks', tenthYear: 'tenth_year',
        twelfthMarks: 'twelfth_marks', twelfthYear: 'twelfth_year',
        highestQualification: 'highest_qualification', highestQualificationMarks: 'highest_qualification_marks',
        highestQualificationYear: 'highest_qualification_year', universityName: 'university_name',
        experienceType: 'experience_type', company1Name: 'company1_name', company1Experience: 'company1_experience',
        company1FromDate: 'company1_from_date', company1ToDate: 'company1_to_date',
        company2Name: 'company2_name', company2Experience: 'company2_experience',
        company2FromDate: 'company2_from_date', company2ToDate: 'company2_to_date',
        bankName: 'bank_name', accountNumber: 'account_number', ifscCode: 'ifsc_code',
        accountHolderName: 'account_holder_name', panNumberBank: 'pan_number_bank',
        uanNumber: 'uan_number', esicNumber: 'esic_number', taxRegime: 'tax_regime',
        maritalStatus: 'marital_status'
      };

      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          const backendKey = fieldMapping[key] || key;
          formDataToSend.append(backendKey, formData[key]);
        }
      });

      Object.keys(files).forEach(key => {
        if (files[key]) formDataToSend.append(key, files[key]);
      });

      await submitEmployeeForm(formDataToSend);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">📋 Employee Information Form</h1>
            <p className="text-orange-100 mt-1 text-sm">Please fill all required fields marked with *</p>
          </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Personal Information */}
          <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">👤</span> Personal Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="First name" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Middle name" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Last name" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" required>
                  <option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status <span className="text-red-500">*</span></label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" required>
                  <option value="">Select Status</option><option value="single">Single</option><option value="married">Married</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="e.g., Indian" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Father's/Mother's Name</label>
                <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="+91 XXXXX XXXXX" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Number</label>
                <input type="tel" name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Optional" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Personal Email <span className="text-red-500">*</span></label>
                <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="your.email@example.com" required /></div>
              <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Permanent Address</label>
                <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} rows="2" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter permanent address" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Current Address</label>
                <textarea name="currentAddress" value={formData.currentAddress} onChange={handleChange} rows="2" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter current address" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name</label>
                <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Number</label>
                <input type="tel" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option value="">Select Blood Group</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                  <option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option></select></div>
            </div>
          </div>

          {/* Documents */}
          <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📝</span> Document Details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Aadhar Card Number</label>
                <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="XXXX XXXX XXXX" />
                <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'aadhar_pdf')} className="mt-3 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">PAN Card Number</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="ABCDE1234F" />
                <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'pan_pdf')} className="mt-3 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Passport Number (Optional)</label>
                <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Optional" />
                <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'passport_pdf')} className="mt-3 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer" /></div>
            </div>
          </div>

          {/* Education */}
          <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🎓</span> Educational Qualifications
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">10th Marks</label>
                  <input type="text" name="tenthMarks" value={formData.tenthMarks} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="%/CGPA" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
                  <input type="text" name="tenthYear" value={formData.tenthYear} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="YYYY" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Upload Document</label>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'tenth_marksheet')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">12th/Diploma Marks</label>
                  <input type="text" name="twelfthMarks" value={formData.twelfthMarks} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="%/CGPA" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
                  <input type="text" name="twelfthYear" value={formData.twelfthYear} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="YYYY" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">Upload Document</label>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'twelfth_marksheet')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Highest Qualification</label>
                  <input type="text" name="highestQualification" value={formData.highestQualification} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="B.Tech, MBA, etc." /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Marks/CGPA</label>
                  <input type="text" name="highestQualificationMarks" value={formData.highestQualificationMarks} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="%/CGPA" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Year of Passing</label>
                  <input type="text" name="highestQualificationYear" value={formData.highestQualificationYear} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="YYYY" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Upload Document</label>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'highest_qualification_doc')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">University/Institute Name</label>
                <input type="text" name="universityName" value={formData.universityName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter university name" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Additional Certifications (Optional)</label>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'additional_certifications')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Skill/Technical Certificates</label>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'skill_certificates')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer" /></div>
              </div>
            </div>
          </div>

          {/* Employment */}
          <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">💼</span> Employment & Job Details
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Experience Type</label>
                <select name="experienceType" value={formData.experienceType} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option value="">Select Experience Type</option><option value="fresher">Fresher</option><option value="experienced">Experienced</option></select></div>
              
              
              {formData.experienceType === 'experienced' && (
                <>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Previous Employment Proof (Optional)</label>
                <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'previous_employment_proof')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer" /></div>

              {companies.map((company, index) => (
                <div key={company.id} className="space-y-4 bg-gray-50 p-5 rounded-lg relative">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-bold text-gray-700">Company {index + 1}</h3>
                    {companies.length > 1 && (
                      <button type="button" onClick={() => removeCompany(company.id)} className="text-red-600 hover:text-red-800 font-semibold">
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                      <input type="text" name={`company${company.id}Name`} value={formData[`company${company.id}Name`] || ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter company name" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                      <input type="text" name={`company${company.id}Experience`} value={formData[`company${company.id}Experience`] || ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="e.g., 2 years" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                      <input type="date" name={`company${company.id}FromDate`} value={formData[`company${company.id}FromDate`] || ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                      <input type="date" name={`company${company.id}ToDate`} value={formData[`company${company.id}ToDate`] || ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Offer Letter</label>
                      <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, `company${company.id}_offer_letter`)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Experience Letter</label>
                      <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, `company${company.id}_experience_letter`)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-2">Salary Slips (Last 3)</label>
                      <input type="file" accept=".pdf,.jpg,.png" multiple onChange={(e) => handleFileChange(e, `company${company.id}_salary_slips`)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer" /></div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <button type="button" onClick={addCompany} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                  <span className="text-xl">+</span> Add Another Company
                </button>
              </div>
              </>
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🏦</span> Bank Details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter bank name" />
                <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'bank_document')} className="mt-3 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter account number" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="e.g., SBIN0001234" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="As per bank records" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number</label>
                <input type="text" name="panNumberBank" value={formData.panNumberBank} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="ABCDE1234F" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">UAN (EPF) - Optional</label>
                <input type="text" name="uanNumber" value={formData.uanNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="12 digit UAN" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">ESIC Number - Optional</label>
                <input type="text" name="esicNumber" value={formData.esicNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="17 digit ESIC" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Tax Regime</label>
                <select name="taxRegime" value={formData.taxRegime} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option value="">Select Tax Regime</option><option value="old">Old Regime</option><option value="new">New Regime</option></select></div>
            </div>
          </div>

          <div className="flex justify-center pt-8 pb-4">
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✔️</span>
                  <span>Submit Form</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFormPage;
