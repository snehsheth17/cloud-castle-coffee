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
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">☁</div>
          <h1 className="text-2xl font-bold text-amber-900" style={{fontFamily:'Georgia,serif'}}>Cloud Castle Coffee Club</h1>
          <p className="text-amber-700 text-sm mt-1">Welcome back, member</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-900 text-amber-300 font-semibold py-2.5 rounded-lg text-sm hover:bg-amber-800 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-amber-700 mt-6">
          Not a member yet? <Link to="/signup" className="font-semibold text-amber-900 underline">Join the club</Link>
        </p>
      </div>
    </div>
  )
}