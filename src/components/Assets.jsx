// import React, { useState, useEffect } from 'react';
// import api from '../api';
// import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// const emptyAsset = {
//   title: '', asset_type: '', description: '', start_date: new Date().toISOString().split('T')[0],
//   serial_number: '', company_name: '', model_name: '', os: '', storage: '',
//   ram: '', generation: '', asset_condition: '', custom_field_name: '', custom_field_value: ''
// };

// const ASSET_ICONS = {
//   laptop:   { emoji: '🖥️', label: 'Laptop' },
//   monitor:  { emoji: '📺', label: 'Monitor' },
//   mouse:    { emoji: '🖱️', label: 'Mouse' },
//   keyboard: { emoji: '⌨️', label: 'Keyboard' },
//   pendrive: { emoji: '💾', label: 'Pendrive' },
//   other:    { emoji: '📦', label: 'Other' },
// };

// const thNo  = "px-4 py-3 text-left text-xs font-semibold text-white uppercase bg-orange-500 w-12";
// const thRow = "px-4 py-3 text-left text-xs font-semibold text-orange-900 uppercase bg-orange-100";
// const tdNo  = "px-4 py-3 text-sm font-semibold text-orange-700 bg-orange-50 text-center";

// // Green back button (arrow only)
// const BackBtn = ({ onClick }) => (
//   <button onClick={onClick}
//     className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center shadow transition-colors">
//     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//       <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//     </svg>
//   </button>
// );

// // Pen icon (edit)
// const PenIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
//   </svg>
// );

// // List + plus icon (assign)
// const ListPlusIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h10M4 14h7M15 14v6M18 17h-6" />
//   </svg>
// );

// const DynamicFields = ({ form, setForm }) => {
//   const t = form.asset_type;
//   const lbl = (label, field, placeholder) => (
//     <div>
//       <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
//       <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
//         placeholder={placeholder} className="w-full border-b border-gray-300 px-1 py-2 text-sm focus:outline-none focus:border-orange-400" />
//     </div>
//   );
//   if (!t) return null;
//   const company = lbl('Company Name', 'company_name', 'Enter company name');
//   if (t === 'laptop') return <><div className="col-span-2">{company}</div>{lbl('Serial No','serial_number','Serial number')}{lbl('Model','model_name','Model name')}{lbl('OS','os','Operating system')}{lbl('Storage','storage','Storage')}{lbl('RAM','ram','RAM')}{lbl('Generation','generation','Generation')}{lbl('Condition','asset_condition','Condition')}</>;
//   if (t === 'monitor') return <><div className="col-span-2">{company}</div>{lbl('Serial No','serial_number','Serial number')}</>;
//   if (['keyboard','mouse','pendrive'].includes(t)) return <div className="col-span-2">{company}</div>;
//   if (t === 'other') return <><div className="col-span-2">{company}</div>{lbl('Field Name','custom_field_name','Custom field')}{lbl('Field Value','custom_field_value','Value')}</>;
//   return null;
// };

// const Assets = () => {
//   const [employees, setEmployees] = useState([]);
//   const [allAssets, setAllAssets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [page, setPage] = useState('list');
//   const [activeEmployee, setActiveEmployee] = useState(null);
//   const [employeeAssets, setEmployeeAssets] = useState([]);
//   const [submitDate, setSubmitDate] = useState('');
//   const [assetForm, setAssetForm] = useState(emptyAsset);
//   const [showReassignModal, setShowReassignModal] = useState(false);
//   const [reassignAsset, setReassignAsset] = useState(null);
//   const [reassignForm, setReassignForm] = useState({ ...emptyAsset, reason: '' });

//   const loadAll = async () => {
//     const [e, a] = await Promise.all([api.get('/GetEmployee/'), api.get('/assets/')]);
//     setEmployees(e.data); setAllAssets(a.data);
//   };

//   useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

//   const fetchEmpAssets = async (empId) => {
//     const r = await api.get(`/assets/?assigned_to=${empId}`);
//     setEmployeeAssets(r.data);
//   };

//   const openView = async (emp) => { setActiveEmployee(emp); await fetchEmpAssets(emp.id); setPage('view'); };
//   const openAssign = (emp) => { setActiveEmployee(emp); setAssetForm(emptyAsset); setPage('assign'); };

//   const handleAssignSubmit = async (e) => {
//     e.preventDefault();
//     await api.post('/assets/', {
//       ...assetForm,
//       title: assetForm.asset_type === 'other' ? assetForm.title : assetForm.asset_type,
//       given_date: assetForm.start_date, assigned_to: activeEmployee.id, status: 'Assigned'
//     });
//     await loadAll(); setPage('list');
//   };

