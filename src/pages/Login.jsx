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
  }

  return (
    <div style={{minHeight:'100vh', background:'#0d1117', display:'flex', flexDirection:'column'}}>
      {/* Hero top */}
      <div style={{background:'linear-gradient(160deg,#0f1923,#0d2137)', padding:'48px 24px 40px', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(59,130,246,0.08)'}}></div>
        <div style={{position:'absolute', bottom:'-40px', left:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(59,130,246,0.06)'}}></div>
        <div style={{fontSize:'48px', marginBottom:'12px'}}>☁</div>
        <h1 style={{fontFamily:'Georgia,serif', fontSize:'32px', fontWeight:'700', color:'white', margin:'0 0 8px', lineHeight:'1.2'}}>
          Cloud Castle
        </h1>
        <p style={{color:'#3b82f6', fontSize:'16px', fontWeight:'600', margin:'0 0 12px', letterSpacing:'0.05em'}}>COFFEE CLUB</p>
        <p style={{color:'#6b7280', fontSize:'14px', margin:'0'}}>Your morning ritual, elevated</p>
      </div>

      {/* Form */}
      <div style={{flex:1, padding:'32px 24px', maxWidth:'480px', width:'100%', margin:'0 auto'}}>
        <h2 style={{fontFamily:'Georgia,serif', fontSize:'26px', fontWeight:'700', color:'white', margin:'0 0 6px'}}>Welcome back</h2>
        <p style={{color:'#6b7280', fontSize:'14px', margin:'0 0 28px'}}>Sign in to your membership</p>

        <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          <div>
            <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle} placeholder="you@email.com"
              onFocus={e => e.target.style.borderColor='#3b82f6'}
              onBlur={e => e.target.style.borderColor='#2a2d35'} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle} placeholder="••••••••"
              onFocus={e => e.target.style.borderColor='#3b82f6'}
              onBlur={e => e.target.style.borderColor='#2a2d35'} />
          </div>

          {error && (
            <div style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', padding:'14px', color:'#f87171', fontSize:'14px'}}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{background:'#3b82f6', color:'white', border:'none', borderRadius:'14px', padding:'18px', fontSize:'16px', fontWeight:'700', fontFamily:'DM Sans,sans-serif', cursor:'pointer', marginTop:'8px', letterSpacing:'0.01em'}}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{borderTop:'1px solid #2a2d35', marginTop:'32px', paddingTop:'24px', textAlign:'center'}}>
          <p style={{color:'#6b7280', fontSize:'14px'}}>
            Not a member yet?{' '}
            <Link to="/signup" style={{color:'#3b82f6', fontWeight:'600', textDecoration:'none'}}>Join the club</Link>
          </p>
        </div>

        {/* Trust badges */}
        <div style={{display:'flex', justifyContent:'center', gap:'24px', marginTop:'32px'}}>
          {['$30 / month', 'Cancel anytime', 'Secure payments'].map(b => (
            <div key={b} style={{textAlign:'center'}}>
              <p style={{color:'#4b5563', fontSize:'11px'}}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}