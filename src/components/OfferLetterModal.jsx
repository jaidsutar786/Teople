import React, { useState } from 'react';
import { generateOfferLetter, sendOfferLetterEmail } from '../api';
import toast from 'react-hot-toast';

const OfferLetterModal = ({ employee, onClose, onSuccess }) => {
  const [offerDate, setOfferDate] = useState('');
  const [ctc, setCtc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await generateOfferLetter(employee.id, offerDate, ctc);
      setPdfUrl(data.pdf_url);
      setShowActions(true);
      toast.success('Offer letter generated successfully!', {
        position: 'top-right',
        duration: 3000,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate offer letter');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await sendOfferLetterEmail(employee.id);
      setIsSent(true);
      toast.success('Offer letter sent successfully!', {
        position: 'top-right',
        duration: 3000,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send offer letter');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPdfUrl(null);
    setShowActions(false);
    setIsSent(false);
    setOfferDate('');
    setCtc('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Generate Offer Letter</h2>
          <p className="text-sm text-orange-50 mt-1">For {employee.first_name} {employee.last_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Position:</strong> {employee.position}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {employee.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Offer Date
            </label>
            <input
              type="date"
              value={offerDate}
              onChange={(e) => setOfferDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monthly CTC (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={ctc}
              onChange={(e) => setCtc(e.target.value)}
              placeholder="Enter monthly CTC"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-150"
            >
              Cancel
            </button>
            {!showActions ? (
              <button 
                type="submit" 
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            ) : !isSent ? (
              <>
                <a
                  href={`http://localhost:8000${pdfUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-150"
                >
                  View PDF
                </a>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Regenerate
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferLetterModal;