//   const handleSubmitAsset = async (assetId) => {
//     await api.patch(`/assets/${assetId}/`, { status: 'Submitted', submitted_date: submitDate });
//     await fetchEmpAssets(activeEmployee.id); await loadAll();
//   };

//   const openReassign = (asset) => {
//     setReassignAsset(asset);
//     setReassignForm({ ...emptyAsset, asset_type: asset.asset_type, company_name: asset.company_name || '', reason: '' });
//     setShowReassignModal(true);
//   };

//   const handleReassignSubmit = async (e) => {
//     e.preventDefault();
//     await api.patch(`/assets/${reassignAsset.id}/`, { status: 'Returned', submitted_date: new Date().toISOString().split('T')[0], submit_notes: reassignForm.reason });
//     await api.post('/assets/', { ...reassignForm, title: reassignForm.asset_type === 'other' ? reassignForm.title : reassignForm.asset_type, given_date: reassignForm.start_date, assigned_to: activeEmployee.id, status: 'Assigned' });
//     setShowReassignModal(false); await fetchEmpAssets(activeEmployee.id); await loadAll();
//   };

//   const getEmpAssetIcons = (empId) => {
//     const g = {};
//     allAssets.filter(a => a.assigned_to === empId && a.status === 'Assigned').forEach(a => { const t = a.asset_type || 'other'; g[t] = (g[t] || 0) + 1; });
//     return g;
//   };

//   const filtered = employees.filter(e =>
//     `${e.first_name} ${e.last_name} ${e.email} ${e.position || ''}`.toLowerCase().includes(search.toLowerCase())
//   );

//   const inputCls = "w-full border-b border-gray-300 px-1 py-2 text-sm focus:outline-none focus:border-orange-400 bg-transparent";
//   const labelCls = "text-xs font-medium text-gray-500 mb-1 block";

//   // ─── LIST ────────────────────────────────────────────────────
//   if (page === 'list') return (
//     <div className="p-6 max-w-[1400px] mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Assets Management</h1>
//         <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
//           className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-400" />
//       </div>
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <table className="w-full">
//           <thead>
//             <tr>
//               <th className={thNo}>No.</th>
//               <th className={thRow}>Action</th>
//               <th className={thRow}>Full Name</th>
//               <th className={thRow}>Position</th>
//               <th className={thRow}>Phone No.</th>
//               <th className={thRow}>Email Id</th>
//               <th className={thRow}>Assigned Asset</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {loading ? (
//               <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
//             ) : filtered.map((emp, idx) => {
//               const icons = getEmpAssetIcons(emp.id);
//               return (
//                 <tr key={emp.id} className="hover:bg-gray-50">
//                   <td className={tdNo}>{idx + 1}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-3">
//                       <button onClick={() => openView(emp)} title="View Assets" className="text-orange-500 hover:text-orange-700"><PenIcon /></button>
//                       <button onClick={() => openAssign(emp)} title="Assign Asset" className="text-orange-500 hover:text-orange-700"><ListPlusIcon /></button>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</td>
//                   <td className="px-4 py-3 text-sm text-gray-600">{emp.position || '-'}</td>
//                   <td className="px-4 py-3 text-sm text-gray-600">{emp.phone || '-'}</td>
//                   <td className="px-4 py-3 text-sm text-gray-600">{emp.email || '-'}</td>
//                   <td className="px-4 py-3">
//                     {Object.keys(icons).length === 0 ? <span className="text-xs text-gray-300">—</span> : (
//                       <button onClick={() => openView(emp)} className="flex items-center gap-3 hover:opacity-80">
//                         {Object.entries(icons).map(([type, count]) => (
//                           <span key={type} className="flex items-center gap-0.5">
//                             <span className="text-base">{ASSET_ICONS[type]?.emoji || '📦'}</span>
//                             <span className="text-xs font-bold text-orange-600">{count}</span>
//                           </span>
//                         ))}
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );

//   // ─── VIEW PAGE ───────────────────────────────────────────────
//   if (page === 'view') return (
//     <div className="p-6 max-w-[1400px] mx-auto">
//       <div className="flex items-center gap-4 mb-6">
//         <BackBtn onClick={() => setPage('list')} />
//         <div>
//           <h1 className="text-xl font-bold text-gray-900">{activeEmployee?.first_name} {activeEmployee?.last_name}</h1>
//           <p className="text-xs text-gray-500">{activeEmployee?.position || activeEmployee?.department || ''}</p>
//         </div>
//         <button onClick={() => openAssign(activeEmployee)}
//           className="ml-auto flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 shadow">
//           <ListPlusIcon /> Assign New Asset
//         </button>
//       </div>

