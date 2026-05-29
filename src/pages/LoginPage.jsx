import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Waves, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ocean-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-700/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md animate-fadeup relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">NestNet</h1>
          <p className="text-ocean-400 text-sm mt-1">Smart Business. Simple Management.</p>
          <p className="odia text-ocean-500 text-sm">ଚିଙ୍ଗୁଡ଼ି ଓ ମାଛ ବ୍ୟବସାୟ ପ୍ରଣାଳୀ</p>
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              <span className="odia">ଲଗଇନ</span>
              <span className="text-ocean-400 text-base font-normal ml-2">/ Login</span>
            </h2>
            <p className="text-ocean-500 text-sm mt-1 odia">ଆପଣଙ୍କ ଖାତାରେ ପ୍ରବେଶ କରନ୍ତୁ</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-800/60 rounded-xl p-4 mb-5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">
                <span className="odia">ଇମେଲ</span> / Email
              </label>
              <input type="email" className="input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="label">
                <span className="odia">ପାସୱାର୍ଡ</span> / Password
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-12"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-500 hover:text-ocean-300 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="odia">ଲଗଇନ ହେଉଛି...</span></>
              ) : (
                <span><span className="odia">ଲଗଇନ</span> / Login</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-ocean-800 text-center">
            <p className="text-ocean-500 text-sm">
              <span className="odia">ନୂଆ ବ୍ୟବସାୟ?</span> New business?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                <span className="odia">ଏଠାରେ ନାମ ପଞ୍ଜୀକୃତ କରନ୍ତୁ</span> / Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-ocean-700 text-xs mt-6">
          NestNet © 2026 · Odisha Shrimp & Fish Business OS
        </p>
      </div>
    </div>
  )
}
