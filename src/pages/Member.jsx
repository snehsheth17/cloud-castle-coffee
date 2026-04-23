import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const DRINKS = [
  { name: 'Latte', emoji: '☕', desc: 'Espresso + steamed milk' },
  { name: 'Cappuccino', emoji: '☕', desc: 'Bold espresso foam' },
  { name: 'Cold Brew', emoji: '🧋', desc: 'Slow-steeped smooth' },
  { name: 'Americano', emoji: '☕', desc: 'Espresso + water' },
  { name: 'Matcha Latte', emoji: '🍵', desc: 'Ceremonial green tea' },
  { name: 'Chai Latte', emoji: '🫖', desc: 'Spiced tea blend' },
]
const FLAVORS = ['Vanilla', 'Caramel', 'Hazelnut', 'Brown Sugar', 'Lavender']
const MILKS = [
  { name: 'Whole Milk', price: 0 },
  { name: 'Oat Milk', price: 1 },
  { name: 'Almond Milk', price: 1 },
  { name: 'Coconut Milk', price: 1 },
]
const EXTRAS = ['Whip Cream', 'Extra Shot', 'Cold Foam', 'Caramel Drizzle']

const NAV = [
  { id: 'card', label: 'Home', icon: '🏠' },
  { id: 'order', label: 'Order', icon: '☕' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'account', label: 'Account', icon: '👤' },
]

