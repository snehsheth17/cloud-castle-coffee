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

export default function Member({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [panel, setPanel] = useState('card')
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
      showToast('Welcome to the club! ☕ Your membership is active.')
      window.history.replaceState({}, '', '/member')
    }
  }, [])

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) { setProfile(data); setAccountForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '' }) }
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
      setDrink('Latte'); setMilk(MILKS[0]); setAddons([]); setIsPremium(false)
      setScheduleType('asap'); setSchedDate(''); setSchedTime('08:00'); setPanel('card')
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
    else { showToast('Message sent!'); setMsgForm({ subject: '', body: '' }) }
  }

  async function signOut() { await supabase.auth.signOut(); navigate('/login') }

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : session.user.email
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const joinDate = profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const thisMonth = orders.filter(o => new Date(o.created_at).getMonth() === new Date().getMonth()).length
  const totalSpend = orders.reduce((s, o) => s + Number(o.total_addons), 0).toFixed(2)

  const navItems = [
    { id: 'card', label: 'My Card', icon: '☕' },
    { id: 'order', label: 'Order Now', icon: '🧾' },
    { id: 'history', label: 'Order History', icon: '📋' },
    { id: 'account', label: 'My Details', icon: '👤' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'message', label: 'Message Us', icon: '✉️' },
  ]

  // shared input style
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 placeholder-gray-500"

  return (
    <div className="flex flex-col h-screen" style={{background:'#111318'}}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 flex-shrink-0" style={{background:'#1a1d24', borderBottom:'1px solid #2a2d35'}}>
        <span className="font-bold text-lg text-white" style={{fontFamily:'Georgia,serif'}}>☁ <span className="text-blue-400">Cloud Castle</span> <span className="text-gray-400 font-normal text-sm">Coffee Club</span></span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
          <button onClick={signOut} className="text-gray-500 text-xs hover:text-gray-300 transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 flex flex-col py-4 gap-1 flex-shrink-0" style={{background:'#1a1d24', borderRight:'1px solid #2a2d35'}}>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest px-4 pb-1">My Club</p>
          {navItems.slice(0,3).map(item => (
            <button key={item.id} onClick={() => setPanel(item.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-all ${panel === item.id ? 'text-white font-semibold border-r-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              style={panel === item.id ? {background:'rgba(59,130,246,0.1)'} : {}}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest px-4 pb-1 mt-4">Account</p>
          {navItems.slice(3).map(item => (
            <button key={item.id} onClick={() => { setPanel(item.id); if(item.id === 'billing') fetchBilling() }}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-all ${panel === item.id ? 'text-white font-semibold border-r-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              style={panel === item.id ? {background:'rgba(59,130,246,0.1)'} : {}}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6" style={{background:'#111318'}}>

          {/* MY CARD */}
          {panel === 'card' && (
            <div>
              <div className="rounded-2xl p-6 mb-6 max-w-sm relative overflow-hidden" style={{background:'linear-gradient(135deg,#1e3a5f,#1a237e,#0d47a1)'}}>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{background:'#60a5fa'}}></div>
                <p className="text-blue-300 text-xs font-semibold tracking-widest mb-4" style={{fontFamily:'Georgia,serif'}}>☁ CLOUD CASTLE COFFEE CLUB</p>
                <p className="text-white text-xl font-bold mb-1" style={{fontFamily:'Georgia,serif'}}>{fullName || 'Member'}</p>
                <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4" style={{background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.3)'}}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  {profile?.status || 'Active'} Member
                </div>
                <div className="flex justify-between items-end">
                  <div><p className="text-xs uppercase tracking-wide mb-1" style={{color:'rgba(255,255,255,0.4)'}}>Member Since</p><p className="text-white text-sm font-medium">{joinDate}</p></div>
                  <div><p className="text-xs uppercase tracking-wide mb-1" style={{color:'rgba(255,255,255,0.4)'}}>Plan</p><p className="text-white text-sm font-medium">$30 / mo</p></div>
                  <div className="bg-blue-500 text-white rounded-full px-3 py-1 text-xs font-bold">{orders.length} Orders</div>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                {[
                  { label: 'This Month', value: thisMonth, sub: 'orders placed' },
                  { label: 'Add-on Spend', value: `$${totalSpend}`, sub: 'total upgrades' },
                  { label: 'Next Billing', value: 'May 14', sub: '$30.00' },
                ].map(s => (
                  <div key={s.label} className="flex-1 rounded-xl p-3" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-white" style={{fontFamily:'Georgia,serif'}}>{s.value}</p>
                    <p className="text-xs text-gray-600">{s.sub}</p>
                  </div>
                ))}
              </div>

              <h2 className="text-base font-bold text-white mb-3" style={{fontFamily:'Georgia,serif'}}>Recent Activity</h2>
              {orders.slice(0,3).length === 0 && <p className="text-sm text-gray-500">No orders yet — place your first one!</p>}
              <div className="flex flex-col gap-2">
                {orders.slice(0,3).map(o => (
                  <div key={o.id} className="rounded-xl p-3 flex justify-between items-center" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                    <div>
                      <p className="text-sm font-semibold text-white">{DRINKS.find(d=>d.name===o.drink)?.emoji} {o.drink}</p>
                      <p className="text-xs text-gray-500">{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${Number(o.total_addons).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400'}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDER NOW */}
          {panel === 'order' && (
            <div>
              <h2 className="text-base font-bold text-white mb-4" style={{fontFamily:'Georgia,serif'}}>Build Your Drink</h2>
              <div className="rounded-xl p-4" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Choose Your Drink</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {DRINKS.map(d => (
                    <button key={d.name} onClick={() => setDrink(d.name)}
                      className="rounded-xl p-3 text-center transition-all"
                      style={drink === d.name ? {background:'rgba(59,130,246,0.15)', border:'1.5px solid #3b82f6'} : {background:'#111318', border:'1.5px solid #2a2d35'}}>
                      <div className="text-2xl mb-1">{d.emoji}</div>
                      <div className="text-xs font-semibold text-white">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl p-3 mb-4" style={{background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)'}}>
                  <div>
                    <p className="text-sm font-semibold text-blue-400">✨ Premium Upgrade</p>
                    <p className="text-xs text-gray-500">Specialty syrups, artisan toppings — +$2</p>
                  </div>
                  <button onClick={() => setIsPremium(!isPremium)}
                    className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{background: isPremium ? '#3b82f6' : '#374151'}}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isPremium ? 'left-4' : 'left-0.5'}`}></span>
                  </button>
                </div>

                {[
                  { title: 'Flavors', items: FLAVORS, isAddon: true },
                ].map(section => (
                  <div key={section.title} className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{section.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {section.items.map(f => (
                        <button key={f} onClick={() => toggleAddon(f)}
                          className="rounded-full px-3 py-1 text-xs transition-all"
                          style={addons.includes(f) ? {background:'#3b82f6', color:'white', border:'1px solid #3b82f6'} : {background:'transparent', color:'#9ca3af', border:'1px solid #374151'}}>
                          {f} <span className="opacity-60">+$1</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Milk Type</p>
                  <div className="flex flex-wrap gap-2">
                    {MILKS.map(m => (
                      <button key={m.name} onClick={() => setMilk(m)}
                        className="rounded-full px-3 py-1 text-xs transition-all"
                        style={milk.name === m.name ? {background:'#3b82f6', color:'white', border:'1px solid #3b82f6'} : {background:'transparent', color:'#9ca3af', border:'1px solid #374151'}}>
                        {m.name} {m.price > 0 && <span className="opacity-60">+$1</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Toppings & Extras</p>
                  <div className="flex flex-wrap gap-2">
                    {EXTRAS.map(e => (
                      <button key={e} onClick={() => toggleAddon(e)}
                        className="rounded-full px-3 py-1 text-xs transition-all"
                        style={addons.includes(e) ? {background:'#3b82f6', color:'white', border:'1px solid #3b82f6'} : {background:'transparent', color:'#9ca3af', border:'1px solid #374151'}}>
                        {e} <span className="opacity-60">+$1</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{borderTop:'1px solid #2a2d35', marginBottom:'1rem', marginTop:'1rem'}}></div>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pickup Timing</p>
                <div className="flex gap-2 mb-4 flex-wrap items-center">
                  {['asap', 'schedule'].map(t => (
                    <button key={t} onClick={() => setScheduleType(t)}
                      className="rounded-full px-3 py-1 text-xs transition-all"
                      style={scheduleType === t ? {background:'#3b82f6', color:'white', border:'1px solid #3b82f6'} : {background:'transparent', color:'#9ca3af', border:'1px solid #374151'}}>
                      {t === 'asap' ? 'ASAP' : 'Schedule'}
                    </button>
                  ))}
                  {scheduleType === 'schedule' && <>
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-500" />
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-500" />
                  </>}
                </div>

                <div className="rounded-xl p-3 mb-4" style={{background:'#111318', border:'1px solid #2a2d35'}}>
                  <div className="flex justify-between text-sm text-gray-400 mb-1"><span>☕ {drink}</span><span>Included</span></div>
                  {milk.price > 0 && <div className="flex justify-between text-sm text-gray-400 mb-1"><span>{milk.name}</span><span>+$1.00</span></div>}
                  {addons.map(a => <div key={a} className="flex justify-between text-sm text-gray-400 mb-1"><span>{a}</span><span>+$1.00</span></div>)}
                  {isPremium && <div className="flex justify-between text-sm text-gray-400 mb-1"><span>✨ Premium</span><span>+$2.00</span></div>}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 mt-2" style={{borderTop:'1px solid #2a2d35'}}><span>Total today</span><span>${calcTotal().toFixed(2)}</span></div>
                </div>

                <button onClick={placeOrder} className="w-full font-semibold py-3 rounded-xl text-sm text-white transition-colors" style={{background:'#3b82f6'}}>
                  Place Order →
                </button>
              </div>
            </div>
          )}

          {/* ORDER HISTORY */}
          {panel === 'history' && (
            <div>
              <h2 className="text-base font-bold text-white mb-4" style={{fontFamily:'Georgia,serif'}}>Order History</h2>
              {orders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
              <div className="flex flex-col gap-2">
                {orders.slice(0,10).map(o => (
                  <div key={o.id} className="rounded-xl p-3 flex justify-between items-center" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                    <div>
                      <p className="text-sm font-semibold text-white">{DRINKS.find(d=>d.name===o.drink)?.emoji} {o.drink}</p>
                      <p className="text-xs text-gray-500">{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}{o.is_premium ? ' · ✨ Premium' : ''}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${Number(o.total_addons).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400'}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {panel === 'account' && (
            <div>
              <h2 className="text-base font-bold text-white mb-4" style={{fontFamily:'Georgia,serif'}}>My Details</h2>
              <div className="rounded-xl p-4 max-w-md" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">First Name</label>
                    <input value={accountForm.first_name} onChange={e => setAccountForm({...accountForm, first_name: e.target.value})} className={inp} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Name</label>
                    <input value={accountForm.last_name} onChange={e => setAccountForm({...accountForm, last_name: e.target.value})} className={inp} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                  <input value={session.user.email} disabled className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
                  <input value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})} className={inp} placeholder="(818) 555-0000" />
                </div>
                <button onClick={saveAccount} disabled={saving}
                  className="font-semibold px-6 py-2 rounded-lg text-sm text-white transition-colors" style={{background:'#3b82f6'}}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {panel === 'billing' && (
            <div>
              <h2 className="text-base font-bold text-white mb-4" style={{fontFamily:'Georgia,serif'}}>Billing</h2>
              <div className="rounded-xl p-4 max-w-md mb-4" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subscription</p>
                {billingLoading ? (
                  <p className="text-sm text-gray-500">Loading billing info...</p>
                ) : billing?.subscription ? (
                  <div className="rounded-xl p-3 flex justify-between items-center mb-4" style={{background:'#111318', border:'1px solid #2a2d35'}}>
                    <div>
                      <p className="text-sm font-semibold text-white">Cloud Castle Monthly</p>
                      <p className="text-xs text-gray-500">$30.00 / month · Renews {new Date(billing.subscription.current_period_end * 1000).toLocaleDateString()}</p>
                      {billing.subscription.cancel_at_period_end && <p className="text-xs text-red-400 mt-1">Cancels at end of billing period</p>}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-900 text-green-400">{billing.subscription.status}</span>
                  </div>
                ) : (
                  <div className="rounded-xl p-3 mb-4" style={{background:'#111318', border:'1px solid #2a2d35'}}>
                    <p className="text-sm text-gray-500">No active subscription found.</p>
                  </div>
                )}

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment History</p>
                {billingLoading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : billing?.invoices?.length === 0 ? (
                  <p className="text-sm text-gray-500">No payments yet.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {billing?.invoices?.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center py-2" style={{borderBottom:'1px solid #2a2d35'}}>
                        <div>
                          <p className="text-sm font-semibold text-white">${(inv.amount / 100).toFixed(2)}</p>
                          <p className="text-xs text-gray-600">{new Date(inv.date * 1000).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${inv.status === 'paid' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400'}`}>{inv.status}</span>
                          {inv.pdf && (
                            <a href={inv.pdf} target="_blank" rel="noreferrer"
                              className="text-xs text-blue-400 border border-gray-700 rounded-lg px-2 py-0.5 hover:border-blue-500 transition-colors">PDF</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MESSAGE */}
          {panel === 'message' && (
            <div>
              <h2 className="text-base font-bold text-white mb-4" style={{fontFamily:'Georgia,serif'}}>Message the Team</h2>
              <div className="rounded-xl p-4 max-w-md" style={{background:'#1a1d24', border:'1px solid #2a2d35'}}>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject</label>
                  <input value={msgForm.subject} onChange={e => setMsgForm({...msgForm, subject: e.target.value})} className={inp} placeholder="e.g. Question about my order" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message</label>
                  <textarea value={msgForm.body} onChange={e => setMsgForm({...msgForm, body: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none h-24 placeholder-gray-500"
                    placeholder="Tell us what's on your mind..." />
                </div>
                <button onClick={sendMessage}
                  className="font-semibold px-6 py-2 rounded-lg text-sm text-white transition-colors" style={{background:'#3b82f6'}}>
                  Send Message
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg z-50 text-white" style={{background:'#3b82f6'}}>
          {toast}
        </div>
      )}
    </div>
  )
}