import { useState } from 'react';
import { Modal, Button, Input, Form } from 'antd';
import { generateOfferLetter, sendOfferLetterEmail } from '../api';
import toast from 'react-hot-toast';

const OfferLetterModal = ({ employee, onClose, onSuccess }) => {
  const [offerDate, setOfferDate] = useState('');
  const [ctc, setCtc] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleGenerate = async () => {
    if (!offerDate || !ctc) { toast.error('Please fill all fields!'); return; }
    setLoading(true);
    try {
      const data = await generateOfferLetter(employee.id, offerDate, ctc);
      setPdfUrl(data.pdf_url);
      setShowActions(true);
      toast.success('Offer letter generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate offer letter');
    } finally { setLoading(false); }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await sendOfferLetterEmail(employee.id);
      setIsSent(true);
      toast.success('Offer letter sent successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send offer letter');
    } finally { setLoading(false); }
  };

  const handleRegenerate = () => {
    setPdfUrl(null); setShowActions(false); setIsSent(false);
    setOfferDate(''); setCtc('');
  };

  const footer = !showActions ? [
    <Button key="cancel" onClick={onClose}>Cancel</Button>,
    <Button key="generate" type="primary" loading={loading} onClick={handleGenerate}>Generate</Button>,
  ] : !isSent ? [
    <Button key="cancel" onClick={onClose}>Cancel</Button>,
    <Button key="view" href={`http://localhost:8000${pdfUrl}`} target="_blank" rel="noopener noreferrer">View PDF</Button>,
    <Button key="send" type="primary" loading={loading} onClick={handleSendEmail}>Send Email</Button>,
  ] : [
    <Button key="close" onClick={onClose}>Close</Button>,
    <Button key="regen" type="primary" onClick={handleRegenerate}>Regenerate</Button>,
  ];

  return (
    <Modal
      title="Generate Offer Letter"
      open={true}
      onCancel={onClose}
      footer={footer}
      width={480}
      centered
    >
      <div className="space-y-4 mt-2">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">Employee:</span> {employee.first_name} {employee.last_name}</p>
          <p><span className="font-medium">Position:</span> {employee.position || '—'}</p>
          <p><span className="font-medium">Email:</span> {employee.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Offer Date</label>
          <Input type="date" value={offerDate} onChange={e => setOfferDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly CTC (₹)</label>
          <Input type="number" placeholder="Enter monthly CTC" value={ctc} onChange={e => setCtc(e.target.value)} />
        </div>
        {isSent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            ✓ Offer letter sent successfully to {employee.email}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OfferLetterModal;
