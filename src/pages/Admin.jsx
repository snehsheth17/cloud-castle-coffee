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
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', body: '' })

  useEffect(() => { if (unlocked) { fetchMembers(); fetchOrders(); fetchMessages() } }, [unlocked])

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('*').order('joined_at', { ascending: false })
    if (data) setMembers(data)
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
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

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  function getMemberOrders(memberId) { return orders.filter(o => o.member_id === memberId) }
  function initials(m) { return `${m.first_name?.[0] || ''}${m.last_name?.[0] || ''}`.toUpperCase() || '?' }
  function fullName(m) { return `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown' }

  const filtered = members.filter(m =>
    fullName(m).toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || '').includes(search)
  )

  const totalMRR = members.filter(m => m.status === 'active').length * 30
  const totalAddonRevenue = orders.reduce((s, o) => s + Number(o.total_addons), 0).toFixed(2)
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const unreadMessages = messages.filter(m => !m.read).length

  // Styles
  const card = { background:'#1a1d24', border:'1px solid #2a2d35', borderRadius:'16px', padding:'16px', marginBottom:'12px' }
  const inp = { background:'#111318', border:'1px solid #2a2d35', borderRadius:'12px', padding:'14px', color:'white', fontSize:'16px', width:'100%', outline:'none', fontFamily:'DM Sans,sans-serif', boxSizing:'border-box' }
  const btnPrimary = { background:'#3b82f6', color:'white', border:'none', borderRadius:'14px', padding:'16px', fontSize:'15px', fontWeight:'700', fontFamily:'DM Sans,sans-serif', cursor:'pointer', width:'100%' }
  const btnGold = { background:'#d97706', color:'white', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'13px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer' }
  const btnGhost = { background:'transparent', color:'#9ca3af', border:'1px solid #2a2d35', borderRadius:'10px', padding:'10px 16px', fontSize:'13px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer' }
  const sectionLabel = { fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', display:'block' }
  const statusColors = {
    active: { bg:'#052e16', text:'#4ade80' },
    paused: { bg:'#1c1917', text:'#f59e0b' },
    cancelled: { bg:'#1f0606', text:'#f87171' },
  }
  const orderStatusColors = {
    pending: { bg:'#1e3a5f', text:'#93c5fd' },
    in_progress: { bg:'#1c1400', text:'#fbbf24' },
    ready: { bg:'#052e16', text:'#4ade80' },
    completed: { bg:'#111318', text:'#6b7280' },
    cancelled: { bg:'#1f0606', text:'#f87171' },
  }

  const NAV = [
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'messages', label: `Messages${unreadMessages > 0 ? ` (${unreadMessages})` : ''}`, icon: '✉️' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
  ]

  // PIN GATE
  if (!unlocked) return (
    <div style={{minHeight:'100vh', background:'#0d1117', display:'flex', flexDirection:'column'}}>
      <div style={{background:'linear-gradient(160deg,#0f1923,#0d2137)', padding:'48px 24px 40px', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(59,130,246,0.08)'}}></div>
        <div style={{fontSize:'40px', marginBottom:'12px'}}>🔐</div>
        <h1 style={{fontFamily:'Georgia,serif', fontSize:'28px', fontWeight:'700', color:'white', margin:'0 0 8px'}}>Admin Access</h1>
        <p style={{color:'#6b7280', fontSize:'14px', margin:'0'}}>Cloud Castle Coffee Club</p>
      </div>

      <div style={{flex:1, padding:'32px 24px', maxWidth:'480px', width:'100%', margin:'0 auto', boxSizing:'border-box'}}>
        <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px'}}>Admin PIN</label>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          maxLength={6} placeholder="· · · · · ·"
          style={{...inp, textAlign:'center', letterSpacing:'0.3em', fontSize:'24px', padding:'20px', marginBottom:'12px'}} />
        {pinError && (
          <div style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', padding:'12px', color:'#f87171', fontSize:'14px', textAlign:'center', marginBottom:'12px'}}>
            Incorrect PIN. Try again.
          </div>
        )}
        <button onClick={checkPin} style={btnPrimary}>Unlock Dashboard</button>
        <p style={{color:'#4b5563', fontSize:'12px', textAlign:'center', marginTop:'16px'}}>Demo PIN: 123456</p>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#0d1117', display:'flex', flexDirection:'column', maxWidth:'600px', margin:'0 auto'}}>

      {/* Top nav */}
      <div style={{background:'#1a1d24', borderBottom:'1px solid #2a2d35', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'20px'}}>☁</span>
          <span style={{fontFamily:'Georgia,serif', fontWeight:'700', color:'white', fontSize:'17px'}}>Cloud Castle <span style={{color:'#d97706'}}>Admin</span></span>
        </div>
        <button onClick={() => setUnlocked(false)}
          style={{background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'8px 14px', color:'#f87171', fontSize:'13px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer'}}>
          🔒 Lock
        </button>
      </div>

      {/* Content */}
      <div style={{flex:1, padding:'20px 20px 100px'}}>

        {/* MEMBERS LIST */}
        {panel === 'members' && !selected && (
          <div>
            {/* Stats */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
              {[
                { label: 'Total Members', value: members.length, sub: `${members.filter(m=>m.status==='active').length} active` },
                { label: 'MRR', value: `$${totalMRR}`, sub: 'monthly recurring' },
                { label: 'Add-on Revenue', value: `$${totalAddonRevenue}`, sub: 'all time' },
                { label: 'Orders Today', value: todayOrders.length, sub: 'across all members' },
              ].map(s => (
                <div key={s.label} style={{...card, marginBottom:0, padding:'14px'}}>
                  <p style={{fontSize:'10px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px'}}>{s.label}</p>
                  <p style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'2px'}}>{s.value}</p>
                  <p style={{fontSize:'11px', color:'#4b5563'}}>{s.sub}</p>
                </div>
              ))}
            </div>

            <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'14px'}}>All Members</h2>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search by name or phone..."
              style={{...inp, marginBottom:'14px'}} />

            {filtered.length === 0 && <p style={{color:'#6b7280', fontSize:'14px'}}>No members found.</p>}
            {filtered.map(m => (
              <button key={m.id} onClick={() => setSelected(m)}
                style={{...card, width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', textAlign:'left', fontFamily:'DM Sans,sans-serif', border:'1px solid #2a2d35'}}>
                <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                  <div style={{width:'42px', height:'42px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', color:'#93c5fd', fontWeight:'700', fontSize:'15px', flexShrink:0}}>{initials(m)}</div>
                  <div>
                    <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>{fullName(m)}</p>
                    <p style={{color:'#6b7280', fontSize:'12px', marginBottom:'3px'}}>{m.phone || 'No phone'}</p>
                    <span style={{fontSize:'11px', padding:'2px 8px', borderRadius:'100px', fontWeight:'600', background: statusColors[m.status||'active']?.bg, color: statusColors[m.status||'active']?.text}}>
                      {m.status || 'active'}
                    </span>
                  </div>
                </div>
                <span style={{color:'#4b5563', fontSize:'20px'}}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* MEMBER PROFILE */}
        {panel === 'members' && selected && (
          <div>
            <button onClick={() => setSelected(null)}
              style={{background:'none', border:'none', color:'#3b82f6', fontSize:'14px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer', marginBottom:'20px', padding:'0', display:'flex', alignItems:'center', gap:'6px'}}>
              ← Back to Members
            </button>

            {/* Profile header */}
            <div style={{...card, marginBottom:'16px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px'}}>
                <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'#1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', color:'#93c5fd', fontWeight:'700', fontSize:'20px', flexShrink:0}}>{initials(selected)}</div>
                <div>
                  <p style={{fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'700', color:'white', marginBottom:'3px'}}>{fullName(selected)}</p>
                  <p style={{color:'#6b7280', fontSize:'13px', marginBottom:'6px'}}>{selected.phone || 'No phone'}</p>
                  <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'100px', fontWeight:'600', background: statusColors[selected.status||'active']?.bg, color: statusColors[selected.status||'active']?.text}}>
                    {selected.status || 'active'}
                  </span>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'16px'}}>
                {[
                  { label: 'Orders', value: getMemberOrders(selected.id).length },
                  { label: 'Add-on Spend', value: `$${getMemberOrders(selected.id).reduce((s,o)=>s+Number(o.total_addons),0).toFixed(2)}` },
                  { label: 'Joined', value: selected.joined_at ? new Date(selected.joined_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—' },
                ].map(s => (
                  <div key={s.label} style={{background:'#111318', border:'1px solid #2a2d35', borderRadius:'12px', padding:'12px', textAlign:'center'}}>
                    <p style={{fontSize:'10px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px'}}>{s.label}</p>
                    <p style={{fontFamily:'Georgia,serif', fontSize:'18px', fontWeight:'700', color:'white'}}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Status changer */}
              <div style={{marginBottom:'16px'}}>
                <span style={sectionLabel}>Member Status</span>
                <div style={{display:'flex', gap:'8px'}}>
                  {['active','paused','cancelled'].map(s => (
                    <button key={s} onClick={async () => {
                      await supabase.from('profiles').update({status:s}).eq('id',selected.id)
                      fetchMembers(); setSelected({...selected, status:s}); showToast('Status updated!')
                    }} style={{flex:1, padding:'10px', borderRadius:'10px', border:'1px solid', fontSize:'12px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer',
                      background: selected.status===s ? statusColors[s]?.bg : 'transparent',
                      color: selected.status===s ? statusColors[s]?.text : '#6b7280',
                      borderColor: selected.status===s ? statusColors[s]?.text+'40' : '#2a2d35',
                    }}>
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <span style={sectionLabel}>Admin Actions</span>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                <button onClick={() => showToast('Refund issued!')} style={btnGold}>💸 Issue Refund</button>
                <button onClick={() => showToast('Free upgrade sent!')} style={btnGold}>✨ Free Upgrade</button>
                <button onClick={() => showToast('Email sent!')} style={btnGhost}>📧 Send Email</button>
                <button onClick={() => showToast('SMS sent!')} style={btnGhost}>💬 Send SMS</button>
              </div>
            </div>

            {/* Order history */}
            <h3 style={{fontFamily:'Georgia,serif', fontSize:'18px', fontWeight:'700', color:'white', marginBottom:'14px'}}>Order History</h3>
            {getMemberOrders(selected.id).length === 0 && <p style={{color:'#6b7280', fontSize:'14px'}}>No orders yet.</p>}
            {getMemberOrders(selected.id).map(o => (
              <div key={o.id} style={{...card, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>{o.drink}</p>
                  <p style={{color:'#6b7280', fontSize:'12px', marginBottom:'3px'}}>{o.milk}{o.addons?.length ? ' · '+o.addons.join(', ') : ''}{o.is_premium ? ' · ✨' : ''}</p>
                  <p style={{color:'#4b5563', fontSize:'11px'}}>{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{color:'white', fontSize:'14px', fontWeight:'700', marginBottom:'6px'}}>${Number(o.total_addons).toFixed(2)}</p>
                  <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                    style={{background:'#111318', border:'1px solid #2a2d35', borderRadius:'8px', padding:'6px 10px', color:'white', fontSize:'12px', fontFamily:'DM Sans,sans-serif', outline:'none'}}>
                    {['pending','in_progress','ready','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS */}
        {panel === 'orders' && !selectedOrder && (
          <div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'20px'}}>All Orders</h2>
            {orders.length === 0 && <p style={{color:'#6b7280', fontSize:'14px'}}>No orders yet.</p>}
            {orders.map(o => {
              const member = members.find(m => m.id === o.member_id)
              const sc = orderStatusColors[o.status] || orderStatusColors.pending
              return (
                <div key={o.id} style={card}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                    <div>
                      <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>{o.drink}</p>
                      <p style={{color:'#6b7280', fontSize:'12px', marginBottom:'3px'}}>{member ? fullName(member) : 'Unknown'}</p>
                      <p style={{color:'#6b7280', fontSize:'12px'}}>{o.milk}{o.addons?.length ? ' · '+o.addons.join(', ') : ''}</p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <p style={{color:'white', fontSize:'14px', fontWeight:'700', marginBottom:'6px'}}>${Number(o.total_addons).toFixed(2)}</p>
                      <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'100px', fontWeight:'600', background:sc.bg, color:sc.text}}>{o.status}</span>
                    </div>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <p style={{color:'#4b5563', fontSize:'11px'}}>{new Date(o.created_at).toLocaleString()}</p>
                    <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                      style={{background:'#111318', border:'1px solid #2a2d35', borderRadius:'8px', padding:'6px 10px', color:'white', fontSize:'12px', fontFamily:'DM Sans,sans-serif', outline:'none'}}>
                      {['pending','in_progress','ready','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MESSAGES */}
        {panel === 'messages' && (
          <div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'20px'}}>
              Member Messages {unreadMessages > 0 && <span style={{fontSize:'14px', background:'#3b82f6', color:'white', borderRadius:'100px', padding:'2px 10px', marginLeft:'8px'}}>{unreadMessages} new</span>}
            </h2>
            {messages.length === 0 && <p style={{color:'#6b7280', fontSize:'14px'}}>No messages yet.</p>}
            {messages.map(msg => {
              const member = members.find(m => m.id === msg.member_id)
              return (
                <div key={msg.id} style={{...card, borderColor: !msg.read ? '#1e3a5f' : '#2a2d35'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                    <div>
                      <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>{msg.subject || 'No subject'}</p>
                      <p style={{color:'#6b7280', fontSize:'12px'}}>{member ? fullName(member) : 'Unknown'} · {new Date(msg.created_at).toLocaleDateString()}</p>
                    </div>
                    {!msg.read && <span style={{background:'#1e3a5f', color:'#93c5fd', fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'100px', flexShrink:0}}>New</span>}
                  </div>
                  <p style={{color:'#9ca3af', fontSize:'13px', lineHeight:'1.5', marginBottom:'12px'}}>{msg.body}</p>
                  {!msg.read && (
                    <button onClick={async () => {
                      await supabase.from('messages').update({read:true}).eq('id',msg.id)
                      fetchMessages(); showToast('Marked as read')
                    }} style={{background:'none', border:'none', color:'#3b82f6', fontSize:'13px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer', padding:'0'}}>
                      Mark as read
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* REVENUE */}
        {panel === 'revenue' && (
          <div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'20px'}}>Revenue</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
              {[
                { label: 'MRR', value: `$${totalMRR}`, sub: 'from active members' },
                { label: 'Add-on Revenue', value: `$${totalAddonRevenue}`, sub: 'all time' },
                { label: 'Active Members', value: members.filter(m=>m.status==='active').length, sub: 'paying subscribers' },
                { label: 'Total Orders', value: orders.length, sub: 'all time' },
              ].map(s => (
                <div key={s.label} style={{...card, marginBottom:0, padding:'14px'}}>
                  <p style={{fontSize:'10px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px'}}>{s.label}</p>
                  <p style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'2px'}}>{s.value}</p>
                  <p style={{fontSize:'11px', color:'#4b5563'}}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={card}>
              <span style={sectionLabel}>Monthly Add-on Revenue</span>
              <div style={{display:'flex', gap:'8px', alignItems:'flex-end', height:'120px'}}>
                {[
                  { month:'Jan', pct:40 }, { month:'Feb', pct:55 }, { month:'Mar', pct:70 },
                  { month:'Apr', pct:100 }, { month:'May', pct:0 }, { month:'Jun', pct:0 },
                ].map(b => (
                  <div key={b.month} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:'6px', height:'100%'}}>
                    <div style={{width:'100%', background: b.pct > 0 ? '#1e3a5f' : '#111318', borderRadius:'6px 6px 0 0', height:`${b.pct}%`, minHeight: b.pct > 0 ? '4px' : '0', border: b.pct > 0 ? '1px solid #2a4a7f' : 'none'}}></div>
                    <p style={{fontSize:'10px', color:'#6b7280'}}>{b.month}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast */}
            <div style={card}>
              <span style={sectionLabel}>Broadcast Message</span>
              <div style={{marginBottom:'12px'}}>
                <label style={{...sectionLabel, marginBottom:'8px'}}>Audience</label>
                <select style={{...inp, padding:'12px'}}>
                  <option>All Active Members ({members.filter(m=>m.status==='active').length})</option>
                  <option>All Members ({members.length})</option>
                </select>
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{...sectionLabel, marginBottom:'8px'}}>Channel</label>
                <select style={{...inp, padding:'12px'}}>
                  <option>Email + SMS</option>
                  <option>Email Only</option>
                  <option>SMS Only</option>
                </select>
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{...sectionLabel, marginBottom:'8px'}}>Subject</label>
                <input value={broadcastForm.subject} onChange={e => setBroadcastForm({...broadcastForm, subject:e.target.value})}
                  style={inp} placeholder="e.g. ☕ A special treat for you!"
                  onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={e => e.target.style.borderColor='#2a2d35'} />
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{...sectionLabel, marginBottom:'8px'}}>Message</label>
                <textarea value={broadcastForm.body} onChange={e => setBroadcastForm({...broadcastForm, body:e.target.value})}
                  style={{...inp, height:'100px', resize:'none'}} placeholder="Write your message..." />
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={() => showToast('Broadcast coming in Phase 3 with Twilio + Resend!')} style={{...btnPrimary, flex:2}}>Send Now</button>
                <button onClick={() => showToast('Draft saved!')} style={{...btnGhost, flex:1}}>Save Draft</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom tab bar */}
      <div style={{position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'600px', background:'#1a1d24', borderTop:'1px solid #2a2d35', display:'flex', zIndex:50}}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setPanel(item.id); setSelected(null); setSelectedOrder(null) }}
            style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'12px 4px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', gap:'4px'}}>
            <span style={{fontSize:'20px'}}>{item.icon}</span>
            <span style={{fontSize:'10px', fontWeight:'600', color: panel===item.id ? '#d97706' : '#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center'}}>{item.label}</span>
            {panel === item.id && <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'#d97706'}}></div>}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', background:'#d97706', color:'white', padding:'14px 24px', borderRadius:'100px', fontSize:'14px', fontWeight:'600', zIndex:100, whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}
    </div>
  )
}