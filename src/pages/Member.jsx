export default function Member({ session }) {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">☕</div>
        <h1 className="text-2xl font-bold text-amber-900">Welcome back!</h1>
        <p className="text-amber-700 mt-2">{session.user.email}</p>
        <p className="text-amber-500 text-sm mt-4">Member dashboard coming next...</p>
      </div>
    </div>
  )
}