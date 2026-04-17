import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Steps, message, Upload, Row, Col, Card, Spin, Divider, Space } from 'antd';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { submitEmployeeForm, clearRevisionRequest, getEmployeeProfile } from '../../api';
import FormConfirmationModal from '../FormConfirmationModal';
import LogoutModal from '../LogoutModal';

const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

const MultiStepEmployeeForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [companies, setCompanies] = useState([1]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [fileList, setFileList] = useState({});

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setDataLoading(true);
        const existingData = await getEmployeeProfile();
        
        if (existingData && existingData.personal_info) {
          const data = existingData.personal_info;
          form.setFieldsValue({
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
  }, [form]);

  const handleFileChange = (file, fieldName) => {
    setFileList({ ...fileList, [fieldName]: file });
    return false;
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch {
      message.error('Please fill all required fields');
    }
  };

  const handlePreSubmit = async () => {
    try {
      await form.validateFields();
      setShowConfirmModal(true);
    } catch {
      message.error('Please fill all required fields');
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      const values = form.getFieldsValue(true);

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

      Object.keys(values).forEach(key => {
        if (values[key]) {
          const backendKey = fieldMapping[key] || key;
          formDataToSend.append(backendKey, values[key]);
        }
      });

      Object.keys(fileList).forEach(key => {
        if (fileList[key]) formDataToSend.append(key, fileList[key]);
      });

      await submitEmployeeForm(formDataToSend);

      try {
        await clearRevisionRequest();
      } catch (err) {
        console.log('No revision request to clear');
      }

      setShowLogoutModal(true);
    } catch (error) {
      const errData = error?.response?.data;
      if (errData && typeof errData === 'object') {
        const msgs = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        message.error(msgs || 'Failed to submit form');
      } else {
        message.error(errData || error?.message || 'Failed to submit form');
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Personal Info', icon: <PersonIcon style={{ fontSize: 18 }} /> },
    { title: 'Documents', icon: <DescriptionIcon style={{ fontSize: 18 }} /> },
    { title: 'Education', icon: <SchoolIcon style={{ fontSize: 18 }} /> },
    { title: 'Employment', icon: <WorkIcon style={{ fontSize: 18 }} /> },
    { title: 'Bank Details', icon: <AccountBalanceIcon style={{ fontSize: 18 }} /> }
  ];

  if (dataLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spin size="large" tip="Loading your profile data..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form form={form} layout="vertical" size="large" preserve>
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First name is required' }]}>
                    <Input placeholder="Enter first name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="middleName" label="Middle Name">
                    <Input placeholder="Enter middle name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Last name is required' }]}>
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: 'Date of birth is required' }]}>
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Gender is required' }]}>
                    <Select placeholder="Select gender">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="maritalStatus" label="Marital Status" rules={[{ required: true, message: 'Marital status is required' }]}>
                    <Select placeholder="Select status">
                      <Option value="single">Single</Option>
                      <Option value="married">Married</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="nationality" label="Nationality" rules={[{ required: true, message: 'Nationality is required' }]}>
                    <Input placeholder="e.g., Indian" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="parentName" label="Father's/Mother's Name" rules={[{ required: true, message: 'Parent name is required' }]}>
                    <Input placeholder="Enter parent name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="contactNumber" label="Contact Number" rules={[{ required: true, message: 'Contact number is required' }, { pattern: /^[0-9]{10}$/, message: 'Enter valid 10 digit number' }]}>
                    <Input placeholder="+91 XXXXXXXXXX" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="alternateNumber" label="Alternate Number" rules={[{ pattern: /^[0-9]{10}$/, message: 'Enter valid 10 digit number' }]}>
                    <Input placeholder="+91 XXXXXXXXXX" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24}>
                  <Form.Item name="personalEmail" label="Personal Email" rules={[{ required: true, message: 'Personal email is required' }, { type: 'email', message: 'Enter valid email' }]}>
                    <Input placeholder="your.email@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24}>
                  <Form.Item name="permanentAddress" label="Permanent Address" rules={[{ required: true, message: 'Permanent address is required' }]}>
                    <TextArea rows={3} placeholder="Enter your permanent address" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24}>
                  <Form.Item name="currentAddress" label="Current Address" rules={[{ required: true, message: 'Current address is required' }]}>
                    <TextArea rows={3} placeholder="Enter your current address" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="bloodGroup" label="Blood Group" rules={[{ required: true, message: 'Blood group is required' }]}>
                    <Select placeholder="Select blood group">
                      <Option value="A+">A+</Option>
                      <Option value="A-">A-</Option>
                      <Option value="B+">B+</Option>
                      <Option value="B-">B-</Option>
                      <Option value="O+">O+</Option>
                      <Option value="O-">O-</Option>
                      <Option value="AB+">AB+</Option>
                      <Option value="AB-">AB-</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Step 2: Documents */}
          {currentStep === 1 && (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item name="aadharNumber" label="Aadhar Number" rules={[{ required: true, message: 'Aadhar number is required' }, { pattern: /^[0-9]{12}$/, message: 'Enter valid 12 digit Aadhar number' }]}>
                    <Input placeholder="Enter Aadhar number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item label="Aadhar Document" rules={[{ required: true, message: 'Aadhar document is required' }]}>
                    <Upload beforeUpload={(file) => handleFileChange(file, 'aadhar_pdf')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.aadhar_pdf ? fileList.aadhar_pdf.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={24} md={8}>
                  <Form.Item name="panNumber" label="PAN Number" rules={[{ required: true, message: 'PAN number is required' }, { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Enter valid PAN (e.g. ABCDE1234F)' }]}>
                    <Input placeholder="Enter PAN number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item label="PAN Document" rules={[{ required: true, message: 'PAN document is required' }]}>
                    <Upload beforeUpload={(file) => handleFileChange(file, 'pan_pdf')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.pan_pdf ? fileList.pan_pdf.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={24} md={8}>
                  <Form.Item name="passportNumber" label="Passport Number">
                    <Input placeholder="Enter passport number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item label="Passport Document">
                    <Upload beforeUpload={(file) => handleFileChange(file, 'passport_pdf')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.passport_pdf ? fileList.passport_pdf.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Step 3: Education */}
          {currentStep === 2 && (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="tenthMarks" label="10th Marks" rules={[{ required: true, message: '10th marks is required' }]}>
                    <Input placeholder="Enter marks/CGPA" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="tenthYear" label="10th Year" rules={[{ required: true, message: '10th year is required' }]}>
                    <Input placeholder="Enter passing year" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item label="10th Marksheet">
                    <Upload beforeUpload={(file) => handleFileChange(file, 'tenth_marksheet')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.tenth_marksheet ? fileList.tenth_marksheet.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="twelfthMarks" label="12th Marks" rules={[{ required: true, message: '12th marks is required' }]}>
                    <Input placeholder="Enter marks/CGPA" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="twelfthYear" label="12th Year" rules={[{ required: true, message: '12th year is required' }]}>
                    <Input placeholder="Enter passing year" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item label="12th Marksheet">
                    <Upload beforeUpload={(file) => handleFileChange(file, 'twelfth_marksheet')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.twelfth_marksheet ? fileList.twelfth_marksheet.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="highestQualification" label="Highest Qualification" rules={[{ required: true, message: 'Highest qualification is required' }]}>
                    <Input placeholder="e.g., B.Tech, MBA" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="highestQualificationMarks" label="Marks/CGPA" rules={[{ required: true, message: 'Marks/CGPA is required' }]}>
                    <Input placeholder="Enter marks/CGPA" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="highestQualificationYear" label="Year of Passing" rules={[{ required: true, message: 'Year of passing is required' }]}>
                    <Input placeholder="Enter passing year" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="universityName" label="University Name" rules={[{ required: true, message: 'University name is required' }]}>
                    <Input placeholder="Enter university name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Form.Item label="Qualification Document">
                    <Upload beforeUpload={(file) => handleFileChange(file, 'highest_qualification_doc')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.highest_qualification_doc ? fileList.highest_qualification_doc.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Step 4: Employment */}
          {currentStep === 3 && (
            <>
              <Form.Item name="experienceType" label="Experience Type" rules={[{ required: true, message: 'Experience type is required' }]}>
                <Select placeholder="Select experience type">
                  <Option value="fresher">Fresher</Option>
                  <Option value="experienced">Experienced</Option>
                </Select>
              </Form.Item>

              {form.getFieldValue('experienceType') === 'experienced' && (
                <>
                  {companies.map((companyId, index) => (
                    <Card 
                      key={companyId}
                      style={{ marginBottom: 16 }}
                      title={`Company ${index + 1}`}
                      extra={companies.length > 1 && (
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteIcon style={{ fontSize: 16 }} />}
                          onClick={() => setCompanies(companies.filter(id => id !== companyId))}
                        >
                          Remove
                        </Button>
                      )}
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item name={`company${companyId}Name`} label="Company Name">
                            <Input placeholder="Enter company name" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name={`company${companyId}Experience`} label="Experience">
                            <Input placeholder="e.g., 2 years" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name={`company${companyId}FromDate`} label="From Date">
                            <Input type="date" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name={`company${companyId}ToDate`} label="To Date">
                            <Input type="date" />
                          </Form.Item>
                        </Col>
                        <Col xs={24}>
                          <Divider orientation="left" style={{ fontSize: 12 }}>Documents (Optional)</Divider>
                          <Space wrap>
                            <Upload beforeUpload={(file) => handleFileChange(file, `company${companyId}_offer_letter`)} showUploadList={false} accept=".pdf">
                              <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>Offer Letter</Button>
                            </Upload>
                            <Upload beforeUpload={(file) => handleFileChange(file, `company${companyId}_experience_letter`)} showUploadList={false} accept=".pdf">
                              <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>Experience Letter</Button>
                            </Upload>
                            <Upload beforeUpload={(file) => handleFileChange(file, `company${companyId}_salary_slips`)} showUploadList={false} accept=".pdf">
                              <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>Salary Slips</Button>
                            </Upload>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button 
                    type="dashed" 
                    onClick={() => setCompanies([...companies, companies.length + 1])}
                    icon={<AddIcon style={{ fontSize: 18 }} />}
                    block
                  >
                    Add Another Company
                  </Button>
                </>
              )}
            </>
          )}

          {/* Step 5: Bank Details */}
          {currentStep === 4 && (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="bankName" label="Bank Name" rules={[{ required: true, message: 'Bank name is required' }]}>
                    <Input placeholder="Enter bank name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Bank Document" rules={[{ required: true, message: 'Bank document is required' }]}>
                    <Upload beforeUpload={(file) => handleFileChange(file, 'bank_document')} showUploadList={false} accept=".pdf">
                      <Button icon={<UploadFileIcon style={{ fontSize: 16 }} />}>{fileList.bank_document ? fileList.bank_document.name : 'Upload PDF'}</Button>
                    </Upload>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="accountNumber" label="Account Number" rules={[{ required: true, message: 'Account number is required' }, { pattern: /^[0-9]{9,18}$/, message: 'Enter valid account number' }]}>
                    <Input placeholder="Enter account number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="ifscCode" label="IFSC Code" rules={[{ required: true, message: 'IFSC code is required' }, { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Enter valid IFSC code (e.g. SBIN0001234)' }]}>
                    <Input placeholder="Enter IFSC code" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="accountHolderName" label="Account Holder Name" rules={[{ required: true, message: 'Account holder name is required' }]}>
                    <Input placeholder="Enter account holder name" />
                  </Form.Item>
                </Col>

              </Row>
            </>
          )}
        </Form>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          {currentStep > 0 && (
            <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>
              Previous
            </Button>
          )}
          
          <span style={{ color: '#666' }}>
            Step {currentStep + 1} of {steps.length}
          </span>
          
          {currentStep < 4 ? (
            <Button type="primary" size="large" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              type="primary" 
              size="large" 
              onClick={handlePreSubmit} 
              loading={loading}
              icon={<CheckCircleOutlinedIcon style={{ fontSize: 18 }} />}
            >
              Review & Submit
            </Button>
          )}
        </div>
      </Card>

      <FormConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        formData={form.getFieldsValue()}
        files={fileList}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default MultiStepEmployeeForm;