import React, { useEffect, useState } from 'react';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';

// Professional, accessible and well-structured Employee Detailed Profile
// Typography improvements: headings and data are visually distinct.
// - Labels: small, uppercase, muted
// - Values: larger, bolder, darker
// - Panel titles: larger and separated with subtle border

const EmployeeDetailedProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/employee-form/get/', { signal: controller.signal });
        setProfileData(response.data);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Error fetching profile:', err);
          setError('Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();

    return () => controller.abort();
  }, []);

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      await api.post('/profile/upload-picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile picture uploaded successfully!', {
        position: 'top-right',
        duration: 3000,
      });
      // refresh data
      const response = await api.get('/employee-form/get/');
      setProfileData(response.data);
    } catch (err) {
      console.error('Upload error', err);
      toast.error('Failed to upload profile picture!', {
        position: 'top-right',
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-28 bg-white rounded-xl shadow-sm" />
            <div className="h-64 bg-white rounded-xl shadow-sm" />
            <div className="h-44 bg-white rounded-xl shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profileData?.personal_info) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No profile data found</p>
          <p className="text-gray-500 text-sm mt-2">Please complete the employee form first</p>
        </div>
      </div>
    );
  }

  const { personal_info, documents } = profileData;

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Notification */}
        {notification && (
          <div
            role="status"
            className={`rounded-md px-4 py-3 text-sm shadow ${
              notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Header */}
        <header className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-6">
          <ProfilePictureUploader
            src={profileData.employee?.profile_picture}
            alt={`${personal_info.first_name} ${personal_info.last_name}`}
            initials={`${personal_info.first_name?.charAt(0) || ''}${personal_info.last_name?.charAt(0) || ''}`}
            onUpload={handleProfilePictureUpload}
            uploading={uploading}
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight truncate">
              {personal_info.first_name} {personal_info.middle_name || ''} {personal_info.last_name}
            </h1>
            <p className="text-sm text-gray-500 mt-2 truncate">{personal_info.personal_email}</p>
            <p className="text-xs text-indigo-600 mt-3 font-medium uppercase tracking-wide">Employee Profile</p>
          </div>

        </header>

        {/* Two-column main area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Personal info */}
          <section className="lg:col-span-2 space-y-6">
            <Panel title="Personal Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem label="Date of Birth" value={formatDate(personal_info.date_of_birth)} />
                <InfoItem label="Gender" value={personal_info.gender} />
                <InfoItem label="Marital Status" value={personal_info.marital_status} />
                <InfoItem label="Nationality" value={personal_info.nationality} />
                <InfoItem label="Blood Group" value={personal_info.blood_group} />
                <InfoItem label="Parent Name" value={personal_info.parent_name} />
                <InfoItem label="Contact Number" value={personal_info.contact_number} />
                <InfoItem label="Alternate Number" value={personal_info.alternate_number} />
                <InfoItem label="Emergency Contact" value={personal_info.emergency_contact_name} />
                <InfoItem label="Emergency Number" value={personal_info.emergency_contact_number} />
                <div className="sm:col-span-2 lg:col-span-3">
                  <InfoItem label="Permanent Address" value={personal_info.permanent_address} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <InfoItem label="Current Address" value={personal_info.current_address} />
                </div>
              </div>
            </Panel>

            <Panel title="Document Details">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <InfoItem label="Aadhar Number" value={personal_info.aadhar_number} />
                <InfoItem label="PAN Number" value={personal_info.pan_number} />
                <InfoItem label="Passport Number" value={personal_info.passport_number} />
              </div>

              {documents ? (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.aadhar_pdf && <DocumentLink label="Aadhar Card" url={documents.aadhar_pdf} />}
                    {documents.pan_pdf && <DocumentLink label="PAN Card" url={documents.pan_pdf} />}
                    {documents.passport_pdf && <DocumentLink label="Passport" url={documents.passport_pdf} />}
                    {documents.tenth_marksheet && <DocumentLink label="10th Marksheet" url={documents.tenth_marksheet} />}
                    {documents.twelfth_marksheet && <DocumentLink label="12th Marksheet" url={documents.twelfth_marksheet} />}
                    {documents.highest_qualification_doc && (
                      <DocumentLink label="Highest Qualification" url={documents.highest_qualification_doc} />
                    )}
                    {documents.additional_certifications && (
                      <DocumentLink label="Additional Certifications" url={documents.additional_certifications} />
                    )}
                    {documents.skill_certificates && <DocumentLink label="Skill Certificates" url={documents.skill_certificates} />}
                    {documents.company1_offer_letter && (
                      <DocumentLink label="Company 1 Offer Letter" url={documents.company1_offer_letter} />
                    )}
                    {documents.company1_experience_letter && (
                      <DocumentLink label="Company 1 Experience Letter" url={documents.company1_experience_letter} />
                    )}
                    {documents.company1_salary_slips && (
                      <DocumentLink label="Company 1 Salary Slips" url={documents.company1_salary_slips} />
                    )}
                    {documents.company2_offer_letter && (
                      <DocumentLink label="Company 2 Offer Letter" url={documents.company2_offer_letter} />
                    )}
                    {documents.company2_experience_letter && (
                      <DocumentLink label="Company 2 Experience Letter" url={documents.company2_experience_letter} />
                    )}
                    {documents.company2_salary_slips && (
                      <DocumentLink label="Company 2 Salary Slips" url={documents.company2_salary_slips} />
                    )}
                    {documents.bank_document && <DocumentLink label="Bank Document" url={documents.bank_document} />}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded.</p>
              )}
            </Panel>

            <Panel title="Educational Qualifications">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                  <InfoItem label="10th Marks" value={personal_info.tenth_marks} />
                  <InfoItem label="Year" value={personal_info.tenth_year} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                  <InfoItem label="12th Marks" value={personal_info.twelfth_marks} />
                  <InfoItem label="Year" value={personal_info.twelfth_year} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
                  <InfoItem label="Highest Qualification" value={personal_info.highest_qualification} />
                  <InfoItem label="Marks/CGPA" value={personal_info.highest_qualification_marks} />
                  <InfoItem label="Year" value={personal_info.highest_qualification_year} />
                  <InfoItem label="University" value={personal_info.university_name} />
                </div>
              </div>
            </Panel>

            {/* Employment History */}
            {(personal_info.company1_name || personal_info.company2_name) && (
              <Panel title="Employment History">
                <div className="space-y-4">
                  {personal_info.company1_name && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-md">
                      <h3 className="font-medium text-base text-gray-800 mb-3">Company 1</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="Company Name" value={personal_info.company1_name} />
                        <InfoItem label="Experience" value={personal_info.company1_experience} />
                        <InfoItem label="From Date" value={formatDate(personal_info.company1_from_date)} />
                        <InfoItem label="To Date" value={formatDate(personal_info.company1_to_date)} />
                      </div>
                    </div>
                  )}

                  {personal_info.company2_name && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-md">
                      <h3 className="font-medium text-base text-gray-800 mb-3">Company 2</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="Company Name" value={personal_info.company2_name} />
                        <InfoItem label="Experience" value={personal_info.company2_experience} />
                        <InfoItem label="From Date" value={formatDate(personal_info.company2_from_date)} />
                        <InfoItem label="To Date" value={formatDate(personal_info.company2_to_date)} />
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </section>

          {/* Right column: Bank & quick actions */}
          <aside className="space-y-6">
            <Panel title="Bank Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <InfoItem label="Bank Name" value={personal_info.bank_name} />
                <InfoItem label="Account Number" value={personal_info.account_number} />
                <InfoItem label="IFSC Code" value={personal_info.ifsc_code} />
                <InfoItem label="Account Holder" value={personal_info.account_holder_name} />
                <InfoItem label="PAN (Bank)" value={personal_info.pan_number_bank} />
                <InfoItem label="UAN Number" value={personal_info.uan_number} />
                <InfoItem label="ESIC Number" value={personal_info.esic_number} />
                <InfoItem label="Tax Regime" value={personal_info.tax_regime} />
              </div>
            </Panel>

          </aside>
        </div>
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

/* ---------- Helper components ---------- */

const Panel = ({ title, children }) => (
  <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
    {title && <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">{title}</h2>}
    <div>{children}</div>
  </section>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] md:text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">{label}</p>
    <p className="text-sm md:text-base text-gray-900 font-medium break-words">{value || <span className="text-gray-400">N/A</span>}</p>
  </div>
);

const DocumentLink = ({ label, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-md transition-all"
  >
    <span className="text-2xl" aria-hidden>
      📄
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
      <p className="text-xs text-gray-500">View Document</p>
    </div>
    <div className="text-xs text-blue-600">Open</div>
  </a>
);

const ProfilePictureUploader = ({ src, alt, initials, onUpload, uploading }) => {
  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <div className="relative">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-28 h-28 rounded-full object-cover border-2 border-gray-100 shadow-sm"
        />
      ) : (
        <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-700 border-2 border-gray-100">
          {initials}
        </div>
      )}

      <label className="absolute -right-1 -bottom-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm cursor-pointer hover:shadow-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
          aria-label="Upload profile picture"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm8 3a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </label>

      {uploading && (
        <div className="absolute inset-0 rounded-full bg-white bg-opacity-60 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-b-2 border-gray-600 rounded-full" />
        </div>
      )}
    </div>
  );
};

/* ---------- Utilities ---------- */

function formatDate(value) {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  } catch (e) {
    return value;
  }
}

export default EmployeeDetailedProfile;
