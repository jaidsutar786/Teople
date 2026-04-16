import React, { useState, useEffect } from 'react';
import { Typography, Button, Alert, Spin, Tag, Row, Col } from 'antd';
import {
  FilePdfOutlined, DownloadOutlined, UserOutlined,
  TrophyOutlined, CalendarOutlined, DollarOutlined, FolderOpenOutlined,
} from '@ant-design/icons';
import { getProfile, getOfferLetter } from '../api';
import EmployeeDocDrawer from './EmployeeDocDrawer';

const { Title, Text, Paragraph } = Typography;

const InfoBlock = ({ icon, label, value, valueStyle }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '20px 24px', background: '#fafafa',
    borderRadius: 12, border: '1px solid #f0f0f0',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10, background: '#fff7e6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, color: '#fa8c16', flexShrink: 0, border: '1px solid #ffe7ba',
    }}>
      {icon}
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
      <Text strong style={{ fontSize: 16, ...valueStyle }}>{value}</Text>
    </div>
  </div>
);

const MyOfferLetter = () => {
  const [offerLetter, setOfferLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { fetchOfferLetter(); }, []);

  const fetchOfferLetter = async () => {
    try {
      const profileData = await getProfile();
      const data = await getOfferLetter(profileData.employee_profile.id);
      setOfferLetter(data);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Your offer letter is not available yet.' : 'Failed to load offer letter.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  if (error) return (
    <div style={{ padding: 40 }}>
      <Alert message="Offer Letter Not Available" description={error} type="warning" showIcon />
    </div>
  );

  return (
    <div style={{ padding: '36px 40px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Tag color="orange" style={{ marginBottom: 12, borderRadius: 20, padding: '2px 12px' }}>
            Official Document
          </Tag>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>🎉 Your Offer Letter</Title>
          <Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0, fontSize: 14 }}>
            Congratulations! Below are your official offer details from the HR department.
          </Paragraph>
        </div>
        <Button
          icon={<FolderOpenOutlined />}
          size="large"
          onClick={() => setDrawerOpen(true)}
          style={{ borderRadius: 8, fontWeight: 600, borderColor: '#fa8c16', color: '#fa8c16' }}
        >
          My Documents
        </Button>
      </div>

      {/* Info Blocks */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12}>
          <InfoBlock icon={<UserOutlined />} label="Employee Name" value={offerLetter.employee_name} />
        </Col>
        <Col xs={24} sm={12}>
          <InfoBlock icon={<TrophyOutlined />} label="Position" value={offerLetter.position} />
        </Col>
        <Col xs={24} sm={12}>
          <InfoBlock
            icon={<DollarOutlined />} label="Monthly CTC"
            value={`₹${offerLetter.ctc?.toLocaleString('en-IN')}`}
            valueStyle={{ color: '#52c41a', fontSize: 18 }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <InfoBlock
            icon={<CalendarOutlined />} label="Offer Date"
            value={new Date(offerLetter.offer_date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          />
        </Col>
      </Row>

      <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: 28 }} />

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <Button
          type="primary" icon={<FilePdfOutlined />} size="large"
          href={offerLetter.pdf_url} target="_blank" rel="noopener noreferrer"
          style={{ borderRadius: 8, fontWeight: 600, background: '#fa8c16', borderColor: '#fa8c16' }}
        >
          View Offer Letter
        </Button>
        <Button
          icon={<DownloadOutlined />} size="large"
          href={offerLetter.pdf_url} download
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Download PDF
        </Button>
      </div>

      <Alert
        message="Important Note"
        description="Please review your offer letter carefully. If you have any questions or concerns, kindly reach out to the HR department."
        type="info" showIcon style={{ borderRadius: 10 }}
      />

      <EmployeeDocDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default MyOfferLetter;
