import { useState } from "react";
import { generateRelievingLetter, sendRelievingLetterEmail } from "../api";
import toast from 'react-hot-toast';

const RelievingLetterModal = ({ employee, onClose, onSuccess }) => {
  const [relievingDate, setRelievingDate] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleGenerate = async () => {
    if (!relievingDate || !lastWorkingDay) {
      toast.error('Please fill all fields!', {
        position: 'top-right',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const data = await generateRelievingLetter(employee.id, relievingDate, lastWorkingDay);
      setPdfUrl(data.pdf_url);
      setShowActions(true);
      toast.success('Relieving letter generated successfully!', {
        position: 'top-right',
        duration: 3000,
      });
    } catch (error) {
      console.error("Error generating relieving letter:", error);
      toast.error('Failed to generate relieving letter!', {
        position: 'top-right',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await sendRelievingLetterEmail(employee.id);
      setIsSent(true);
      toast.success('Relieving letter sent successfully!', {
        position: 'top-right',
        duration: 3000,
      });
      onSuccess();
    } catch (error) {
      console.error("Error sending relieving letter:", error);
      toast.error('Failed to send relieving letter!', {
        position: 'top-right',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPdfUrl(null);
    setShowActions(false);
    setIsSent(false);
    setRelievingDate("");
    setLastWorkingDay("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Generate Relieving Letter</h2>
          <p className="text-sm text-orange-50 mt-1">For {employee.name}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Position:</strong> {employee.position}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {employee.email}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Note: Joining date will be fetched from offer letter
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Working Day
            </label>
            <input
              type="date"
              value={lastWorkingDay}
              onChange={(e) => setLastWorkingDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Relieving Letter Date
            </label>
            <input
              type="date"
              value={relievingDate}
              onChange={(e) => setRelievingDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-150"
          >
            Cancel
          </button>
          {!showActions ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate"}
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
                onClick={handleSendEmail}
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Email"}
              </button>
            </>
          ) : (
            <button
              onClick={handleRegenerate}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelievingLetterModal;