//       {/* Summary cards */}
//       {Object.keys(getEmpAssetIcons(activeEmployee?.id)).length > 0 && (
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
//           {Object.entries(getEmpAssetIcons(activeEmployee?.id)).map(([type, count]) => (
//             <div key={type} className="bg-white rounded-xl border border-orange-100 p-4 flex items-center gap-3 shadow-sm">
//               <span className="text-3xl">{ASSET_ICONS[type]?.emoji || '📦'}</span>
//               <div>
//                 <p className="text-xs text-gray-500">{ASSET_ICONS[type]?.label}</p>
//                 <p className="text-xl font-bold text-orange-600">{count}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <div className="px-6 py-4 border-b border-gray-100">
//           <h2 className="text-base font-semibold text-gray-800">Assigned Assets</h2>
//         </div>
//         {employeeAssets.length === 0 ? (
//           <p className="text-center text-gray-400 py-16">No assets assigned yet</p>
//         ) : (
//           <table className="w-full">
//             <thead>
//               <tr>
//                 <th className={thNo}>#</th>
//                 {['Asset','Type','Company','Serial','Given Date','Status','Actions'].map(h => (
//                   <th key={h} className={thRow}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {employeeAssets.map((asset, idx) => (
//                 <tr key={asset.id} className="hover:bg-gray-50">
//                   <td className={tdNo}>{idx + 1}</td>
//                   <td className="px-4 py-3 text-sm font-medium text-gray-900">
//                     <span className="mr-1">{ASSET_ICONS[asset.asset_type]?.emoji || '📦'}</span>{asset.title}
//                   </td>
//                   <td className="px-4 py-3 text-sm text-gray-600 capitalize">{asset.asset_type}</td>
//                   <td className="px-4 py-3 text-sm text-gray-600">{asset.company_name || '-'}</td>
//                   <td className="px-4 py-3 text-sm text-gray-600">{asset.serial_number || '-'}</td>
//                   <td className="px-4 py-3 text-sm text-gray-600">{asset.given_date ? new Date(asset.given_date).toLocaleDateString('en-IN') : '-'}</td>
//                   <td className="px-4 py-3">
//                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${asset.status === 'Submitted' ? 'bg-green-100 text-green-700' : asset.status === 'Returned' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
//                       {asset.status || 'Assigned'}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     {asset.status === 'Assigned' && (
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <input type="date" value={submitDate} onChange={e => setSubmitDate(e.target.value)}
//                           className="border border-gray-300 rounded px-2 py-1 text-xs" />
//                         <button onClick={() => handleSubmitAsset(asset.id)}
//                           className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">
//                           <CheckIcon className="w-3 h-3" /> Submit
//                         </button>
//                         <button onClick={() => openReassign(asset)}
//                           className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">
//                           <ArrowPathIcon className="w-3 h-3" /> Reassign
//                         </button>
//                       </div>
//                     )}
//                     {asset.status !== 'Assigned' && (
//                       <span className="text-xs text-gray-400">{asset.submitted_date ? new Date(asset.submitted_date).toLocaleDateString('en-IN') : '-'}</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Reassign Modal */}
//       {showReassignModal && reassignAsset && (
//         <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-y-auto py-8">
//           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
//               <div>
//                 <h2 className="text-lg font-semibold text-gray-900">Reassign Asset</h2>
//                 <p className="text-xs text-gray-500 mt-0.5">Replacing: {reassignAsset.title}</p>
//               </div>
//               <button onClick={() => setShowReassignModal(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
//             </div>
//             <form onSubmit={handleReassignSubmit} className="p-6 space-y-4">
//               <div><label className={labelCls}>Reason *</label>
//                 <textarea value={reassignForm.reason} onChange={e => setReassignForm(f => ({ ...f, reason: e.target.value }))}
//                   required rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
//               <div><label className={labelCls}>Asset Type *</label>
//                 <select value={reassignForm.asset_type} onChange={e => setReassignForm(f => ({ ...f, asset_type: e.target.value }))}
//                   required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
//                   <option value="">Select type</option>
//                   {Object.entries(ASSET_ICONS).map(([t, { emoji, label }]) => <option key={t} value={t}>{emoji} {label}</option>)}
//                 </select></div>
//               <div className="grid grid-cols-2 gap-4"><DynamicFields form={reassignForm} setForm={setReassignForm} /></div>
//               <div><label className={labelCls}>Description *</label>
//                 <textarea value={reassignForm.description} onChange={e => setReassignForm(f => ({ ...f, description: e.target.value }))}
//                   required rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
//               <div><label className={labelCls}>Given Date *</label>
//                 <input type="date" value={reassignForm.start_date} onChange={e => setReassignForm(f => ({ ...f, start_date: e.target.value }))}
//                   required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
//               <div className="flex justify-end gap-3 pt-2">
//                 <button type="button" onClick={() => setShowReassignModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
//                 <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Reassign</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );

//   // ─── ASSIGN PAGE ─────────────────────────────────────────────
//   if (page === 'assign') return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <div className="flex items-center gap-4 mb-6">
//         <BackBtn onClick={() => setPage('list')} />
//         <div>
//           <h1 className="text-xl font-bold text-gray-900">Assign Asset</h1>
//           <p className="text-xs text-gray-500">To: {activeEmployee?.first_name} {activeEmployee?.last_name}</p>
//         </div>
//       </div>

//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
//         <div className="px-6 py-4 border-b border-gray-100">
//           <h2 className="text-base font-semibold text-gray-800">Asset Details</h2>
//         </div>
//         <form onSubmit={handleAssignSubmit} className="p-6">
//           <div className="grid grid-cols-2 gap-x-8 gap-y-5">
//             <div>
//               <label className={labelCls}>Asset Type *</label>
//               <select value={assetForm.asset_type} onChange={e => setAssetForm(f => ({ ...f, asset_type: e.target.value }))}
//                 required className={inputCls + " bg-transparent"}>
//                 <option value="">Select type</option>
//                 {Object.entries(ASSET_ICONS).map(([t, { emoji, label }]) => <option key={t} value={t}>{emoji} {label}</option>)}
//               </select>
//             </div>
//             {assetForm.asset_type === 'other' && (
//               <div>
//                 <label className={labelCls}>Asset Title *</label>
//                 <input value={assetForm.title} onChange={e => setAssetForm(f => ({ ...f, title: e.target.value }))} required className={inputCls} />
//               </div>
//             )}
//             <DynamicFields form={assetForm} setForm={setAssetForm} />
//             <div className="col-span-2">
//               <label className={labelCls}>Description *</label>
//               <textarea value={assetForm.description} onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))}
//                 required rows={2} className={inputCls + " resize-none"} />
//             </div>
//             <div>
//               <label className={labelCls}>Given Date *</label>
//               <input type="date" value={assetForm.start_date} onChange={e => setAssetForm(f => ({ ...f, start_date: e.target.value }))}
//                 required className={inputCls} />
//             </div>
//           </div>
//           <div className="flex justify-center gap-4 mt-8">
//             <button type="button" onClick={() => setPage('list')}
//               className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
//             <button type="submit"
//               className="px-8 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 shadow">Submit</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );

//   return null;
// };

// export default Assets;



import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  XMarkIcon, 
  CheckIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  PlusCircleIcon,
  ChevronLeftIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  TagIcon,
  ComputerDesktopIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import MonitorIcon from '@mui/icons-material/Monitor';
import MouseIcon from '@mui/icons-material/Mouse';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import UsbIcon from '@mui/icons-material/Usb';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import InventoryIcon from '@mui/icons-material/Inventory';

const emptyAsset = {
  title: '', asset_type: '', description: '', start_date: new Date().toISOString().split('T')[0],
  serial_number: '', company_name: '', model_name: '', os: '', storage: '',
  ram: '', generation: '', asset_condition: '', custom_field_name: '', custom_field_value: '',
  purchase_date: '', warranty_expiry: '', in_date: '',
  host_name: '', hdd_ssd: '', antivirus: '', domain_updated: '', status: 'Stock'
};

const ASSET_ICONS = {
  laptop:   { icon: LaptopMacIcon,    label: 'Laptop',   color: '#2563eb', bgColor: 'bg-blue-50' },
  monitor:  { icon: MonitorIcon,      label: 'Monitor',  color: '#7c3aed', bgColor: 'bg-purple-50' },
  mouse:    { icon: MouseIcon,        label: 'Mouse',    color: '#16a34a', bgColor: 'bg-green-50' },
  keyboard: { icon: KeyboardIcon,     label: 'Keyboard', color: '#4f46e5', bgColor: 'bg-indigo-50' },
  pendrive: { icon: UsbIcon,          label: 'Pendrive', color: '#ca8a04', bgColor: 'bg-yellow-50' },
  other:    { icon: DevicesOtherIcon, label: 'Other',    color: '#6b7280', bgColor: 'bg-gray-50' },
};

