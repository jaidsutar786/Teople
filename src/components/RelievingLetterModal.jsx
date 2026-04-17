import { useState } from 'react';
import { Modal, Button, Input } from 'antd';
import { generateRelievingLetter, sendRelievingLetterEmail } from '../api';
import toast from 'react-hot-toast';

const RelievingLetterModal = ({ employee, onClose, onSuccess }) => {
  const [relievingDate, setRelievingDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleGenerate = async () => {
    if (!relievingDate || !lastWorkingDay) { toast.error('Please fill all fields!'); return; }
    setLoading(true);
    try {
      const data = await generateRelievingLetter(employee.id, relievingDate, lastWorkingDay);
      setPdfUrl(data.pdf_url);
      setShowActions(true);
      toast.success('Relieving letter generated successfully!');
    } catch (err) {
      toast.error('Failed to generate relieving letter!');
    } finally { setLoading(false); }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await sendRelievingLetterEmail(employee.id);
      setIsSent(true);
      toast.success('Relieving letter sent successfully!');
      onSuccess();
    } catch (err) {
      toast.error('Failed to send relieving letter!');
    } finally { setLoading(false); }
  };

  const handleRegenerate = () => {
    setPdfUrl(null); setShowActions(false); setIsSent(false);
    setRelievingDate(''); setLastWorkingDay('');
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
      title="Generate Relieving Letter"
      open={true}
      onCancel={onClose}
      footer={footer}
      width={480}
      centered
    >
      <div className="space-y-4 mt-2">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">Employee:</span> {employee.name || `${employee.first_name} ${employee.last_name}`}</p>
          <p><span className="font-medium">Position:</span> {employee.position || '—'}</p>
          <p><span className="font-medium">Email:</span> {employee.email}</p>
          <p className="text-xs text-gray-500">Note: Joining date will be fetched from offer letter</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day</label>
          <Input type="date" value={lastWorkingDay} onChange={e => setLastWorkingDay(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relieving Letter Date</label>
          <Input type="date" value={relievingDate} onChange={e => setRelievingDate(e.target.value)} />
        </div>
        {isSent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            ✓ Relieving letter sent successfully to {employee.email}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RelievingLetterModal;
