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

  const inputStyle = {
    background: '#161b22',
    border: '1px solid #2a2d35',
    borderRadius: '14px',
    padding: '16px',
    color: 'white',
    fontSize: '16px',
    width: '100%',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box',
  }

  return (
    <div style={{minHeight:'100vh', background:'#0d1117', display:'flex', flexDirection:'column'}}>
      {/* Hero top */}
      <div style={{background:'linear-gradient(160deg,#0f1923,#0d2137)', padding:'40px 24px 32px', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(59,130,246,0.08)'}}></div>
        <div style={{fontSize:'40px', marginBottom:'10px'}}>☁</div>
        <h1 style={{fontFamily:'Georgia,serif', fontSize:'28px', fontWeight:'700', color:'white', margin:'0 0 6px'}}>Cloud Castle</h1>
        <p style={{color:'#3b82f6', fontSize:'14px', fontWeight:'600', margin:'0 0 16px', letterSpacing:'0.05em'}}>COFFEE CLUB</p>
        <div style={{display:'flex', justifyContent:'center', gap:'16px'}}>
          {['☕ One drink/month', '✨ Easy add-ons', '❌ Cancel anytime'].map(b => (
            <span key={b} style={{color:'#6b7280', fontSize:'11px'}}>{b}</span>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{flex:1, padding:'28px 24px 40px', maxWidth:'480px', width:'100%', margin:'0 auto'}}>
        <h2 style={{fontFamily:'Georgia,serif', fontSize:'26px', fontWeight:'700', color:'white', margin:'0 0 6px'}}>Join the club</h2>
        <p style={{color:'#6b7280', fontSize:'14px', margin:'0 0 24px'}}>$30/month · Your first coffee awaits</p>

        <form onSubmit={handleSignup} style={{display:'flex', flexDirection:'column', gap:'14px'}}>
          <div style={{display:'flex', gap:'12px'}}>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>First Name</label>
              <input name="first_name" required value={form.first_name} onChange={handle}
                style={inputStyle} placeholder="Jordan"
                onFocus={e => e.target.style.borderColor='#3b82f6'}
                onBlur={e => e.target.style.borderColor='#2a2d35'} />
            </div>
            <div style={{flex:1}}>
              <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Last Name</label>
              <input name="last_name" required value={form.last_name} onChange={handle}
                style={inputStyle} placeholder="Mitchell"
                onFocus={e => e.target.style.borderColor='#3b82f6'}
                onBlur={e => e.target.style.borderColor='#2a2d35'} />
            </div>
          </div>
          <div>
            <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handle}
              style={inputStyle} placeholder="you@email.com"
              onFocus={e => e.target.style.borderColor='#3b82f6'}
              onBlur={e => e.target.style.borderColor='#2a2d35'} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Password</label>
            <input name="password" type="password" required minLength={6} value={form.password} onChange={handle}
              style={inputStyle} placeholder="Min. 6 characters"
              onFocus={e => e.target.style.borderColor='#3b82f6'}
              onBlur={e => e.target.style.borderColor='#2a2d35'} />
          </div>

          {error && (
            <div style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', padding:'14px', color:'#f87171', fontSize:'14px'}}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{background:'#3b82f6', color:'white', border:'none', borderRadius:'14px', padding:'18px', fontSize:'16px', fontWeight:'700', fontFamily:'DM Sans,sans-serif', cursor:'pointer', marginTop:'8px'}}>
            {loading ? 'Setting up your account...' : 'Join & Set Up Billing →'}
          </button>
          <p style={{color:'#4b5563', fontSize:'12px', textAlign:'center', margin:'0'}}>
            🔒 Redirected to Stripe for secure payment
          </p>
        </form>

        <div style={{borderTop:'1px solid #2a2d35', marginTop:'28px', paddingTop:'24px', textAlign:'center'}}>
          <p style={{color:'#6b7280', fontSize:'14px'}}>
            Already a member?{' '}
            <Link to="/login" style={{color:'#3b82f6', fontWeight:'600', textDecoration:'none'}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}