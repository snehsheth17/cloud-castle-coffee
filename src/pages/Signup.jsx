import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handle(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.first_name, last_name: form.last_name } }
    })
    if (error) setError(error.message)
    else navigate('/member')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">☁</div>
          <h1 className="text-2xl font-bold text-amber-900" style={{fontFamily:'Georgia,serif'}}>Join the Club</h1>
          <p className="text-amber-700 text-sm mt-1">$30/month · One coffee · Endless mornings</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">First Name</label>
              <input name="first_name" required value={form.first_name} onChange={handle}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                placeholder="Jordan" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Last Name</label>
              <input name="last_name" required value={form.last_name} onChange={handle}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                placeholder="Mitchell" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Email</label>
            <input name="email" type="email" required value={form.email} onChange={handle}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="you@email.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Password</label>
            <input name="password" type="password" required minLength={6} value={form.password} onChange={handle}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="Min. 6 characters" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-900 text-amber-300 font-semibold py-2.5 rounded-lg text-sm hover:bg-amber-800 transition-colors">
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p className="text-center text-sm text-amber-700 mt-6">
          Already a member? <Link to="/login" className="font-semibold text-amber-900 underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}