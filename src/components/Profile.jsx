"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Drawer, Typography, Spin, Button, Input, Form, Tabs, Tag, Modal, Slider } from "antd"
import {
  EditOutlined, SaveOutlined, CloseOutlined, UserOutlined,
  MailOutlined, PhoneOutlined, HomeOutlined, BankOutlined,
  SolutionOutlined, BookOutlined, IdcardOutlined, SafetyOutlined,
  CameraOutlined, ZoomInOutlined
} from "@ant-design/icons"
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { getProfile, updateProfile } from "../api"
import api from "../api"
import toast from "react-hot-toast"

const { Text } = Typography

const InfoRow = ({ icon, label, value }) => {
  if (!value) return null
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: "#fff7e6", border: "1px solid #ffe7ba", display: "flex", alignItems: "center", justifyContent: "center", color: "#fa8c16", flexShrink: 0, fontSize: 13 }}>
        {icon}
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>{label}</Text>
        <Text style={{ fontSize: 13 }}>{value}</Text>
      </div>
    </div>
  )
}

const SectionTitle = ({ title }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 4px" }}>
    {title}
  </div>
)

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight)
}

const Profile = ({ open, onClose }) => {
  const [employee, setEmployee] = useState(null)
  const [pi, setPi] = useState(null)
  const [docs, setDocs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  // Cropper states
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState("")
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [scale, setScale] = useState(1)
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { if (open) fetchProfile() }, [open])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await getProfile()

      const mapped = {
        firstName: data.employee_profile?.first_name || data.username,
        lastName: data.employee_profile?.last_name || "",
        email: data.email,
        phone: data.employee_profile?.phone || "",
        department: data.employee_profile?.department || data.role,
        position: data.employee_profile?.position || "",
        address: data.employee_profile?.address || "",
        role: data.role,
        profilePic: null,
      }

      // employee-form API sirf employee ke liye, sirf 1 baar
      if (data.role === 'employee') {
        try {
          const res = await api.get("/employee-form/get/")
          setPi(res.data?.personal_info || null)
          setDocs(res.data?.documents || null)
          if (res.data?.employee?.profile_picture) {
            mapped.profilePic = res.data.employee.profile_picture
          }
        } catch { setPi(null); setDocs(null) }
      }

      setEmployee(mapped)
      form.setFieldsValue(mapped)
    } catch {
      const fallback = {
        firstName: localStorage.getItem("employeeName") || "Employee",
        lastName: "", email: localStorage.getItem("email") || "",
        phone: "", department: "N/A", position: "N/A", address: "N/A",
        role: localStorage.getItem("role") || "employee",
      }
      setEmployee(fallback)
      form.setFieldsValue(fallback)
    } finally { setLoading(false) }
  }

  // ── File select → open cropper ──────────────────────────
  const onFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImgSrc(reader.result?.toString() || "")
      setScale(1)
      setCrop(undefined)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    setCrop(centerAspectCrop(w, h, 1))
  }, [])

  // ── Canvas → Blob → Upload ──────────────────────────────
  const handleCropUpload = async () => {
    if (!completedCrop || !imgRef.current) return
    setUploading(true)
    try {
      const canvas = document.createElement("canvas")
      const size = 300
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      const img = imgRef.current
      const scaleX = img.naturalWidth / img.width
      const scaleY = img.naturalHeight / img.height

      ctx.drawImage(
        img,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0, size, size
      )

      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92))
      const fd = new FormData()
      fd.append("profile_picture", blob, "profile.jpg")
      await api.post("/profile/upload-picture/", fd, { headers: { "Content-Type": "multipart/form-data" } })
      toast.success("Profile picture updated!")
      window.dispatchEvent(new CustomEvent("profile-updated"))
      setCropModalOpen(false)
      fetchProfile()
    } catch { toast.error("Upload failed") }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const v = form.getFieldsValue()
      await updateProfile({
        username: v.firstName,
        employee_profile: {
          first_name: v.firstName, last_name: v.lastName,
          phone: v.phone, address: v.address,
          position: v.position, department: v.department,
        },
      })
      toast.success("Profile updated!")
      setEditing(false)
      fetchProfile()
    } catch { toast.error("Failed to update profile") }
    finally { setSaving(false) }
  }

  const initials = employee ? employee.firstName.charAt(0).toUpperCase() : "U"
  const isEmployee = employee?.role !== "admin"

  // ── TABS ────────────────────────────────────────────────
  const PersonalTab = () => (
    <div>
      <SectionTitle title="Basic Info" />
      <InfoRow icon={<UserOutlined />} label="Full Name" value={pi ? `${pi.first_name} ${pi.middle_name || ""} ${pi.last_name}`.trim() : `${employee?.firstName} ${employee?.lastName}`} />
      <InfoRow icon={<MailOutlined />} label="Personal Email" value={pi?.personal_email || employee?.email} />
      <InfoRow icon={<PhoneOutlined />} label="Contact Number" value={pi?.contact_number || employee?.phone} />
      <InfoRow icon={<PhoneOutlined />} label="Alternate Number" value={pi?.alternate_number} />
      <InfoRow icon={<UserOutlined />} label="Date of Birth" value={pi?.date_of_birth} />
      <InfoRow icon={<UserOutlined />} label="Gender" value={pi?.gender} />
      <InfoRow icon={<UserOutlined />} label="Marital Status" value={pi?.marital_status} />
      <InfoRow icon={<UserOutlined />} label="Nationality" value={pi?.nationality} />
      <InfoRow icon={<UserOutlined />} label="Blood Group" value={pi?.blood_group} />
      <InfoRow icon={<UserOutlined />} label="Parent Name" value={pi?.parent_name} />
      <SectionTitle title="Address" />
      <InfoRow icon={<HomeOutlined />} label="Current Address" value={pi?.current_address || employee?.address} />
      <InfoRow icon={<HomeOutlined />} label="Permanent Address" value={pi?.permanent_address} />
      <SectionTitle title="Emergency Contact" />
      <InfoRow icon={<PhoneOutlined />} label="Name" value={pi?.emergency_contact_name} />
      <InfoRow icon={<PhoneOutlined />} label="Number" value={pi?.emergency_contact_number} />
      <SectionTitle title="Document Numbers" />
      <InfoRow icon={<IdcardOutlined />} label="Aadhar Number" value={pi?.aadhar_number} />
      <InfoRow icon={<IdcardOutlined />} label="PAN Number" value={pi?.pan_number} />
      <InfoRow icon={<IdcardOutlined />} label="Passport Number" value={pi?.passport_number} />
    </div>
  )

  const WorkTab = () => (
    <div>
      <SectionTitle title="Current Position" />
      <InfoRow icon={<BankOutlined />} label="Department" value={employee?.department} />
      <InfoRow icon={<SolutionOutlined />} label="Position" value={employee?.position} />
      {pi?.company1_name && (<>
        <SectionTitle title="Previous Company 1" />
        <InfoRow icon={<BankOutlined />} label="Company Name" value={pi.company1_name} />
        <InfoRow icon={<SolutionOutlined />} label="Experience" value={pi.company1_experience} />
        <InfoRow icon={<UserOutlined />} label="From" value={pi.company1_from_date} />
        <InfoRow icon={<UserOutlined />} label="To" value={pi.company1_to_date} />
      </>)}
      {pi?.company2_name && (<>
        <SectionTitle title="Previous Company 2" />
        <InfoRow icon={<BankOutlined />} label="Company Name" value={pi.company2_name} />
        <InfoRow icon={<SolutionOutlined />} label="Experience" value={pi.company2_experience} />
        <InfoRow icon={<UserOutlined />} label="From" value={pi.company2_from_date} />
        <InfoRow icon={<UserOutlined />} label="To" value={pi.company2_to_date} />
      </>)}
      {!pi?.company1_name && !pi?.company2_name && <Text type="secondary" style={{ fontSize: 12 }}>No employment history added</Text>}
    </div>
  )

  const EducationTab = () => (
    <div>
      <SectionTitle title="10th Standard" />
      <InfoRow icon={<BookOutlined />} label="Marks / %" value={pi?.tenth_marks} />
      <InfoRow icon={<BookOutlined />} label="Year" value={pi?.tenth_year} />
      <SectionTitle title="12th Standard" />
      <InfoRow icon={<BookOutlined />} label="Marks / %" value={pi?.twelfth_marks} />
      <InfoRow icon={<BookOutlined />} label="Year" value={pi?.twelfth_year} />
      <SectionTitle title="Highest Qualification" />
      <InfoRow icon={<BookOutlined />} label="Qualification" value={pi?.highest_qualification} />
      <InfoRow icon={<BookOutlined />} label="University" value={pi?.university_name} />
      <InfoRow icon={<BookOutlined />} label="Marks / %" value={pi?.highest_qualification_marks} />
      <InfoRow icon={<BookOutlined />} label="Year" value={pi?.highest_qualification_year} />
      {!pi?.tenth_marks && !pi?.highest_qualification && <Text type="secondary" style={{ fontSize: 12 }}>No education details added</Text>}
    </div>
  )

  const BankTab = () => (
    <div>
      <SectionTitle title="Bank Details" />
      <InfoRow icon={<BankOutlined />} label="Bank Name" value={pi?.bank_name} />
      <InfoRow icon={<SafetyOutlined />} label="Account Holder" value={pi?.account_holder_name} />
      <InfoRow icon={<IdcardOutlined />} label="Account Number" value={pi?.account_number} />
      <InfoRow icon={<IdcardOutlined />} label="IFSC Code" value={pi?.ifsc_code} />
      <SectionTitle title="Tax & Compliance" />
      <InfoRow icon={<IdcardOutlined />} label="PAN Number" value={pi?.pan_number_bank || pi?.pan_number} />
      <InfoRow icon={<IdcardOutlined />} label="UAN Number" value={pi?.uan_number} />
      <InfoRow icon={<IdcardOutlined />} label="ESIC Number" value={pi?.esic_number} />
      <InfoRow icon={<SafetyOutlined />} label="Tax Regime" value={pi?.tax_regime} />
      {!pi?.bank_name && <Text type="secondary" style={{ fontSize: 12 }}>No bank details added</Text>}
    </div>
  )

  const DocLink = ({ label, url }) => {
    if (!url) return null
    // Cloudinary raw PDF URL ko fl_attachment hata ke view karo
    const viewUrl = url.replace('/raw/upload/', '/image/upload/').replace('.pdf', '.pdf')
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
        <Text style={{ fontSize: 13 }}>{label}</Text>
        <div style={{ display: "flex", gap: 6 }}>
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            <Button size="small" icon={<IdcardOutlined />} style={{ borderRadius: 6, fontSize: 11, borderColor: "#fa8c16", color: "#fa8c16" }}>Download</Button>
          </a>
        </div>
      </div>
    )
  }

  const DocumentsTab = () => (
    <div>
      <SectionTitle title="Identity Documents" />
      <DocLink label="Aadhar Card" url={docs?.aadhar_pdf} />
      <DocLink label="PAN Card" url={docs?.pan_pdf} />
      <DocLink label="Passport" url={docs?.passport_pdf} />
      <SectionTitle title="Educational Documents" />
      <DocLink label="10th Marksheet" url={docs?.tenth_marksheet} />
      <DocLink label="12th Marksheet" url={docs?.twelfth_marksheet} />
      <DocLink label="Highest Qualification" url={docs?.highest_qualification_doc} />
      <DocLink label="Additional Certifications" url={docs?.additional_certifications} />
      <DocLink label="Skill Certificates" url={docs?.skill_certificates} />
      <SectionTitle title="Employment — Company 1" />
      <DocLink label="Offer Letter" url={docs?.company1_offer_letter} />
      <DocLink label="Experience Letter" url={docs?.company1_experience_letter} />
      <DocLink label="Salary Slips" url={docs?.company1_salary_slips} />
      <SectionTitle title="Employment — Company 2" />
      <DocLink label="Offer Letter" url={docs?.company2_offer_letter} />
      <DocLink label="Experience Letter" url={docs?.company2_experience_letter} />
      <DocLink label="Salary Slips" url={docs?.company2_salary_slips} />
      <SectionTitle title="Bank Documents" />
      <DocLink label="Bank Document" url={docs?.bank_document} />
      {!docs && <Text type="secondary" style={{ fontSize: 12 }}>No documents uploaded yet</Text>}
    </div>
  )

  const tabs = isEmployee ? [
    { key: "personal", label: <span style={{ fontSize: 12 }}><UserOutlined style={{ marginRight: 4 }} />Personal</span>, children: <PersonalTab /> },
    { key: "work", label: <span style={{ fontSize: 12 }}><SolutionOutlined style={{ marginRight: 4 }} />Work</span>, children: <WorkTab /> },
    { key: "education", label: <span style={{ fontSize: 12 }}><BookOutlined style={{ marginRight: 4 }} />Education</span>, children: <EducationTab /> },
    { key: "bank", label: <span style={{ fontSize: 12 }}><BankOutlined style={{ marginRight: 4 }} />Bank</span>, children: <BankTab /> },
    { key: "documents", label: <span style={{ fontSize: 12 }}><IdcardOutlined style={{ marginRight: 4 }} />Documents</span>, children: <DocumentsTab /> },
  ] : [
    { key: "personal", label: <span style={{ fontSize: 12 }}><UserOutlined style={{ marginRight: 4 }} />Personal</span>, children: <PersonalTab /> },
    { key: "work", label: <span style={{ fontSize: 12 }}><SolutionOutlined style={{ marginRight: 4 }} />Work</span>, children: <WorkTab /> },
  ]

  return (
    <>
      <Drawer
        open={open}
        onClose={() => { setEditing(false); onClose() }}
        placement="right"
        width={400}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* ── Avatar (bigger: 52px) ── */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {employee?.profilePic ? (
                <img src={employee.profilePic} alt="Profile"
                  style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #ffe7ba" }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fa8c16", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, border: "2px solid #ffe7ba" }}>
                  {initials}
                </div>
              )}
              {isEmployee && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: "#fa8c16", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                >
                  <CameraOutlined style={{ color: "#fff", fontSize: 10 }} />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} style={{ display: "none" }} />
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                {employee ? `${employee.firstName} ${employee.lastName}`.trim() : "Profile"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: "capitalize" }}>{employee?.role}</Text>
                {employee?.department && <Tag style={{ fontSize: 10, padding: "0 5px", margin: 0 }}>{employee.department}</Tag>}
              </div>
            </div>
          </div>
        }
        extra={
          isEmployee && !editing && (
            <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)}
              style={{ borderColor: "#fa8c16", color: "#fa8c16", borderRadius: 6 }}>
              Edit
            </Button>
          )
        }
        styles={{ header: { padding: "14px 16px" }, body: { padding: "0 16px 16px" } }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : editing ? (
          <Form form={form} layout="vertical" size="small" style={{ marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Form.Item label="First Name" name="firstName"><Input /></Form.Item>
              <Form.Item label="Last Name" name="lastName"><Input /></Form.Item>
            </div>
            <Form.Item label="Email"><Input value={employee?.email} disabled /></Form.Item>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Form.Item label="Phone" name="phone"><Input /></Form.Item>
              <Form.Item label="Department" name="department"><Input /></Form.Item>
            </div>
            <Form.Item label="Position" name="position"><Input /></Form.Item>
            <Form.Item label="Address" name="address"><Input.TextArea rows={2} /></Form.Item>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Button block onClick={() => setEditing(false)} icon={<CloseOutlined />} style={{ borderRadius: 6 }}>Cancel</Button>
              <Button block type="primary" loading={saving} onClick={handleSave} icon={<SaveOutlined />}
                style={{ borderRadius: 6, background: "#fa8c16", borderColor: "#fa8c16" }}>Save</Button>
            </div>
          </Form>
        ) : (
          <Tabs items={tabs} size="small" style={{ marginTop: 4 }} />
        )}
      </Drawer>

      {/* ── Crop Modal ── */}
      <Modal
        open={cropModalOpen}
        onCancel={() => setCropModalOpen(false)}
        title="Adjust Profile Photo"
        width={480}
        footer={[
          <Button key="cancel" onClick={() => setCropModalOpen(false)}>Cancel</Button>,
          <Button key="upload" type="primary" loading={uploading} onClick={handleCropUpload}
            style={{ background: "#fa8c16", borderColor: "#fa8c16" }}>
            Upload Photo
          </Button>
        ]}
      >
        {imgSrc && (
          <div>
            <div style={{ display: "flex", justifyContent: "center", background: "#f5f5f5", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                minWidth={50}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="crop"
                  onLoad={onImageLoad}
                  style={{ maxHeight: 320, maxWidth: "100%", transform: `scale(${scale})`, transformOrigin: "center", transition: "transform 0.1s" }}
                />
              </ReactCrop>
            </div>

            {/* Zoom slider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ZoomInOutlined style={{ color: "#8c8c8c", fontSize: 16 }} />
              <Slider
                min={1} max={3} step={0.05}
                value={scale}
                onChange={setScale}
                style={{ flex: 1 }}
                tooltip={{ formatter: v => `${Math.round(v * 100)}%` }}
              />
              <Text type="secondary" style={{ fontSize: 12, minWidth: 36 }}>{Math.round(scale * 100)}%</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 11, display: "block", textAlign: "center", marginTop: 8 }}>
              Drag the circle to reposition • Use slider to zoom
            </Text>
          </div>
        )}
      </Modal>
    </>
  )
}

export default Profile