export default function Member({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [panel, setPanel] = useState('card')
  const [subPanel, setSubPanel] = useState(null)
  const [toast, setToast] = useState('')
  const [drink, setDrink] = useState('Latte')
  const [milk, setMilk] = useState(MILKS[0])
  const [addons, setAddons] = useState([])
  const [isPremium, setIsPremium] = useState(false)
  const [scheduleType, setScheduleType] = useState('asap')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('08:00')
  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [msgForm, setMsgForm] = useState({ subject: '', body: '' })
  const [saving, setSaving] = useState(false)
  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchOrders()
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
      showToast('Welcome to the club! ☕')
      window.history.replaceState({}, '', '/member')
    }
  }, [])

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setProfile(data)
      setAccountForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '' })
    }
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').eq('member_id', session.user.id).order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function fetchBilling() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/get-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })
      const data = await res.json()
      setBilling(data)
    } catch (err) { console.error(err) }
    setBillingLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  function toggleAddon(name) { setAddons(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]) }
  function calcTotal() { return milk.price + addons.length + (isPremium ? 2 : 0) }

  async function placeOrder() {
    const scheduledFor = scheduleType === 'schedule' && schedDate
      ? new Date(`${schedDate}T${schedTime}`).toISOString()
      : new Date().toISOString()
    const { error } = await supabase.from('orders').insert({
      member_id: session.user.id, drink, milk: milk.name, addons,
      is_premium: isPremium, total_addons: calcTotal(), status: 'pending', scheduled_for: scheduledFor,
    })
    if (error) showToast('Error placing order.')
    else {
      showToast('Order placed! ☕')
      fetchOrders()
      setDrink('Latte'); setMilk(MILKS[0]); setAddons([])
      setIsPremium(false); setScheduleType('asap'); setSchedDate(''); setSchedTime('08:00')
      setPanel('card')
    }
  }

  async function saveAccount() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(accountForm).eq('id', session.user.id)
    if (error) showToast('Error saving.')
    else { showToast('Details saved!'); fetchProfile() }
    setSaving(false)
  }

  async function sendMessage() {
    const { error } = await supabase.from('messages').insert({ member_id: session.user.id, subject: msgForm.subject, body: msgForm.body })
    if (error) showToast('Error sending.')
    else { showToast('Message sent! ✉️'); setMsgForm({ subject: '', body: '' }) }
  }

  async function signOut() { await supabase.auth.signOut(); navigate('/login') }

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : session.user.email
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const joinDate = profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const thisMonth = orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth()).length
  const totalSpend = orders.reduce((s, o) => s + Number(o.total_addons), 0).toFixed(2)

  // Styles
  const card = { background:'#1a1d24', border:'1px solid #2a2d35', borderRadius:'16px', padding:'16px', marginBottom:'12px' }
  const inp = { background:'#111318', border:'1px solid #2a2d35', borderRadius:'12px', padding:'14px', color:'white', fontSize:'16px', width:'100%', outline:'none', fontFamily:'DM Sans,sans-serif', boxSizing:'border-box' }
  const chipBase = { borderRadius:'100px', padding:'8px 16px', fontSize:'13px', fontWeight:'600', border:'1px solid', cursor:'pointer', fontFamily:'DM Sans,sans-serif', display:'inline-block' }
  const chipOn = { ...chipBase, background:'#3b82f6', color:'white', borderColor:'#3b82f6' }
  const chipOff = { ...chipBase, background:'transparent', color:'#9ca3af', borderColor:'#374151' }
  const btnPrimary = { background:'#3b82f6', color:'white', border:'none', borderRadius:'14px', padding:'16px', fontSize:'16px', fontWeight:'700', fontFamily:'DM Sans,sans-serif', cursor:'pointer', width:'100%' }
  const sectionLabel = { fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', display:'block' }

  return (
    <div style={{minHeight:'100vh', background:'#0d1117', display:'flex', flexDirection:'column', maxWidth:'600px', margin:'0 auto'}}>

      {/* Top nav */}
      <div style={{background:'#1a1d24', borderBottom:'1px solid #2a2d35', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'22px'}}>☁</span>
          <span style={{fontFamily:'Georgia,serif', fontWeight:'700', color:'white', fontSize:'18px'}}>Cloud Castle <span style={{color:'#3b82f6'}}>CC</span></span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'34px', height:'34px', borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'13px'}}>{initials}</div>
          <button onClick={signOut} style={{background:'none', border:'none', color:'#6b7280', fontSize:'13px', cursor:'pointer', fontFamily:'DM Sans,sans-serif'}}>Sign out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1, padding:'20px 20px 100px', overflowY:'auto'}}>

        {/* HOME / MY CARD */}
        {panel === 'card' && (
          <div>
            {/* Membership card */}
            <div style={{background:'linear-gradient(135deg,#1e3a5f,#1a237e,#0d47a1)', borderRadius:'20px', padding:'24px', marginBottom:'20px', position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(96,165,250,0.15)'}}></div>
              <p style={{color:'#93c5fd', fontSize:'11px', fontWeight:'600', letterSpacing:'0.1em', marginBottom:'16px'}}>☁ CLOUD CASTLE COFFEE CLUB</p>
              <p style={{fontFamily:'Georgia,serif', fontSize:'24px', fontWeight:'700', color:'white', margin:'0 0 8px'}}>{fullName || 'Member'}</p>
              <div style={{display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.3)', borderRadius:'100px', padding:'4px 12px', marginBottom:'20px'}}>
                <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#60a5fa'}}></div>
                <span style={{color:'#93c5fd', fontSize:'11px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.06em'}}>{profile?.status || 'Active'} Member</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <div>
                  <p style={{color:'rgba(255,255,255,0.4)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px'}}>Since</p>
                  <p style={{color:'white', fontSize:'13px', fontWeight:'500'}}>{joinDate}</p>
                </div>
                <div>
                  <p style={{color:'rgba(255,255,255,0.4)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px'}}>Plan</p>
                  <p style={{color:'white', fontSize:'13px', fontWeight:'500'}}>$30 / mo</p>
                </div>
                <div style={{background:'#3b82f6', color:'white', borderRadius:'100px', padding:'6px 14px', fontSize:'12px', fontWeight:'700'}}>{orders.length} Orders</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px'}}>
              {[
                { label: 'This Month', value: thisMonth, sub: 'orders' },
                { label: 'Add-ons', value: `$${totalSpend}`, sub: 'spent' },
                { label: 'Next Bill', value: 'May 14', sub: '$30.00' },
              ].map(s => (
                <div key={s.label} style={{...card, marginBottom:0, textAlign:'center', padding:'14px 10px'}}>
                  <p style={{fontSize:'10px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px'}}>{s.label}</p>
                  <p style={{fontFamily:'Georgia,serif', fontSize:'20px', fontWeight:'700', color:'white', marginBottom:'2px'}}>{s.value}</p>
                  <p style={{fontSize:'11px', color:'#4b5563'}}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick order CTA */}
            <button onClick={() => setPanel('order')} style={{...btnPrimary, marginBottom:'20px', fontSize:'15px', padding:'18px'}}>
              ☕ Place an Order
            </button>

            {/* Recent activity */}
            <span style={sectionLabel}>Recent Activity</span>
            {orders.slice(0,5).length === 0 && <p style={{color:'#6b7280', fontSize:'14px'}}>No orders yet — place your first one!</p>}
            {orders.slice(0,5).map(o => (
              <div key={o.id} style={{...card, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>{DRINKS.find(d=>d.name===o.drink)?.emoji} {o.drink}</p>
                  <p style={{color:'#6b7280', fontSize:'12px', marginBottom:'3px'}}>{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}</p>
                  <p style={{color:'#4b5563', fontSize:'11px'}}>{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{color:'white', fontSize:'14px', fontWeight:'700', marginBottom:'4px'}}>${Number(o.total_addons).toFixed(2)}</p>
                  <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'100px', fontWeight:'600', background: o.status==='completed' ? '#052e16' : '#1e3a5f', color: o.status==='completed' ? '#4ade80' : '#93c5fd'}}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER */}
        {panel === 'order' && (
          <div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'24px', fontWeight:'700', color:'white', marginBottom:'20px'}}>Build Your Drink</h2>

            <div style={card}>
              <span style={sectionLabel}>Choose Your Drink</span>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
                {DRINKS.map(d => (
                  <button key={d.name} onClick={() => setDrink(d.name)}
                    style={{background: drink===d.name ? 'rgba(59,130,246,0.15)' : '#111318', border: drink===d.name ? '1.5px solid #3b82f6' : '1.5px solid #2a2d35', borderRadius:'14px', padding:'14px', textAlign:'center', cursor:'pointer', transition:'all 0.15s'}}>
                    <div style={{fontSize:'28px', marginBottom:'6px'}}>{d.emoji}</div>
                    <div style={{color:'white', fontSize:'13px', fontWeight:'600'}}>{d.name}</div>
                    <div style={{color:'#6b7280', fontSize:'11px'}}>{d.desc}</div>
                  </button>
                ))}
              </div>

              {/* Premium toggle */}
              <div style={{background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'14px', padding:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
                <div>
                  <p style={{color:'#93c5fd', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>✨ Premium Upgrade</p>
                  <p style={{color:'#6b7280', fontSize:'12px'}}>Specialty syrups & artisan toppings — +$2</p>
                </div>
                <button onClick={() => setIsPremium(!isPremium)}
                  style={{width:'44px', height:'26px', borderRadius:'100px', background: isPremium ? '#3b82f6' : '#374151', border:'none', cursor:'pointer', position:'relative', flexShrink:0, transition:'background 0.2s'}}>
                  <span style={{position:'absolute', top:'3px', width:'20px', height:'20px', background:'white', borderRadius:'50%', transition:'all 0.2s', left: isPremium ? '21px' : '3px'}}></span>
                </button>
              </div>

              <span style={sectionLabel}>Flavors</span>
              <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px'}}>
                {FLAVORS.map(f => (
                  <button key={f} onClick={() => toggleAddon(f)} style={addons.includes(f) ? chipOn : chipOff}>
                    {f} <span style={{opacity:0.6, fontSize:'11px'}}>+$1</span>
                  </button>
                ))}
              </div>

              <span style={sectionLabel}>Milk Type</span>
              <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px'}}>
                {MILKS.map(m => (
                  <button key={m.name} onClick={() => setMilk(m)} style={milk.name===m.name ? chipOn : chipOff}>
                    {m.name} {m.price > 0 && <span style={{opacity:0.6, fontSize:'11px'}}>+$1</span>}
                  </button>
                ))}
              </div>

              <span style={sectionLabel}>Toppings & Extras</span>
              <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px'}}>
                {EXTRAS.map(e => (
                  <button key={e} onClick={() => toggleAddon(e)} style={addons.includes(e) ? chipOn : chipOff}>
                    {e} <span style={{opacity:0.6, fontSize:'11px'}}>+$1</span>
                  </button>
                ))}
              </div>

              <div style={{borderTop:'1px solid #2a2d35', paddingTop:'16px', marginBottom:'16px'}}>
                <span style={sectionLabel}>Pickup Timing</span>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px'}}>
                  {['asap','schedule'].map(t => (
                    <button key={t} onClick={() => setScheduleType(t)} style={scheduleType===t ? chipOn : chipOff}>
                      {t === 'asap' ? '⚡ ASAP' : '📅 Schedule'}
                    </button>
                  ))}
                </div>
                {scheduleType === 'schedule' && (
                  <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                      style={{...inp, width:'auto', flex:1, padding:'12px'}} />
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      style={{...inp, width:'auto', flex:1, padding:'12px'}} />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div style={{background:'#111318', border:'1px solid #2a2d35', borderRadius:'12px', padding:'14px', marginBottom:'16px'}}>
                <div style={{display:'flex', justifyContent:'space-between', color:'#9ca3af', fontSize:'13px', marginBottom:'6px'}}><span>☕ {drink}</span><span>Included</span></div>
                {milk.price > 0 && <div style={{display:'flex', justifyContent:'space-between', color:'#9ca3af', fontSize:'13px', marginBottom:'6px'}}><span>{milk.name}</span><span>+$1.00</span></div>}
                {addons.map(a => <div key={a} style={{display:'flex', justifyContent:'space-between', color:'#9ca3af', fontSize:'13px', marginBottom:'6px'}}><span>{a}</span><span>+$1.00</span></div>)}
                {isPremium && <div style={{display:'flex', justifyContent:'space-between', color:'#9ca3af', fontSize:'13px', marginBottom:'6px'}}><span>✨ Premium</span><span>+$2.00</span></div>}
                <div style={{display:'flex', justifyContent:'space-between', color:'white', fontSize:'15px', fontWeight:'700', borderTop:'1px solid #2a2d35', paddingTop:'10px', marginTop:'6px'}}>
                  <span>Total today</span><span>${calcTotal().toFixed(2)}</span>
                </div>
              </div>

              <button onClick={placeOrder} style={btnPrimary}>Place Order →</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {panel === 'history' && (
          <div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'24px', fontWeight:'700', color:'white', marginBottom:'20px'}}>Order History</h2>
            {orders.length === 0 && <p style={{color:'#6b7280', fontSize:'14px'}}>No orders yet.</p>}
            {orders.slice(0,10).map(o => (
              <div key={o.id} style={{...card, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>{DRINKS.find(d=>d.name===o.drink)?.emoji} {o.drink}</p>
                  <p style={{color:'#6b7280', fontSize:'12px', marginBottom:'3px'}}>{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}{o.is_premium ? ' · ✨' : ''}</p>
                  <p style={{color:'#4b5563', fontSize:'11px'}}>{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{color:'white', fontSize:'14px', fontWeight:'700', marginBottom:'4px'}}>${Number(o.total_addons).toFixed(2)}</p>
                  <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'100px', fontWeight:'600', background: o.status==='completed' ? '#052e16' : '#1e3a5f', color: o.status==='completed' ? '#4ade80' : '#93c5fd'}}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACCOUNT */}
        {panel === 'account' && !subPanel && (
          <div>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'24px', fontWeight:'700', color:'white', marginBottom:'20px'}}>Account</h2>

            {/* Profile summary */}
            <div style={{...card, display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px'}}>
              <div style={{width:'52px', height:'52px', borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', flexShrink:0}}>{initials}</div>
              <div>
                <p style={{color:'white', fontSize:'16px', fontWeight:'600', marginBottom:'3px'}}>{fullName}</p>
                <p style={{color:'#6b7280', fontSize:'13px'}}>{session.user.email}</p>
              </div>
            </div>

            {/* Menu items */}
            {[
              { label: 'My Details', sub: 'Name, phone number', icon: '👤', id: 'details' },
              { label: 'Billing', sub: 'Subscription & payment history', icon: '💳', id: 'billing' },
              { label: 'Message Us', sub: 'Get in touch with our team', icon: '✉️', id: 'message' },
            ].map(item => (
              <button key={item.id} onClick={() => { setSubPanel(item.id); if(item.id==='billing') fetchBilling() }}
                style={{...card, width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border:'1px solid #2a2d35', textAlign:'left', fontFamily:'DM Sans,sans-serif'}}>
                <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                  <span style={{fontSize:'22px'}}>{item.icon}</span>
                  <div>
                    <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'2px'}}>{item.label}</p>
                    <p style={{color:'#6b7280', fontSize:'12px'}}>{item.sub}</p>
                  </div>
                </div>
                <span style={{color:'#4b5563', fontSize:'18px'}}>›</span>
              </button>
            ))}

            <button onClick={signOut}
              style={{width:'100%', background:'transparent', border:'1px solid #2a2d35', borderRadius:'16px', padding:'16px', color:'#ef4444', fontSize:'14px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer', marginTop:'8px'}}>
              Sign Out
            </button>
          </div>
        )}

        {/* ACCOUNT SUB-PANELS */}
        {panel === 'account' && subPanel && (
          <div>
            <button onClick={() => setSubPanel(null)} style={{background:'none', border:'none', color:'#3b82f6', fontSize:'14px', fontWeight:'600', fontFamily:'DM Sans,sans-serif', cursor:'pointer', marginBottom:'20px', padding:'0', display:'flex', alignItems:'center', gap:'6px'}}>
              ← Back
            </button>

            {/* MY DETAILS */}
            {subPanel === 'details' && (
              <div>
                <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'20px'}}>My Details</h2>
                <div style={card}>
                  <div style={{display:'flex', gap:'12px', marginBottom:'14px'}}>
                    <div style={{flex:1}}>
                      <label style={{...sectionLabel, marginBottom:'8px'}}>First Name</label>
                      <input value={accountForm.first_name} onChange={e => setAccountForm({...accountForm, first_name: e.target.value})}
                        style={inp} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={e => e.target.style.borderColor='#2a2d35'} />
                    </div>
                    <div style={{flex:1}}>
                      <label style={{...sectionLabel, marginBottom:'8px'}}>Last Name</label>
                      <input value={accountForm.last_name} onChange={e => setAccountForm({...accountForm, last_name: e.target.value})}
                        style={inp} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={e => e.target.style.borderColor='#2a2d35'} />
                    </div>
                  </div>
                  <div style={{marginBottom:'14px'}}>
                    <label style={{...sectionLabel, marginBottom:'8px'}}>Email</label>
                    <input value={session.user.email} disabled style={{...inp, background:'#0d1117', color:'#4b5563', borderColor:'#1f2328'}} />
                  </div>
                  <div style={{marginBottom:'20px'}}>
                    <label style={{...sectionLabel, marginBottom:'8px'}}>Phone</label>
                    <input value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})}
                      style={inp} placeholder="(818) 555-0000"
                      onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={e => e.target.style.borderColor='#2a2d35'} />
                  </div>
                  <button onClick={saveAccount} disabled={saving} style={btnPrimary}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* BILLING */}
            {subPanel === 'billing' && (
              <div>
                <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'20px'}}>Billing</h2>
                <div style={card}>
                  <span style={sectionLabel}>Subscription</span>
                  {billingLoading ? (
                    <p style={{color:'#6b7280', fontSize:'14px'}}>Loading...</p>
                  ) : billing?.subscription ? (
                    <div style={{background:'#111318', border:'1px solid #2a2d35', borderRadius:'12px', padding:'14px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <div>
                        <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'4px'}}>Cloud Castle Monthly</p>
                        <p style={{color:'#6b7280', fontSize:'12px'}}>$30.00 / month · Renews {new Date(billing.subscription.current_period_end * 1000).toLocaleDateString()}</p>
                      </div>
                      <span style={{background:'#052e16', color:'#4ade80', fontSize:'11px', fontWeight:'600', padding:'4px 10px', borderRadius:'100px'}}>{billing.subscription.status}</span>
                    </div>
                  ) : (
                    <p style={{color:'#6b7280', fontSize:'14px', marginBottom:'20px'}}>No active subscription found.</p>
                  )}

                  <span style={sectionLabel}>Payment History</span>
                  {billingLoading ? (
                    <p style={{color:'#6b7280', fontSize:'14px'}}>Loading...</p>
                  ) : billing?.invoices?.length === 0 ? (
                    <p style={{color:'#6b7280', fontSize:'14px'}}>No payments yet.</p>
                  ) : (
                    billing?.invoices?.map(inv => (
                      <div key={inv.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #2a2d35'}}>
                        <div>
                          <p style={{color:'white', fontSize:'14px', fontWeight:'600', marginBottom:'3px'}}>${(inv.amount/100).toFixed(2)}</p>
                          <p style={{color:'#6b7280', fontSize:'12px'}}>{new Date(inv.date*1000).toLocaleDateString()}</p>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <span style={{background: inv.status==='paid' ? '#052e16' : '#1e3a5f', color: inv.status==='paid' ? '#4ade80' : '#93c5fd', fontSize:'11px', fontWeight:'600', padding:'4px 10px', borderRadius:'100px'}}>{inv.status}</span>
                          {inv.pdf && <a href={inv.pdf} target="_blank" rel="noreferrer" style={{color:'#3b82f6', fontSize:'12px', textDecoration:'none', border:'1px solid #2a2d35', borderRadius:'8px', padding:'4px 10px'}}>PDF</a>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MESSAGE */}
            {subPanel === 'message' && (
              <div>
                <h2 style={{fontFamily:'Georgia,serif', fontSize:'22px', fontWeight:'700', color:'white', marginBottom:'20px'}}>Message the Team</h2>
                <div style={card}>
                  <div style={{marginBottom:'14px'}}>
                    <label style={{...sectionLabel, marginBottom:'8px'}}>Subject</label>
                    <input value={msgForm.subject} onChange={e => setMsgForm({...msgForm, subject: e.target.value})}
                      style={inp} placeholder="e.g. Question about my order"
                      onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={e => e.target.style.borderColor='#2a2d35'} />
                  </div>
                  <div style={{marginBottom:'20px'}}>
                    <label style={{...sectionLabel, marginBottom:'8px'}}>Message</label>
                    <textarea value={msgForm.body} onChange={e => setMsgForm({...msgForm, body: e.target.value})}
                      style={{...inp, height:'120px', resize:'none'}} placeholder="Tell us what's on your mind..." />
                  </div>
                  <button onClick={sendMessage} style={btnPrimary}>Send Message</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div style={{position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'600px', background:'#1a1d24', borderTop:'1px solid #2a2d35', display:'flex', zIndex:50}}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setPanel(item.id); setSubPanel(null) }}
            style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'12px 8px', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', gap:'4px'}}>
            <span style={{fontSize:'20px'}}>{item.icon}</span>
            <span style={{fontSize:'10px', fontWeight:'600', color: panel===item.id ? '#3b82f6' : '#6b7280', textTransform:'uppercase', letterSpacing:'0.05em'}}>{item.label}</span>
            {panel === item.id && <div style={{width:'4px', height:'4px', borderRadius:'50%', background:'#3b82f6'}}></div>}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', background:'#3b82f6', color:'white', padding:'14px 24px', borderRadius:'100px', fontSize:'14px', fontWeight:'600', zIndex:100, whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}
    </div>
  )
}