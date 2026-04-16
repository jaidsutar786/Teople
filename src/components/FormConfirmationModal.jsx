import React from 'react';

const FormConfirmationModal = ({ isOpen, onClose, onConfirm, formData, files }) => {
  if (!isOpen) return null;

  const formatValue = (value) => value || 'Not provided';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Confirm Your Information</h2>
          <p className="text-orange-100 text-sm mt-1">Please review all details before submitting</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>👤</span> Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Name:</span> {formatValue(`${formData.firstName} ${formData.middleName} ${formData.lastName}`)}</div>
                <div><span className="font-medium">Date of Birth:</span> {formatValue(formData.dateOfBirth)}</div>
                <div><span className="font-medium">Gender:</span> {formatValue(formData.gender)}</div>
                <div><span className="font-medium">Contact:</span> {formatValue(formData.contactNumber)}</div>
                <div className="col-span-2"><span className="font-medium">Email:</span> {formatValue(formData.personalEmail)}</div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📄</span> Documents
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div><span className="font-medium">Aadhar:</span> {formatValue(formData.aadharNumber)}</div>
                <div><span className="font-medium">PAN:</span> {formatValue(formData.panNumber)}</div>
                <div><span className="font-medium">Passport:</span> {formatValue(formData.passportNumber)}</div>
              </div>
              <div className="border-t pt-3">
                <span className="font-medium text-sm block mb-2">Uploaded Documents:</span>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {Object.keys(files).length > 0 ? (
                    Object.entries(files).map(([key, file]) => (
                      <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-gray-700">{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">{file.name}</span>
                          <button 
                            onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                            className="text-blue-500 hover:text-blue-700 text-xs underline"
                          >
                            View
                          </button>
                          <span className="text-green-500">✓</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No documents uploaded</div>
                  )}
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🎓</span> Education
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div><span className="font-medium">10th Marks:</span> {formatValue(formData.tenthMarks)}</div>
                <div><span className="font-medium">12th Marks:</span> {formatValue(formData.twelfthMarks)}</div>
                <div><span className="font-medium">Highest Qualification:</span> {formatValue(formData.highestQualification)}</div>
                <div><span className="font-medium">University:</span> {formatValue(formData.universityName)}</div>
              </div>
              <div className="border-t pt-3">
                <span className="font-medium text-sm block mb-2">Education Documents:</span>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {['tenth_marksheet', 'twelfth_marksheet', 'highest_qualification_doc'].map(docType => (
                    files[docType] ? (
                      <div key={docType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-gray-700">{docType.replace(/_/g, ' ').toUpperCase()}: {files[docType].name}</span>
                        </div>
                        <button 
                          onClick={() => window.open(URL.createObjectURL(files[docType]), '_blank')}
                          className="text-blue-500 hover:text-blue-700 text-xs underline"
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      <div key={docType} className="flex items-center gap-2">
                        <span className="text-gray-400">○</span>
                        <span className="text-gray-500">{docType.replace(/_/g, ' ').toUpperCase()}: Not uploaded</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Employment */}
            {formData.experienceType === 'experienced' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💼</span> Employment
                </h3>
                <div className="space-y-2 text-sm">
                  {formData.company1Name && (
                    <div><span className="font-medium">Company 1:</span> {formatValue(formData.company1Name)} ({formatValue(formData.company1Experience)})</div>
                  )}
                  {formData.company2Name && (
                    <div><span className="font-medium">Company 2:</span> {formatValue(formData.company2Name)} ({formatValue(formData.company2Experience)})</div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏦</span> Bank Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div><span className="font-medium">Bank:</span> {formatValue(formData.bankName)}</div>
                <div><span className="font-medium">Account:</span> {formatValue(formData.accountNumber)}</div>
                <div><span className="font-medium">IFSC:</span> {formatValue(formData.ifscCode)}</div>
                <div><span className="font-medium">Account Holder:</span> {formatValue(formData.accountHolderName)}</div>
              </div>
              <div className="border-t pt-3">
                <span className="font-medium text-sm block mb-2">Bank Document:</span>
                <div className="text-xs">
                  {files.bank_document ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700">Bank Document: {files.bank_document.name}</span>
                      </div>
                      <button 
                        onClick={() => window.open(URL.createObjectURL(files.bank_document), '_blank')}
                        className="text-blue-500 hover:text-blue-700 text-xs underline"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span className="text-gray-500">Bank Document: Not uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Review Again
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormConfirmationModal;