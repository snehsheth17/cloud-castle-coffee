import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Member from './pages/Member'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <p className="text-amber-900 font-semibold">Loading...</p>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/member" />} />
      <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/member" />} />
      <Route path="/member/*" element={session ? <Member session={session} /> : <Navigate to="/login" />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to={session ? "/member" : "/login"} />} />
    </Routes>
  )
}