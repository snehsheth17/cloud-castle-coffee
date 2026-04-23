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

    // 1. Create Supabase account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.first_name, last_name: form.last_name } }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Create Stripe checkout session
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          userId: data.user.id,
        }),
      })
      const { url, error: stripeError } = await res.json()
      if (stripeError) throw new Error(stripeError)

      // 3. Redirect to Stripe checkout
      window.location.href = url
    } catch (err) {
      setError('Account created but billing setup failed. Please contact support.')
      setLoading(false)
    }
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

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            <p className="font-semibold mb-1">☕ What you get:</p>
            <p>· One coffee or tea of your choice per month</p>
            <p>· Add-ons available for $1–$2 each</p>
            <p>· Order ahead up to a day in advance</p>
            <p>· Cancel anytime</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-amber-900 text-amber-300 font-semibold py-2.5 rounded-lg text-sm hover:bg-amber-800 transition-colors">
            {loading ? 'Setting up your account...' : 'Join & Set Up Billing →'}
          </button>
          <p className="text-xs text-center text-amber-500">You'll be redirected to Stripe to securely enter your card.</p>
        </form>
        <p className="text-center text-sm text-amber-700 mt-6">
          Already a member? <Link to="/login" className="font-semibold text-amber-900 underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}