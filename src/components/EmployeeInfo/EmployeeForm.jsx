import React, { useState } from "react";
import api from "../../api";

export default function EmployeeForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    contact_number: "",
    personal_email: "",
    alternate_number: "",
    current_address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          errors[name] = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors[name] = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors[name] = 'Name can only contain letters and spaces';
        }
        break;
        
      case 'personal_email':
        if (!value.trim()) {
          errors[name] = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[name] = 'Please enter a valid email address';
        }
        break;
        
      case 'contact_number':
        if (!value.trim()) {
          errors[name] = 'Contact number is required';
        } else if (!/^[6-9]\d{9}$/.test(value)) {
          errors[name] = 'Please enter a valid 10-digit mobile number';
        }
        break;
        
      case 'alternate_number':
        if (value.trim() && !/^[6-9]\d{9}$/.test(value)) {
          errors[name] = 'Please enter a valid 10-digit mobile number';
        }
        break;
        
      default:
        break;
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Real-time validation
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError[name] || null
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    Object.keys(formData).forEach(key => {
      const fieldError = validateField(key, formData[key]);
      if (fieldError[key]) {
        errors[key] = fieldError[key];
      }
    });
    
    // Check for duplicate phone numbers
    if (formData.contact_number && formData.alternate_number && 
        formData.contact_number === formData.alternate_number) {
      errors.alternate_number = 'Alternate number cannot be same as contact number';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the errors above');
      return;
    }
    
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      // Split full_name into first_name and last_name
      const nameParts = formData.full_name.trim().split(' ');
      const submitData = {
        ...formData,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || nameParts[0] || '', // If no last name, use first name
      };
      delete submitData.full_name; // Remove full_name as backend expects first_name and last_name
      
      const response = await api.post("/api/employee-form/submit/", submitData);
      alert("✅ Employee information submitted successfully!");
      setFormData({
        full_name: "",
        contact_number: "",
        personal_email: "",
        alternate_number: "",
        current_address: "",
      });
    } catch (err) {
      if (err.response?.data) {
        const backendErrors = err.response.data;
        setFieldErrors(backendErrors);
        setError('Please fix the errors above');
      } else {
        setError('Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🆔 Employee Basic Information
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.full_name ? 'border-red-500' : ''
              }`}
            />
            {fieldErrors.full_name && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Personal Email *
            </label>
            <input
              type="email"
              name="personal_email"
              value={formData.personal_email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.personal_email ? 'border-red-500' : ''
              }`}
            />
            {fieldErrors.personal_email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.personal_email}</p>
            )}
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Contact Number *
              </label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.contact_number ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.contact_number && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.contact_number}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Alternate Number
              </label>
              <input
                type="text"
                name="alternate_number"
                value={formData.alternate_number}
                onChange={handleChange}
                placeholder="Enter alternate number (optional)"
                maxLength="10"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.alternate_number ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.alternate_number && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.alternate_number}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Current Address
            </label>
            <textarea
              name="current_address"
              value={formData.current_address}
              onChange={handleChange}
              placeholder="Enter current address"
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Employee Information"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
