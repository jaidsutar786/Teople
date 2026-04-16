import React, { useState, useEffect } from 'react';
import { Drawer, Tabs, Typography, Button, Spin, Alert, Table, Empty, Tag } from 'antd';
import { FilePdfOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import { getProfile, getOfferLetter, getMonthlySalaryHistory, getEmployees, downloadProfessionalSalarySlip } from '../api';

const { Text } = Typography;

const OfferLetterTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const res = await getOfferLetter(profile.employee_profile.id);
        setData(res);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Offer letter not available yet.' : 'Failed to load.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}><Spin size="small" /></div>;
  if (error) return <Alert message={error} type="warning" showIcon style={{ marginTop: 12 }} />;

  const rows = [
    { label: 'Employee Name', value: data.employee_name },
    { label: 'Position', value: data.position },
    {
      label: 'Monthly CTC',
      value: <Text strong style={{ color: '#52c41a' }}>₹{data.ctc?.toLocaleString('en-IN')}</Text>
    },
    {
      label: 'Offer Date',
      value: new Date(data.offer_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    },
  ];

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '10px 0', width: '40%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{r.label}</Text>
              </td>
              <td style={{ padding: '10px 0' }}>
                <Text style={{ fontSize: 13 }}>{r.value}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          size="small" icon={<FilePdfOutlined />}
          href={data.pdf_url} target="_blank"
          style={{ borderColor: '#fa8c16', color: '#fa8c16', borderRadius: 6, fontSize: 12 }}
        >
          View
        </Button>
        <Button
          size="small" icon={<DownloadOutlined />}
          href={data.pdf_url} download
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          Download
        </Button>
      </div>
    </div>
  );
};

const SalarySlipsTab = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [empId, setEmpId] = useState(null);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    (async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const employees = await getEmployees();
        const emp = employees.find(e => e.user_id === user.id);
        if (!emp) return;
        setEmpId(emp.id);
        setSlips(await getMonthlySalaryHistory(emp.id));
      } catch {
        toast.error('Failed to load salary slips');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = async (slip) => {
    try {
      setDownloadingId(slip.id);
      await downloadProfessionalSalarySlip(empId, slip.month, slip.year);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      title: 'Period',
      render: (_, s) => <Text style={{ fontSize: 12 }}>{MONTHS[s.month - 1]} {s.year}</Text>,
    },
    {
      title: 'Net Salary',
      render: (_, s) => <Text style={{ fontSize: 12, color: '#52c41a' }}>₹{parseFloat(s.final_salary).toLocaleString('en-IN')}</Text>,
    },
    {
      title: 'Days',
      render: (_, s) => <Text type="secondary" style={{ fontSize: 11 }}>{s.present_days}/{s.total_working_days}</Text>,
    },
    {
      title: '',
      render: (_, s) => (
        <Button
          size="small" icon={<DownloadOutlined />}
          loading={downloadingId === s.id}
          onClick={() => handleDownload(s)}
          style={{ borderRadius: 6, fontSize: 11 }}
        />
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}><Spin size="small" /></div>;

  return slips.length === 0
    ? <Empty description="No salary slips yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 24 }} />
    : <Table
        dataSource={slips} columns={columns} rowKey="id"
        size="small" pagination={{ pageSize: 8, size: 'small' }}
        style={{ fontSize: 12 }}
      />;
};

const EmployeeDocDrawer = ({ open, onClose, activeTab = 'offer' }) => {
  const employeeName = localStorage.getItem('employeeName') || 'Employee';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={380}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#f5f5f5', border: '1px solid #e8e8e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#595959', fontWeight: 600, fontSize: 13,
          }}>
            {employeeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{employeeName}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>My Documents</Text>
          </div>
        </div>
      }
      styles={{ header: { padding: '12px 16px' }, body: { padding: '0 16px 16px' } }}
    >
      <Tabs
        key={activeTab}
        defaultActiveKey={activeTab}
        size="small"
        items={[
          {
            key: 'offer',
            label: <span style={{ fontSize: 12 }}><FilePdfOutlined style={{ marginRight: 4 }} />Offer Letter</span>,
            children: <OfferLetterTab />,
          },
          {
            key: 'salary',
            label: <span style={{ fontSize: 12 }}><FileTextOutlined style={{ marginRight: 4 }} />Salary Slips</span>,
            children: <SalarySlipsTab />,
          },
        ]}
      />
    </Drawer>
  );
};

export default EmployeeDocDrawer;
