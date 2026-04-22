import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_PIN = '123456'

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [panel, setPanel] = useState('members')
  const [members, setMembers] = useState([])
  const [orders, setOrders] = useState([])
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '' })

  useEffect(() => { if (unlocked) { fetchMembers(); fetchOrders(); fetchMessages() } }, [unlocked])

  async function fetchMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('joined_at', { ascending: false })
    if (data) setMembers(data)
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMessages(data)
  }

  async function updateOrderStatus(orderId, status) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    fetchOrders()
    showToast(`Order marked as ${status}`)
  }

  function checkPin() {
    if (pin === ADMIN_PIN) { setUnlocked(true); setPinError(false) }
    else { setPinError(true); setPin('') }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getMemberOrders(memberId) {
    return orders.filter(o => o.member_id === memberId)
  }

  function initials(m) {
    return `${m.first_name?.[0] || ''}${m.last_name?.[0] || ''}`.toUpperCase() || '?'
  }

  function fullName(m) {
    return `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown'
  }

  const filtered = members.filter(m =>
    fullName(m).toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || '').includes(search)
  )

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const totalMRR = members.filter(m => m.status === 'active').length * 30
  const totalAddonRevenue = orders.reduce((s, o) => s + Number(o.total_addons), 0).toFixed(2)

  const navItems = [
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'messages', label: 'Messages', icon: '✉️' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'broadcast', label: 'Broadcast', icon: '📣' },
  ]

  // PIN GATE
  if (!unlocked) return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center gap-4">
      <div className="bg-white rounded-2xl border border-amber-100 p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🔐</div>
        <h1 className="text-xl font-bold text-amber-950 mb-1" style={{fontFamily:'Georgia,serif'}}>Admin Access</h1>
        <p className="text-sm text-amber-500 mb-6">Enter your admin PIN to continue</p>
        <input
          type="password" value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          maxLength={6} placeholder="· · · · · ·"
          className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest outline-none focus:border-amber-400 mb-2"
        />
        {pinError && <p className="text-red-500 text-xs mb-2">Incorrect PIN. Try again.</p>}
        <button onClick={checkPin} className="w-full bg-amber-950 text-amber-300 font-semibold py-2.5 rounded-lg text-sm hover:bg-amber-800 transition-colors">
          Unlock Dashboard
        </button>
      </div>
      <p className="text-xs text-amber-400">Demo PIN: 123456</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 bg-amber-950 flex-shrink-0">
        <span className="text-amber-400 font-bold text-lg" style={{fontFamily:'Georgia,serif'}}>☁ Cloud Castle <span className="text-amber-100 font-normal text-sm">Admin</span></span>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-400 bg-opacity-20 border border-amber-400 text-amber-400 rounded-full px-3 py-1 font-semibold">Admin</span>
          <button onClick={() => setUnlocked(false)} className="text-amber-400 text-xs hover:text-amber-200">🔒 Lock</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-amber-50 border-r border-amber-100 flex flex-col py-4 gap-1 flex-shrink-0">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest px-4 pb-1">Admin</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPanel(item.id); setSelected(null) }}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-all ${panel === item.id ? 'bg-amber-100 text-amber-950 font-semibold border-r-2 border-amber-400' : 'text-amber-700 hover:bg-amber-100'}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* MEMBERS */}
          {panel === 'members' && !selected && (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Members', value: members.length, sub: `${members.filter(m=>m.status==='active').length} active` },
                  { label: 'MRR', value: `$${totalMRR}`, sub: 'from active members' },
                  { label: 'Add-on Revenue', value: `$${totalAddonRevenue}`, sub: 'all time' },
                  { label: 'Orders Today', value: todayOrders.length, sub: 'across all members' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-amber-100 p-4">
                    <p className="text-xs text-amber-500 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>{s.value}</p>
                    <p className="text-xs text-amber-400">{s.sub}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-base font-bold text-amber-950 mb-3" style={{fontFamily:'Georgia,serif'}}>All Members</h2>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search by name or phone..."
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 mb-4 bg-white" />

              <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
                <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs font-semibold text-amber-500 uppercase tracking-wide">
                  <div className="col-span-2">Name</div>
                  <div>Status</div>
                  <div className="col-span-2">Phone</div>
                  <div>Joined</div>
                </div>
                {filtered.length === 0 && <p className="text-sm text-amber-400 p-4">No members found.</p>}
                {filtered.map(m => (
                  <div key={m.id} onClick={() => setSelected(m)}
                    className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-amber-50 hover:bg-amber-50 cursor-pointer items-center transition-colors">
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-800 flex-shrink-0">{initials(m)}</div>
                      <span className="text-sm font-semibold text-amber-950 truncate">{fullName(m)}</span>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'active' ? 'bg-green-100 text-green-700' : m.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                        {m.status || 'active'}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-amber-600 truncate">{m.phone || '—'}</div>
                    <div className="text-xs text-amber-400">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEMBER PROFILE */}
          {panel === 'members' && selected && (
            <div>
              <button onClick={() => setSelected(null)} className="text-sm text-amber-600 hover:text-amber-900 mb-4 flex items-center gap-1">
                ← Back to Members
              </button>
              <div className="bg-white rounded-xl border border-amber-100 p-5 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-xl font-bold text-amber-950 flex-shrink-0">{initials(selected)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>{fullName(selected)}</h2>
                    <p className="text-sm text-amber-500">{selected.phone || 'No phone'}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selected.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{selected.status || 'active'}</span>
                      <span className="text-xs text-amber-400">Joined {selected.joined_at ? new Date(selected.joined_at).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-amber-100 pt-4 mb-4">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">Admin Actions</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => showToast('Refund issued!')} className="bg-amber-400 text-amber-950 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-300 transition-colors">💸 Issue Refund</button>
                    <button onClick={() => showToast('Free upgrade sent!')} className="bg-amber-400 text-amber-950 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-300 transition-colors">✨ Send Free Upgrade</button>
                    <button onClick={() => showToast('Email sent!')} className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-2 rounded-lg hover:border-amber-400 transition-colors">📧 Send Email</button>
                    <button onClick={() => showToast('SMS sent!')} className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-2 rounded-lg hover:border-amber-400 transition-colors">💬 Send SMS</button>
                    <select
                      value={selected.status || 'active'}
                      onChange={async e => {
                        await supabase.from('profiles').update({ status: e.target.value }).eq('id', selected.id)
                        fetchMembers()
                        setSelected({ ...selected, status: e.target.value })
                        showToast('Status updated!')
                      }}
                      className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-2 rounded-lg outline-none">
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-amber-100 pt-4">
                  {[
                    { label: 'Total Orders', value: getMemberOrders(selected.id).length },
                    { label: 'Add-on Spend', value: `$${getMemberOrders(selected.id).reduce((s,o) => s + Number(o.total_addons), 0).toFixed(2)}` },
                    { label: 'Member Since', value: selected.joined_at ? new Date(selected.joined_at).toLocaleDateString() : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-amber-50 rounded-xl p-3">
                      <p className="text-xs text-amber-500 uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-lg font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-bold text-amber-950 mb-3" style={{fontFamily:'Georgia,serif'}}>Order History</h3>
              <div className="flex flex-col gap-2">
                {getMemberOrders(selected.id).length === 0 && <p className="text-sm text-amber-400">No orders yet.</p>}
                {getMemberOrders(selected.id).map(o => (
                  <div key={o.id} className="bg-white rounded-xl border border-amber-100 p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-amber-950">{o.drink}</p>
                      <p className="text-xs text-amber-500">{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}{o.is_premium ? ' · ✨ Premium' : ''}</p>
                      <p className="text-xs text-amber-400 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-amber-950">${Number(o.total_addons).toFixed(2)}</p>
                      <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                        className="text-xs border border-amber-200 rounded-lg px-2 py-0.5 outline-none bg-white text-amber-700">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {panel === 'orders' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>All Orders</h2>
              <div className="flex flex-col gap-2">
                {orders.length === 0 && <p className="text-sm text-amber-400">No orders yet.</p>}
                {orders.map(o => {
                  const member = members.find(m => m.id === o.member_id)
                  return (
                    <div key={o.id} className="bg-white rounded-xl border border-amber-100 p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-amber-950">{o.drink}</p>
                        <p className="text-xs text-amber-500">{member ? fullName(member) : 'Unknown'} · {o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}</p>
                        <p className="text-xs text-amber-400 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-amber-950">${Number(o.total_addons).toFixed(2)}</p>
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                          className="text-xs border border-amber-200 rounded-lg px-2 py-0.5 outline-none bg-white text-amber-700">
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {panel === 'messages' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Member Messages</h2>
              {messages.length === 0 && <p className="text-sm text-amber-400">No messages yet.</p>}
              <div className="flex flex-col gap-2">
                {messages.map(msg => {
                  const member = members.find(m => m.id === msg.member_id)
                  return (
                    <div key={msg.id} className="bg-white rounded-xl border border-amber-100 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-amber-950">{msg.subject || 'No subject'}</p>
                          <p className="text-xs text-amber-500">{member ? fullName(member) : 'Unknown member'} · {new Date(msg.created_at).toLocaleDateString()}</p>
                        </div>
                        {!msg.read && <span className="bg-amber-400 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full">New</span>}
                      </div>
                      <p className="text-sm text-amber-700">{msg.body}</p>
                      {!msg.read && (
                        <button onClick={async () => {
                          await supabase.from('messages').update({ read: true }).eq('id', msg.id)
                          fetchMessages()
                          showToast('Marked as read')
                        }} className="text-xs text-amber-500 hover:text-amber-800 mt-2">Mark as read</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* REVENUE */}
          {panel === 'revenue' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Revenue Overview</h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'MRR', value: `$${totalMRR}` },
                  { label: 'Add-on Revenue', value: `$${totalAddonRevenue}` },
                  { label: 'Active Members', value: members.filter(m=>m.status==='active').length },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-amber-100 p-4">
                    <p className="text-xs text-amber-500 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-amber-400">Full Stripe revenue reporting coming in Phase 2.</p>
            </div>
          )}

          {/* BROADCAST */}
          {panel === 'broadcast' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Broadcast to Members</h2>
              <div className="bg-white rounded-xl border border-amber-100 p-4 max-w-lg">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Audience</label>
                  <select className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400">
                    <option>All Active Members ({members.filter(m=>m.status==='active').length})</option>
                    <option>All Members ({members.length})</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Channel</label>
                  <select className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400">
                    <option>Email + SMS</option>
                    <option>Email Only</option>
                    <option>SMS Only</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Subject</label>
                  <input value={broadcastForm.subject} onChange={e => setBroadcastForm({...broadcastForm, subject: e.target.value})}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                    placeholder="e.g. ☕ A special treat just for you!" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Message</label>
                  <textarea value={broadcastForm.body} onChange={e => setBroadcastForm({...broadcastForm, body: e.target.value})}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none h-28"
                    placeholder="Write your message here..." />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showToast('Broadcast coming in Phase 2 with Twilio + Resend!')}
                    className="bg-amber-950 text-amber-300 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">Send Now</button>
                  <button onClick={() => showToast('Draft saved!')}
                    className="border border-amber-200 text-amber-700 font-semibold px-5 py-2 rounded-lg text-sm hover:border-amber-400 transition-colors">Save Draft</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-amber-950 text-amber-300 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}