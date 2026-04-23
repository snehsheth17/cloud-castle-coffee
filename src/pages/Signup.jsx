import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handle(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.first_name, last_name: form.last_name } }
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, userId: data.user.id }),
      })
      const { url, error: stripeError } = await res.json()
      if (stripeError) throw new Error(stripeError)
      window.location.href = url
    } catch (err) {
      setError('Account created but billing setup failed. Please contact support.')
      setLoading(false)
    }
  }

  const inp = {
    className: "w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder-gray-600",
    style: {background:'#161b22', border:'1px solid #2a2d35'},
    onFocus: e => e.target.style.borderColor='#3b82f6',
    onBlur: e => e.target.style.borderColor='#2a2d35',
  }

  return (
    <div className="min-h-screen flex" style={{background:'#0d1117'}}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-1/2 relative overflow-hidden" style={{background:'linear-gradient(145deg,#0f1923,#0d2137,#0a1628)'}}>
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.12) 0%, transparent 70%)'}}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☁</span>
            <span className="text-white font-bold text-xl tracking-tight" style={{fontFamily:'Georgia,serif'}}>Cloud Castle</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{fontFamily:'Georgia,serif'}}>
            Start your<br/>
            coffee<br/>
            <span className="text-blue-400">journey.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm mb-8">
            Join a community of coffee lovers who believe mornings should be something to look forward to.
          </p>
          <div className="space-y-3">
            {[
              '☕ One coffee or tea of your choice per month',
              '✨ Premium upgrades available for $1–$2',
              '📅 Order ahead up to a day in advance',
              '❌ Cancel anytime, no questions asked',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <p className="text-gray-300 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-600 text-sm">© 2025 Cloud Castle Coffee Club</p>
        </div>
      </div>

      {/* Right signup panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <span className="text-4xl">☁</span>
            <h1 className="text-2xl font-bold text-white mt-2" style={{fontFamily:'Georgia,serif'}}>Cloud Castle <span className="text-blue-400">Coffee Club</span></h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2" style={{fontFamily:'Georgia,serif'}}>Join the club</h2>
          <p className="text-gray-500 mb-8">$30/month · Cancel anytime</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">First Name</label>
                <input name="first_name" required value={form.first_name} onChange={handle} {...inp} placeholder="Jordan" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Last Name</label>
                <input name="last_name" required value={form.last_name} onChange={handle} {...inp} placeholder="Mitchell" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handle} {...inp} placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <input name="password" type="password" required minLength={6} value={form.password} onChange={handle} {...inp} placeholder="Min. 6 characters" />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)'}}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full font-semibold py-3 rounded-xl text-white transition-all mt-2"
              style={{background:'#3b82f6', fontSize:'15px'}}
              onMouseEnter={e => e.target.style.background='#2563eb'}
              onMouseLeave={e => e.target.style.background='#3b82f6'}>
              {loading ? 'Setting up your account...' : 'Join & Set Up Billing →'}
            </button>
            <p className="text-xs text-center text-gray-600">You'll be redirected to Stripe to securely enter your card.</p>
          </form>

          <div className="mt-8 pt-8" style={{borderTop:'1px solid #2a2d35'}}>
            <p className="text-center text-sm text-gray-500">
              Already a member?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}