// MUI icon renderer (MUI icons use sx/style, not className for color)
const AssetIcon = ({ type, size = 20, className = '' }) => {
  const cfg = ASSET_ICONS[type] || ASSET_ICONS.other;
  const Icon = cfg.icon;
  return <Icon style={{ fontSize: size, color: cfg.color }} className={className} />;
};

const uCls = "w-full border-0 border-b border-gray-300 px-0 py-1.5 text-sm focus:outline-none focus:border-orange-500 bg-transparent text-gray-700 placeholder-gray-400";

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const thNo  = "px-4 py-3 text-left text-xs font-semibold text-white uppercase bg-gradient-to-r from-orange-500 to-orange-600 w-12";
const thRow = "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 border-b border-gray-200";
const tdNo  = "px-4 py-3 text-sm font-semibold text-gray-600 bg-gray-50 text-center border-r border-gray-200";

// Back button component
const BackBtn = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 transition-all hover:shadow-md"
  >
    <ChevronLeftIcon className="w-5 h-5" />
  </button>
);

const DynamicFields = ({ form, setForm }) => {
  const t = form.asset_type;
  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1.5";
  
  const FieldWrapper = ({ label, field, placeholder, type = "text" }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input 
        type={type}
        value={form[field]} 
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder} 
        className={inputClass} 
      />
    </div>
  );

  if (!t) return null;
  
  const company = <FieldWrapper label="Company Name" field="company_name" placeholder="Enter company name" />;
  
  if (t === 'laptop') return (
    <div className="col-span-2 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {company}
        <FieldWrapper label="Serial Number" field="serial_number" placeholder="Serial number" />
        <FieldWrapper label="Model" field="model_name" placeholder="Model name" />
        <FieldWrapper label="OS" field="os" placeholder="Operating system" />
        <FieldWrapper label="Storage" field="storage" placeholder="Storage capacity" />
        <FieldWrapper label="RAM" field="ram" placeholder="RAM size" />
        <FieldWrapper label="Generation" field="generation" placeholder="Generation" />
        <FieldWrapper label="Condition" field="asset_condition" placeholder="Condition" />
      </div>
    </div>
  );
  
  if (t === 'monitor') return (
    <div className="col-span-2">
      <div className="grid grid-cols-2 gap-4">
        {company}
        <FieldWrapper label="Serial Number" field="serial_number" placeholder="Serial number" />
      </div>
    </div>
  );
  
  if (['keyboard','mouse','pendrive'].includes(t)) return (
    <div className="col-span-2">{company}</div>
  );
  
  if (t === 'other') return (
    <div className="col-span-2">
      <div className="grid grid-cols-2 gap-4">
        {company}
        <FieldWrapper label="Custom Field Name" field="custom_field_name" placeholder="Field name" />
        <FieldWrapper label="Custom Field Value" field="custom_field_value" placeholder="Value" />
      </div>
    </div>
  );
  
  return null;
};

