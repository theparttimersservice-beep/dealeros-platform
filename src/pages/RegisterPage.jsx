import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Waves, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    fullName: '', businessName: '', phone: '',
    city: '', state: 'Odisha', email: '', password: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-ocean-950 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center animate-fadeup">
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 odia">ନଥିଭୁକ୍ତ ସଫଳ ହୋଇଛି!</h2>
        <p className="text-ocean-400 mb-1">Registration Successful!</p>
        <p className="text-ocean-500 text-sm mb-6">ଆପଣଙ୍କ ଇମେଲ ଯାଞ୍ଚ କରନ୍ତୁ — Please check your email to confirm your account.</p>
        <Link to="/login" className="btn-primary inline-block">
          <span className="odia">ଲଗଇନ ପୃଷ୍ଠାକୁ ଯାଆନ୍ତୁ</span> / Go to Login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ocean-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-700/15 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-lg animate-fadeup relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NestNet</h1>
          <p className="text-ocean-400 text-sm mt-1">Smart Business. Simple Management.</p>
          <p className="odia text-ocean-500 text-sm">ନୂଆ ବ୍ୟବସାୟ ନଥିଭୁକ୍ତ</p>
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              <span className="odia">ନଥିଭୁକ୍ତ</span>
              <span className="text-ocean-400 text-base font-normal ml-2">/ Register</span>
            </h2>
            <p className="text-ocean-500 text-sm mt-1 odia">ଆପଣଙ୍କ ବ୍ୟବସାୟ ବିବରଣ ଦିଅନ୍ତୁ</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-800/60 rounded-xl p-4 mb-5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label"><span className="odia">ବ୍ୟବସାୟ ନାମ</span> / Business Name *</label>
              <input name="businessName" className="input"
                placeholder="e.g. Maa Mangala Fish Center"
                value={form.businessName} onChange={handleChange} required />
            </div>

            <div>
              <label className="label"><span className="odia">ମାଲିକ ନାମ</span> / Owner Name *</label>
              <input name="fullName" className="input"
                placeholder="Your full name"
                value={form.fullName} onChange={handleChange} required />
            </div>

            <div>
              <label className="label"><span className="odia">ଫୋନ</span> / Phone *</label>
              <input name="phone" className="input" placeholder="9876543210"
                type="tel" value={form.phone} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label"><span className="odia">ସହର/ଗ୍ରାମ</span> / City</label>
                <input name="city" className="input" placeholder="e.g. Rajkanika"
                  value={form.city} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="odia">ରାଜ୍ୟ</span> / State</label>
                <input name="state" className="input" placeholder="Odisha"
                  value={form.state} onChange={handleChange} />
              </div>
            </div>

            <div className="border-t border-ocean-800 pt-4">
              <p className="text-ocean-500 text-xs mb-3 odia">ଲଗଇନ ବିବରଣ / Login Details</p>
              <div className="mb-4">
                <label className="label"><span className="odia">ଇମେଲ</span> / Email *</label>
                <input name="email" type="email" className="input"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="label"><span className="odia">ପାସୱାର୍ଡ</span> / Password *</label>
                <div className="relative">
                  <input name="password" type={showPass ? 'text' : 'password'}
                    className="input pr-12" placeholder="Min 6 characters"
                    value={form.password} onChange={handleChange} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-500 hover:text-ocean-300 transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 mt-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="odia">ନଥିଭୁକ୍ତ ହେଉଛି...</span></>
              ) : (
                <span><span className="odia">ନଥିଭୁକ୍ତ</span> / Register</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-ocean-800 text-center">
            <p className="text-ocean-500 text-sm">
              <span className="odia">ଖାତା ଅଛି?</span> Already have account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                <span className="odia">ଲଗଇନ</span> / Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
