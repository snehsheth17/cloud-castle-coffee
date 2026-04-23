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

  // Order builder state
  const [drink, setDrink] = useState('Latte')
  const [milk, setMilk] = useState(MILKS[0])
  const [addons, setAddons] = useState([])
  const [isPremium, setIsPremium] = useState(false)
  const [scheduleType, setScheduleType] = useState('asap')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('08:00')

  // Account state
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (data) {
      setProfile(data)
      setAccountForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '' })
    }
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('member_id', session.user.id)
      .order('created_at', { ascending: false })
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
  } catch (err) {
    console.error('Billing fetch error:', err)
  }
  setBillingLoading(false)
}

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleAddon(name) {
    setAddons(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name])
  }

  function calcTotal() {
    return milk.price + addons.length + (isPremium ? 2 : 0)
  }

  async function placeOrder() {
  const scheduledFor = scheduleType === 'schedule' && schedDate
    ? new Date(`${schedDate}T${schedTime}`).toISOString()
    : new Date().toISOString()

  const { error } = await supabase.from('orders').insert({
    member_id: session.user.id,
    drink,
    milk: milk.name,
    addons,
    is_premium: isPremium,
    total_addons: calcTotal(),
    status: 'pending',
    scheduled_for: scheduledFor,
  })
  if (error) showToast('Error placing order.')
  else {
    showToast('Order placed! ☕')
    fetchOrders()
    // Reset form
    setDrink('Latte')
    setMilk(MILKS[0])
    setAddons([])
    setIsPremium(false)
    setScheduleType('asap')
    setSchedDate('')
    setSchedTime('08:00')
    setPanel('card')
  }
}

  async function saveAccount() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update(accountForm)
      .eq('id', session.user.id)
    if (error) showToast('Error saving.')
    else { showToast('Details saved!'); fetchProfile() }
    setSaving(false)
  }

  async function sendMessage() {
    const { error } = await supabase.from('messages').insert({
      member_id: session.user.id,
      subject: msgForm.subject,
      body: msgForm.body,
    })
    if (error) showToast('Error sending.')
    else { showToast('Message sent! ☕'); setMsgForm({ subject: '', body: '' }) }
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

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

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 bg-amber-950 flex-shrink-0">
        <span className="text-amber-400 font-bold text-lg" style={{fontFamily:'Georgia,serif'}}>☁ Cloud Castle <span className="text-amber-100 font-normal text-sm">Coffee Club</span></span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-bold text-xs">{initials}</div>
          <button onClick={signOut} className="text-amber-400 text-xs hover:text-amber-200">Sign out</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-amber-50 border-r border-amber-100 flex flex-col py-4 gap-1 flex-shrink-0">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest px-4 pb-1">My Club</p>
          {navItems.slice(0,3).map(item => (
            <button key={item.id} onClick={() => setPanel(item.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-all ${panel === item.id ? 'bg-amber-100 text-amber-950 font-semibold border-r-2 border-amber-400' : 'text-amber-700 hover:bg-amber-100'}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest px-4 pb-1 mt-4">Account</p>
          {navItems.slice(3).map(item => (
  <button key={item.id} onClick={() => { setPanel(item.id); if(item.id === 'billing') fetchBilling() }}
    className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-all ${panel === item.id ? 'bg-amber-100 text-amber-950 font-semibold border-r-2 border-amber-400' : 'text-amber-700 hover:bg-amber-100'}`}>
    <span>{item.icon}</span>{item.label}
  </button>
))}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* MY CARD */}
          {panel === 'card' && (
            <div>
              <div className="rounded-2xl p-6 mb-6 max-w-sm relative overflow-hidden" style={{background:'linear-gradient(135deg,#1c0a03,#6B3A2A,#C4855A)'}}>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-400 opacity-10"></div>
                <p className="text-amber-400 text-xs font-semibold tracking-widest mb-4" style={{fontFamily:'Georgia,serif'}}>☁ CLOUD CASTLE COFFEE CLUB</p>
                <p className="text-white text-xl font-bold mb-1" style={{fontFamily:'Georgia,serif'}}>{fullName || 'Member'}</p>
                <div className="inline-flex items-center gap-1 bg-amber-400 bg-opacity-20 border border-amber-400 rounded-full px-3 py-1 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {profile?.status || 'Active'} Member
                </div>
                <div className="flex justify-between items-end">
                  <div><p className="text-white text-opacity-50 text-xs uppercase tracking-wide" style={{color:'rgba(255,255,255,0.5)'}}>Member Since</p><p className="text-white text-sm font-medium">{joinDate}</p></div>
                  <div><p className="text-white text-opacity-50 text-xs uppercase tracking-wide" style={{color:'rgba(255,255,255,0.5)'}}>Plan</p><p className="text-white text-sm font-medium">$30 / mo</p></div>
                  <div className="bg-amber-400 text-amber-950 rounded-full px-3 py-1 text-xs font-bold">{orders.length} Orders</div>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <div className="flex-1 bg-white rounded-xl border border-amber-100 p-3">
                  <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">This Month</p>
                  <p className="text-2xl font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>{thisMonth}</p>
                  <p className="text-xs text-amber-500">orders placed</p>
                </div>
                <div className="flex-1 bg-white rounded-xl border border-amber-100 p-3">
                  <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Add-on Spend</p>
                  <p className="text-2xl font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>${totalSpend}</p>
                  <p className="text-xs text-amber-500">total upgrades</p>
                </div>
                <div className="flex-1 bg-white rounded-xl border border-amber-100 p-3">
                  <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Next Billing</p>
                  <p className="text-2xl font-bold text-amber-950" style={{fontFamily:'Georgia,serif'}}>May 14</p>
                  <p className="text-xs text-amber-500">$30.00</p>
                </div>
              </div>

              <h2 className="text-base font-bold text-amber-950 mb-3" style={{fontFamily:'Georgia,serif'}}>Recent Activity</h2>
              {orders.slice(0,10).length === 0 && <p className="text-sm text-amber-500">No orders yet — place your first one!</p>}
              <div className="flex flex-col gap-2">
                {orders.slice(0,10).map(o => (
                  <div key={o.id} className="bg-white rounded-xl border border-amber-100 p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-amber-950">{DRINKS.find(d=>d.name===o.drink)?.emoji} {o.drink}</p>
                      <p className="text-xs text-amber-500">{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}</p>
                      <p className="text-xs text-amber-400 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-950">${Number(o.total_addons).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDER NOW */}
          {panel === 'order' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Build Your Drink</h2>
              <div className="bg-white rounded-xl border border-amber-100 p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">Choose Your Drink</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {DRINKS.map(d => (
                    <button key={d.name} onClick={() => setDrink(d.name)}
                      className={`border rounded-xl p-3 text-center transition-all ${drink === d.name ? 'border-amber-400 bg-amber-50' : 'border-amber-100 hover:border-amber-300'}`}>
                      <div className="text-2xl mb-1">{d.emoji}</div>
                      <div className="text-xs font-semibold text-amber-950">{d.name}</div>
                      <div className="text-xs text-amber-400">{d.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Premium toggle */}
                <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">✨ Premium Upgrade</p>
                    <p className="text-xs text-amber-500">Specialty syrups, artisan toppings — +$2</p>
                  </div>
                  <button onClick={() => setIsPremium(!isPremium)}
                    className={`w-10 h-6 rounded-full transition-all relative ${isPremium ? 'bg-purple-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isPremium ? 'left-4' : 'left-0.5'}`}></span>
                  </button>
                </div>

                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Flavors</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {FLAVORS.map(f => (
                    <button key={f} onClick={() => toggleAddon(f)}
                      className={`border rounded-full px-3 py-1 text-xs transition-all ${addons.includes(f) ? 'bg-amber-950 text-amber-300 border-amber-950' : 'border-amber-200 text-amber-600 hover:border-amber-400'}`}>
                      {f} <span className="opacity-60">+$1</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Milk Type</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {MILKS.map(m => (
                    <button key={m.name} onClick={() => setMilk(m)}
                      className={`border rounded-full px-3 py-1 text-xs transition-all ${milk.name === m.name ? 'bg-amber-950 text-amber-300 border-amber-950' : 'border-amber-200 text-amber-600 hover:border-amber-400'}`}>
                      {m.name} {m.price > 0 && <span className="opacity-60">+$1</span>}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Toppings & Extras</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {EXTRAS.map(e => (
                    <button key={e} onClick={() => toggleAddon(e)}
                      className={`border rounded-full px-3 py-1 text-xs transition-all ${addons.includes(e) ? 'bg-amber-950 text-amber-300 border-amber-950' : 'border-amber-200 text-amber-600 hover:border-amber-400'}`}>
                      {e} <span className="opacity-60">+$1</span>
                    </button>
                  ))}
                </div>

                <hr className="border-amber-100 my-4" />
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Pickup Timing</p>
                <div className="flex gap-2 mb-4 flex-wrap items-center">
                  <button onClick={() => setScheduleType('asap')}
                    className={`border rounded-full px-3 py-1 text-xs transition-all ${scheduleType === 'asap' ? 'bg-amber-950 text-amber-300 border-amber-950' : 'border-amber-200 text-amber-600'}`}>ASAP</button>
                  <button onClick={() => setScheduleType('schedule')}
                    className={`border rounded-full px-3 py-1 text-xs transition-all ${scheduleType === 'schedule' ? 'bg-amber-950 text-amber-300 border-amber-950' : 'border-amber-200 text-amber-600'}`}>Schedule</button>
                  {scheduleType === 'schedule' && <>
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="border border-amber-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-400" />
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="border border-amber-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-400" />
                  </>}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-sm text-amber-600 mb-1"><span>☕ {drink}</span><span>Included</span></div>
                  {milk.price > 0 && <div className="flex justify-between text-sm text-amber-600 mb-1"><span>{milk.name}</span><span>+$1.00</span></div>}
                  {addons.map(a => <div key={a} className="flex justify-between text-sm text-amber-600 mb-1"><span>{a}</span><span>+$1.00</span></div>)}
                  {isPremium && <div className="flex justify-between text-sm text-amber-600 mb-1"><span>✨ Premium</span><span>+$2.00</span></div>}
                  <div className="flex justify-between text-sm font-bold text-amber-950 border-t border-amber-200 pt-2 mt-2"><span>Total today</span><span>${calcTotal().toFixed(2)}</span></div>
                </div>

                <button onClick={placeOrder} className="w-full bg-amber-950 text-amber-300 font-semibold py-3 rounded-xl text-sm hover:bg-amber-800 transition-colors">
                  Place Order →
                </button>
              </div>
            </div>
          )}

          {/* ORDER HISTORY */}
          {panel === 'history' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Order History</h2>
              {orders.length === 0 && <p className="text-sm text-amber-500">No orders yet.</p>}
              <div className="flex flex-col gap-2">
                {orders.slice(0, 10).map(o => (
                  <div key={o.id} className="bg-white rounded-xl border border-amber-100 p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-amber-950">{DRINKS.find(d=>d.name===o.drink)?.emoji} {o.drink}</p>
                      <p className="text-xs text-amber-500">{o.milk}{o.addons?.length ? ' · ' + o.addons.join(', ') : ''}{o.is_premium ? ' · ✨ Premium' : ''}</p>
                      <p className="text-xs text-amber-400 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-950">${Number(o.total_addons).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {panel === 'account' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>My Details</h2>
              <div className="bg-white rounded-xl border border-amber-100 p-4 max-w-md">
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">First Name</label>
                    <input value={accountForm.first_name} onChange={e => setAccountForm({...accountForm, first_name: e.target.value})}
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Last Name</label>
                    <input value={accountForm.last_name} onChange={e => setAccountForm({...accountForm, last_name: e.target.value})}
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Email</label>
                  <input value={session.user.email} disabled className="w-full border border-amber-100 rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-400" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Phone</label>
                  <input value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                    placeholder="(818) 555-0000" />
                </div>
                <button onClick={saveAccount} disabled={saving}
                  className="bg-amber-950 text-amber-300 font-semibold px-6 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {panel === 'billing' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Billing</h2>
              <div className="bg-white rounded-xl border border-amber-100 p-4 max-w-md">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Subscription</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm font-semibold text-amber-950">Cloud Castle Monthly</p>
                    <p className="text-xs text-amber-500">$30.00 / month</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Card on File</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="text-sm font-medium text-amber-950">•••• •••• •••• 4291</p>
                      <p className="text-xs text-amber-500">Visa · Exp 09/27</p>
                    </div>
                  </div>
                  <button className="text-xs text-amber-700 border border-amber-200 rounded-lg px-3 py-1 hover:border-amber-400">Update</button>
                </div>
                <p className="text-xs text-amber-400 mt-4">Stripe billing portal coming in Phase 2.</p>
              </div>
            </div>
          )}

          {/* MESSAGE */}
          {panel === 'message' && (
            <div>
              <h2 className="text-base font-bold text-amber-950 mb-4" style={{fontFamily:'Georgia,serif'}}>Message the Team</h2>
              <div className="bg-white rounded-xl border border-amber-100 p-4 max-w-md">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Subject</label>
                  <input value={msgForm.subject} onChange={e => setMsgForm({...msgForm, subject: e.target.value})}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                    placeholder="e.g. Question about my order" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Message</label>
                  <textarea value={msgForm.body} onChange={e => setMsgForm({...msgForm, body: e.target.value})}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none h-24"
                    placeholder="Tell us what's on your mind..." />
                </div>
                <button onClick={sendMessage}
                  className="bg-amber-950 text-amber-300 font-semibold px-6 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">
                  Send Message
                </button>
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