const Assets = () => {
  const [employees, setEmployees] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState('list');
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [submitDate, setSubmitDate] = useState('');
  const [assetForm, setAssetForm] = useState(emptyAsset);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignAsset, setReassignAsset] = useState(null);
  const [reassignForm, setReassignForm] = useState({ ...emptyAsset, reason: '' });

  const loadAll = async () => {
    const [e, a] = await Promise.all([api.get('/GetEmployee/'), api.get('/assets/')]);
    setEmployees(e.data); setAllAssets(a.data);
  };

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

  const fetchEmpAssets = async (empId) => {
    const r = await api.get(`/assets/?assigned_to=${empId}`);
    setEmployeeAssets(r.data);
  };

  const openView = async (emp) => { setActiveEmployee(emp); await fetchEmpAssets(emp.id); setPage('view'); };
  const openAssign = (emp) => { setActiveEmployee(emp); setAssetForm(emptyAsset); setPage('assign'); };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    await api.post('/assets/', {
      ...assetForm,
      title: assetForm.model_name || assetForm.asset_type,
      given_date: assetForm.start_date,
      assigned_to: activeEmployee.id,
      status: assetForm.status || 'Assigned',
      purchase_date: assetForm.purchase_date || null,
      warranty_expiry: assetForm.warranty_expiry || null,
      in_date: assetForm.in_date || null,
    });
    await loadAll(); setPage('list');
  };

  const handleSubmitAsset = async (assetId) => {
    await api.patch(`/assets/${assetId}/`, { status: 'Submitted', submitted_date: submitDate });
    await fetchEmpAssets(activeEmployee.id); await loadAll();
  };

  const openReassign = (asset) => {
    setReassignAsset(asset);
    setReassignForm({ ...emptyAsset, asset_type: asset.asset_type, company_name: asset.company_name || '', reason: '' });
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    await api.patch(`/assets/${reassignAsset.id}/`, { status: 'Returned', submitted_date: new Date().toISOString().split('T')[0], submit_notes: reassignForm.reason });
    await api.post('/assets/', { ...reassignForm, title: reassignForm.asset_type === 'other' ? reassignForm.title : reassignForm.asset_type, given_date: reassignForm.start_date, assigned_to: activeEmployee.id, status: 'Assigned' });
    setShowReassignModal(false); await fetchEmpAssets(activeEmployee.id); await loadAll();
  };

  const getEmpAssetIcons = (empId) => {
    const g = {};
    allAssets
      .filter(a => String(a.assigned_to) === String(empId) && !['Returned','Submitted'].includes(a.status))
      .forEach(a => { const t = a.asset_type || 'other'; g[t] = (g[t] || 0) + 1; });
    return g;
  };

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email} ${e.position || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow";
  const labelCls = "block text-xs font-medium text-gray-700 mb-1.5";

  // Status badge component
  const StatusBadge = ({ status }) => {
    const styles = {
      'Assigned': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Submitted': 'bg-green-100 text-green-800 border-green-200',
      'Returned': 'bg-red-100 text-red-800 border-red-200'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles['Assigned']}`}>
        {status || 'Assigned'}
      </span>
    );
  };

  // ─── LIST ────────────────────────────────────────────────────
  if (page === 'list') return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assets Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and track employee assets</p>
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search employees..."
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{allAssets.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ComputerDesktopIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Assets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allAssets.filter(a => a.status === 'Assigned').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Returned Assets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allAssets.filter(a => a.status === 'Returned').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowPathIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thNo}>No.</th>
                <th className={thRow}>Actions</th>
                <th className={thRow}>Full Name</th>
                <th className={thRow}>Position</th>
                <th className={thRow}>Contact</th>
                <th className={thRow}>Email</th>
                <th className={thRow}>Assigned Assets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-500 mt-4">Loading employees...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No employees found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp, idx) => {
                  const icons = getEmpAssetIcons(emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className={tdNo}>{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openView(emp)} 
                            title="View Assets" 
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openAssign(emp)} 
                            title="Assign Asset" 
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <PlusCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-gray-500">{emp.employee_id || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{emp.position || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{emp.phone || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{emp.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {Object.keys(icons).length === 0 ? (
                          <span className="text-xs text-gray-400">No assets</span>
                        ) : (
                          <button 
                            onClick={() => openView(emp)} 
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            {Object.entries(icons).map(([type, count]) => {
                              const IconComponent = ASSET_ICONS[type]?.icon || CubeIcon;
                              const color = ASSET_ICONS[type]?.color || 'text-gray-600';
                              return (
                                <div key={type} className="flex items-center gap-1.5">
                                  <div className="relative">
                                    <IconComponent className={`w-5 h-5 ${color}`} />
                                    {count > 1 && (
                                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {count}
                                      </span>
                                    )}
                                  </div>
                                  {count === 1 && <span className="text-xs font-medium text-gray-600">{count}</span>}
                                </div>
                              );
                            })}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── VIEW PAGE ───────────────────────────────────────────────
  if (page === 'view') return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <BackBtn onClick={() => setPage('list')} />
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeEmployee?.first_name} {activeEmployee?.last_name}
                  </h1>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <BriefcaseIcon className="w-4 h-4" />
                      {activeEmployee?.position || 'No position'}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      {activeEmployee?.department || 'No department'}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <EnvelopeIcon className="w-4 h-4" />
                      {activeEmployee?.email}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => openAssign(activeEmployee)}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 shadow-md transition-all"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  Assign New Asset
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Assets Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Assigned Assets</h2>
          </div>
          {employeeAssets.length === 0 ? (
            <div className="text-center py-16">
              <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No assets assigned yet</p>
              <button 
                onClick={() => openAssign(activeEmployee)}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                + Assign first asset
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thNo}>No.</th>
                  <th className={thRow}>Asset</th>
                  <th className={thRow}>Type</th>
                  <th className={thRow}>Company</th>
                  <th className={thRow}>Serial/Model</th>
                  <th className={thRow}>Given Date</th>
                  <th className={thRow}>Status</th>
                  <th className={thRow}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeAssets.map((asset, idx) => {
                  const IconComponent = ASSET_ICONS[asset.asset_type]?.icon || CubeIcon;
                  const color = ASSET_ICONS[asset.asset_type]?.color || 'text-gray-600';
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className={tdNo}>{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-5 h-5 ${color}`} />
                          <span className="text-sm font-medium text-gray-900">{asset.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 capitalize">{asset.asset_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{asset.company_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{asset.serial_number || asset.model_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {asset.given_date ? new Date(asset.given_date).toLocaleDateString('en-IN') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-4 py-3">
                        {asset.status !== 'Returned' && asset.status !== 'Submitted' && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              value={submitDate} 
                              onChange={e => setSubmitDate(e.target.value)}
                              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button 
                              onClick={() => handleSubmitAsset(asset.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                              Submit
                            </button>
                            <button 
                              onClick={() => openReassign(asset)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                            >
                              <ArrowPathIcon className="w-3.5 h-3.5" />
                              Reassign
                            </button>
                          </div>
                        )}
                        {(asset.status === 'Returned' || asset.status === 'Submitted') && (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {asset.submitted_date ? new Date(asset.submitted_date).toLocaleDateString('en-IN') : '-'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && reassignAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Reassign Asset</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Replacing: <span className="font-medium text-gray-700">{reassignAsset.title}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowReassignModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleReassignSubmit} className="p-6 space-y-5">
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <DocumentTextIcon className="w-4 h-4" />
                    Reason for Reassignment *
                  </span>
                </label>
                <textarea 
                  value={reassignForm.reason} 
                  onChange={e => setReassignForm(f => ({ ...f, reason: e.target.value }))}
                  required 
                  rows={3} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Please provide a reason for reassigning this asset..."
                />
              </div>
              
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <TagIcon className="w-4 h-4" />
                    Asset Type *
                  </span>
                </label>
                <select 
                  value={reassignForm.asset_type} 
                  onChange={e => setReassignForm(f => ({ ...f, asset_type: e.target.value }))}
                  required 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select asset type</option>
                  {Object.entries(ASSET_ICONS).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <DynamicFields form={reassignForm} setForm={setReassignForm} />
              
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <DocumentTextIcon className="w-4 h-4" />
                    Description *
                  </span>
                </label>
                <textarea 
                  value={reassignForm.description} 
                  onChange={e => setReassignForm(f => ({ ...f, description: e.target.value }))}
                  required 
                  rows={2} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
              
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    Given Date *
                  </span>
                </label>
                <input 
                  type="date" 
                  value={reassignForm.start_date} 
                  onChange={e => setReassignForm(f => ({ ...f, start_date: e.target.value }))}
                  required 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setShowReassignModal(false)} 
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-orange-700 shadow-md transition-all"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ─── ASSIGN PAGE ─────────────────────────────────────────────
  if (page === 'assign') return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        <BackBtn onClick={() => setPage('list')} />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
          {/* Title */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-base font-semibold text-gray-800">
              Add New {assetForm.asset_type ? ASSET_ICONS[assetForm.asset_type]?.label : ''} Asset
            </h2>
          </div>

          <form onSubmit={handleAssignSubmit} className="p-6">
            {/* Asset Type row */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-5 mb-6">
              <Field label="Asset Type *">
                <select value={assetForm.asset_type} onChange={e => setAssetForm(f => ({ ...emptyAsset, asset_type: e.target.value }))}
                  required className={uCls}>
                  <option value="">Select Asset Type</option>
                  {Object.entries(ASSET_ICONS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </Field>
              <Field label="Assigned To">
                <span className="text-sm text-gray-700 py-2 block border-b border-gray-300">
                  {activeEmployee?.first_name} {activeEmployee?.last_name}
                </span>
              </Field>
            </div>

            {assetForm.asset_type && (
              <div className="grid grid-cols-2 gap-x-12 gap-y-5">

                {/* Common for all types */}
                <Field label="Brand / Model *">
                  <input value={assetForm.model_name} onChange={e => setAssetForm(f => ({ ...f, model_name: e.target.value }))}
                    required placeholder="Enter Brand Model" className={uCls} />
                </Field>
                <Field label="Device Serial Number *">
                  <input value={assetForm.serial_number} onChange={e => setAssetForm(f => ({ ...f, serial_number: e.target.value }))}
                    required placeholder="Enter Device Serial Number" className={uCls} />
                </Field>

                <Field label="Purchase Date">
                  <input type="date" value={assetForm.purchase_date || ''} onChange={e => setAssetForm(f => ({ ...f, purchase_date: e.target.value }))}
                    className={uCls} />
                </Field>
                <Field label="Status *">
                  <select value={assetForm.status} onChange={e => setAssetForm(f => ({ ...f, status: e.target.value }))}
                    required className={uCls}>
                    {['Stock','In Use','Under Repair','Retired','Assigned'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="Warranty Expiry Date">
                  <input type="date" value={assetForm.warranty_expiry || ''} onChange={e => setAssetForm(f => ({ ...f, warranty_expiry: e.target.value }))}
                    className={uCls} />
                </Field>
                <Field label="Condition *">
                  <select value={assetForm.asset_condition || ''} onChange={e => setAssetForm(f => ({ ...f, asset_condition: e.target.value }))}
                    required className={uCls}>
                    <option value="">Select Condition</option>
                    {['New','Good','Fair','Poor','Damaged'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <Field label="In Date">
                  <input type="date" value={assetForm.in_date || ''} onChange={e => setAssetForm(f => ({ ...f, in_date: e.target.value }))}
                    className={uCls} />
                </Field>

                <Field label="Company Name">
                  <input value={assetForm.company_name} onChange={e => setAssetForm(f => ({ ...f, company_name: e.target.value }))}
                    placeholder="Enter company name" className={uCls} />
                </Field>

                {/* Laptop specific */}
                {assetForm.asset_type === 'laptop' && (
                  <>
                    <Field label="Host Name">
                      <input value={assetForm.host_name || ''} onChange={e => setAssetForm(f => ({ ...f, host_name: e.target.value }))}
                        placeholder="Enter Host Name" className={uCls} />
                    </Field>
                    <Field label="OS">
                      <input value={assetForm.os || ''} onChange={e => setAssetForm(f => ({ ...f, os: e.target.value }))}
                        placeholder="Enter OS" className={uCls} />
                    </Field>
                    <Field label="HDD/SSD">
                      <input value={assetForm.hdd_ssd || ''} onChange={e => setAssetForm(f => ({ ...f, hdd_ssd: e.target.value }))}
                        placeholder="Enter HDD/SSD" className={uCls} />
                    </Field>
                    <Field label="RAM">
                      <input value={assetForm.ram || ''} onChange={e => setAssetForm(f => ({ ...f, ram: e.target.value }))}
                        placeholder="Enter RAM" className={uCls} />
                    </Field>
                    <Field label="Antivirus">
                      <input value={assetForm.antivirus || ''} onChange={e => setAssetForm(f => ({ ...f, antivirus: e.target.value }))}
                        placeholder="Enter Antivirus" className={uCls} />
                    </Field>
                    <Field label="Domain Updated">
                      <select value={assetForm.domain_updated || ''} onChange={e => setAssetForm(f => ({ ...f, domain_updated: e.target.value }))}
                        className={uCls}>
                        <option value="">Select Domain Updated</option>
                        {['Yes','No','NA'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>
                    <Field label="Generation">
                      <input value={assetForm.generation || ''} onChange={e => setAssetForm(f => ({ ...f, generation: e.target.value }))}
                        placeholder="Enter Generation" className={uCls} />
                    </Field>
                    <Field label="Storage">
                      <input value={assetForm.storage || ''} onChange={e => setAssetForm(f => ({ ...f, storage: e.target.value }))}
                        placeholder="Enter Storage" className={uCls} />
                    </Field>
                  </>
                )}

                {/* Monitor specific */}
                {assetForm.asset_type === 'monitor' && (
                  <Field label="Screen Size">
                    <input value={assetForm.storage || ''} onChange={e => setAssetForm(f => ({ ...f, storage: e.target.value }))}
                      placeholder="e.g. 24 inch" className={uCls} />
                  </Field>
                )}

                {/* Other */}
                {assetForm.asset_type === 'other' && (
                  <>
                    <Field label="Custom Field Name">
                      <input value={assetForm.custom_field_name || ''} onChange={e => setAssetForm(f => ({ ...f, custom_field_name: e.target.value }))}
                        placeholder="Field name" className={uCls} />
                    </Field>
                    <Field label="Custom Field Value">
                      <input value={assetForm.custom_field_value || ''} onChange={e => setAssetForm(f => ({ ...f, custom_field_value: e.target.value }))}
                        placeholder="Value" className={uCls} />
                    </Field>
                  </>
                )}

                {/* Remark - full width */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                  <textarea value={assetForm.description || ''} onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Enter Remark"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none" />
                </div>

              </div>
            )}

            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <button type="button" onClick={() => setPage('list')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={!assetForm.asset_type}
                className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
                Assign Asset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return null;
};

export default Assets;