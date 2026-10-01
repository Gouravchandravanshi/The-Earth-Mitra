import { useState, useEffect } from 'react';
// CHANGED: added useParams so /pages/account/:tab can open the matching tab
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';
/* ADDED (new flow): Account area after login — Overview, My Orders, Address (add new address) and Profile tabs. */
/* ─── Left Sidebar ───────────────────────────────── */
function Sidebar({ active, onChange, user, onLogout }) {
    const navigate = useNavigate();
    return (<aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* User card */}
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <div>
            <button onClick={() => onChange('profile')} className="font-bold text-[#2C1A0E] hover:text-[#2D5A2E] flex items-center gap-1 text-base">
              Hey, {user.name}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            <p className="text-xs text-gray-500 mt-0.5">Logged with {user.phone}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#3B6FE8] text-white text-base font-bold flex items-center justify-center flex-shrink-0">
            {user.name[0].toUpperCase()}
          </div>
        </div>

        {/* Orders count */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="border border-gray-200 rounded-lg px-4 py-2 text-center w-28">
            <div className="text-xl font-bold text-[#2C1A0E]">0</div>
            <div className="text-xs text-gray-500">Total Orders</div>
          </div>
        </div>

        {/* Nav */}
        <div className="p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Account</p>
          {[
            { key: 'overview', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, label: 'Overview', sub: 'All details at one place, easy to access' },
            { key: 'orders', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, label: 'My Orders', sub: 'Track your recent purchases' },
            { key: 'address', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Address', sub: 'Manage shipping addresses' },
        ].map(item => (<button key={item.key} onClick={() => onChange(item.key)} className={`w-full flex items-center justify-between px-3 py-3 rounded-lg mb-1 transition-colors group ${active === item.key ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`${active === item.key ? 'text-[#2D5A2E]' : 'text-gray-500'}`}>{item.icon}</span>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${active === item.key ? 'text-[#2D5A2E]' : 'text-[#2C1A0E]'}`}>{item.label}</div>
                  <div className="text-xs text-gray-400">{item.sub}</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>))}
        </div>

        {/* Logout */}
        <div className="px-4 pb-4 border-t border-gray-100 mt-1 pt-3">
          <button onClick={() => { onLogout(); navigate('/'); }} className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors text-sm font-medium px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>);
}
/* ─── Overview Tab ───────────────────────────────── */
function OverviewTab({ onNavigate }) {
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#2C1A0E] mb-6">Overview</h2>

      {/* My Orders section */}
      <div className="mb-6">
        <h3 className="font-semibold text-[#2C1A0E] mb-4">My Orders</h3>
        <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C1A0E] text-sm">No Past Orders Yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Start your first order to see it here.{' '}
              <Link to="/products" className="text-blue-500 hover:underline font-medium">Shop Now</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Saved Addresses section */}
      <div>
        <h3 className="font-semibold text-[#2C1A0E] mb-4">Saved Addresses</h3>
        <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#2C1A0E] text-sm">No Address Saved Yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Tap to add and shop faster{' '}
              <button onClick={() => onNavigate('address')} className="text-blue-500 hover:underline font-medium">
                Add New Address Now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>);
}
/* ─── My Orders Tab ──────────────────────────────── */
function OrdersTab() {
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#2C1A0E] mb-6">My Orders</h2>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h3 className="font-bold text-[#2C1A0E] mb-2">No Past Orders Yet</h3>
        <p className="text-sm text-gray-500 mb-5">Start your first order to see it here.</p>
        <Link to="/products" className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Explore Products
        </Link>
      </div>
    </div>);
}
/* ─── Address Tab ────────────────────────────────── */
function AddressTab() {
    const [view, setView] = useState('list');
    const [addresses, setAddresses] = useState([]);
    const [form, setForm] = useState({ pinCode: '', flat: '', address: '', firstName: '', lastName: '', mobile: '', isDefault: false });
    function handleSave(e) {
        e.preventDefault();
        setAddresses(prev => [...prev, { ...form, id: Date.now() }]);
        setForm({ pinCode: '', flat: '', address: '', firstName: '', lastName: '', mobile: '', isDefault: false });
        setView('list');
    }
    if (view === 'add')
        return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <button onClick={() => setView('list')} className="flex items-center gap-2 text-[#2C1A0E] hover:text-[#2D5A2E] mb-4 text-sm font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        My Address
      </button>
      <form onSubmit={handleSave} className="space-y-4">
        {[
                { label: 'PIN Code *', key: 'pinCode', placeholder: 'Eg: 110001', required: true },
                { label: 'Flat/Building Number (Optional)', key: 'flat', placeholder: 'Eg: A1, Block D', required: false },
                { label: 'Complete Address *', key: 'address', placeholder: 'Eg: Plot no. 401', required: true },
                { label: 'First Name *', key: 'firstName', placeholder: 'Eg: Joe', required: true },
                { label: 'Last Name (Optional)', key: 'lastName', placeholder: 'Eg: Harrison', required: false },
                { label: 'Mobile Number *', key: 'mobile', placeholder: 'Eg: 9876543210', required: true },
            ].map(field => (<div key={field.key}>
            <label className="block text-sm font-medium text-[#3B6FE8] mb-1">{field.label}</label>
            <input required={field.required} placeholder={field.placeholder} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#3B6FE8] transition-colors"/>
          </div>))}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="accent-[#3B6FE8]"/>
          <span className="text-sm text-gray-600">Mark as my default address</span>
        </label>
        <div className="flex justify-end pt-2">
          <button type="submit" className="bg-blue-600 text-white font-semibold px-8 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Save Address
          </button>
        </div>
      </form>
    </div>);
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#2C1A0E] mb-6">My Address</h2>
      {addresses.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h3 className="font-bold text-[#2C1A0E] mb-2">No Address Saved Yet</h3>
          <p className="text-sm text-gray-500 mb-5">Click to add a new delivery address</p>
          <button onClick={() => setView('add')} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Add New Address
          </button>
        </div>) : (<>
          <div className="space-y-3 mb-5">
            {addresses.map(addr => (<div key={addr.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
                <div>
                  {addr.isDefault && <span className="text-xs font-bold text-[#2D5A2E] bg-green-50 px-2 py-0.5 rounded-full mb-2 inline-block">Default</span>}
                  <p className="font-semibold text-sm text-[#2C1A0E]">{addr.firstName} {addr.lastName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.flat}, {addr.address}</p>
                  <p className="text-xs text-gray-500">PIN: {addr.pinCode} | {addr.mobile}</p>
                </div>
                <button className="text-blue-500 text-xs font-semibold hover:underline">Edit</button>
              </div>))}
          </div>
          <button onClick={() => setView('add')} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            + Add New Address
          </button>
        </>)}
    </div>);
}
/* ─── Profile Tab ────────────────────────────────── */
function ProfileTab({ user }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ firstName: user.name, lastName: '', phone: user.phone, email: user.email || '' });
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#2C1A0E]">Profile</h2>
        <button onClick={() => setEditing(!editing)} className="text-blue-500 hover:underline text-sm font-semibold">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing ? (<form onSubmit={e => { e.preventDefault(); setEditing(false); }} className="space-y-4">
          {[
                { label: 'First Name', key: 'firstName', placeholder: 'Your first name' },
                { label: 'Last Name', key: 'lastName', placeholder: 'Your last name' },
                { label: 'Phone Number', key: 'phone', placeholder: '+91 XXXXX XXXXX' },
                { label: 'Email ID', key: 'email', placeholder: 'you@email.com' },
            ].map(f => (<div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
              <input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#2D5A2E] transition-colors"/>
            </div>))}
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-[#2D5A2E] text-white font-semibold px-8 py-2.5 rounded-lg text-sm hover:bg-[#1e3d1f] transition-colors">
              Save Changes
            </button>
          </div>
        </form>) : (<div className="space-y-5">
          {[
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, label: 'First Name', value: form.firstName },
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, label: 'Last Name', value: form.lastName || 'Not provided' },
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, label: 'Phone Number', value: form.phone },
                { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'Email ID', value: form.email || 'Not provided' },
            ].map(row => (<div key={row.label} className="flex items-start gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0">
              <span className="text-gray-400 mt-0.5 flex-shrink-0">{row.icon}</span>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                <p className="text-sm font-semibold text-[#2C1A0E]">{row.value}</p>
              </div>
            </div>))}
        </div>)}
    </div>);
}
/* ─── Main Account Page ──────────────────────────── */
export default function AccountPage() {
    const { user, logout } = useOutletContext();
    const navigate = useNavigate();
    // ADDED (fix): read the tab from the URL (/pages/account/orders, /address, /profile), default is overview
    const { tab } = useParams();
    const VALID_TABS = ['overview', 'orders', 'address', 'profile'];
    const [activeTab, setActiveTab] = useState(VALID_TABS.includes(tab) ? tab : 'overview');
    useEffect(() => {
        setActiveTab(VALID_TABS.includes(tab) ? tab : 'overview');
    }, [tab]);
    if (!user) {
        return (<div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 shadow-md text-center max-w-sm mx-4">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-bold text-xl text-[#2C1A0E] mb-2">Please log in</h2>
          <p className="text-sm text-gray-500 mb-6">You need to be logged in to view your account.</p>
          <button onClick={() => navigate('/')} className="bg-[#2D5A2E] text-white font-bold px-8 py-3 rounded-full hover:bg-[#1e3d1f] transition-colors">
            Go to Homepage
          </button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar active={activeTab} onChange={setActiveTab} user={user} onLogout={logout}/>
          <div className="flex-1">
            {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab}/>}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'address' && <AddressTab />}
            {activeTab === 'profile' && <ProfileTab user={user}/>}
          </div>
        </div>
      </div>
    </div>);
}
