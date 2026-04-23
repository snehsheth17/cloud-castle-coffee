import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/member')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{background:'#0d1117'}}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-1/2 relative overflow-hidden" style={{background:'linear-gradient(145deg,#0f1923,#0d2137,#0a1628)'}}>
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.12) 0%, transparent 70%)'}}></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full" style={{background:'rgba(59,130,246,0.06)'}}></div>
        <div className="absolute top-20 right-10 w-48 h-48 rounded-full" style={{background:'rgba(59,130,246,0.04)'}}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☁</span>
            <span className="text-white font-bold text-xl tracking-tight" style={{fontFamily:'Georgia,serif'}}>Cloud Castle</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{fontFamily:'Georgia,serif'}}>
            Your daily<br/>
            coffee,<br/>
            <span className="text-blue-400">elevated.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            One membership. One perfect drink. Crafted for you, every single morning.
          </p>
          <div className="flex gap-6 mt-10">
            {[{value:'$30',label:'per month'},{value:'6+',label:'drink choices'},{value:'∞',label:'add-ons'}].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-blue-400" style={{fontFamily:'Georgia,serif'}}>{s.value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-600 text-sm">© 2025 Cloud Castle Coffee Club</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-4xl">☁</span>
            <h1 className="text-2xl font-bold text-white mt-2" style={{fontFamily:'Georgia,serif'}}>Cloud Castle <span className="text-blue-400">Coffee Club</span></h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2" style={{fontFamily:'Georgia,serif'}}>Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your membership</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder-gray-600"
                style={{background:'#161b22', border:'1px solid #2a2d35'}}
                onFocus={e => e.target.style.borderColor='#3b82f6'}
                onBlur={e => e.target.style.borderColor='#2a2d35'}
                placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder-gray-600"
                style={{background:'#161b22', border:'1px solid #2a2d35'}}
                onFocus={e => e.target.style.borderColor='#3b82f6'}
                onBlur={e => e.target.style.borderColor='#2a2d35'}
                placeholder="••••••••" />
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)'}}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full font-semibold py-3 rounded-xl text-sm text-white transition-all"
              style={{background:'#3b82f6', fontSize:'15px'}}
              onMouseEnter={e => e.target.style.background='#2563eb'}
              onMouseLeave={e => e.target.style.background='#3b82f6'}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="mt-8 pt-8" style={{borderTop:'1px solid #2a2d35'}}>
            <p className="text-center text-sm text-gray-500">
              Not a member yet?{' '}
              <Link to="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Join the club
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}