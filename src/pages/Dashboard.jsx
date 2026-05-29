import { useAuth } from '../context/AuthContext'
import { Fish, LogOut } from 'lucide-react'

export default function Dashboard() {
  const { profile, logout } = useAuth()

  return (
    <div className="min-h-screen bg-ocean-950 p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean-500/20 border border-ocean-500/40 rounded-xl flex items-center justify-center">
              <Fish className="w-5 h-5 text-ocean-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">AquaFlow</h1>
              <p className="text-ocean-500 text-xs odia">ମାଛ ବ୍ୟବସାୟ ପ୍ରଣାଳୀ</p>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary flex items-center gap-2 text-sm">
            <LogOut className="w-4 h-4" />
            <span className="odia">ଲଗଆଉଟ</span>
          </button>
        </div>

        <div className="card p-8 text-center animate-fadeup">
          <div className="w-20 h-20 bg-ocean-500/20 border border-ocean-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Fish className="w-10 h-10 text-ocean-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            <span className="odia">ସ୍ୱାଗତ!</span> Welcome!
          </h2>
          <p className="text-ocean-400 text-lg font-medium">
            {profile?.dealers?.name || 'Your Business'}
          </p>
          <p className="text-ocean-500 mt-1">
            {profile?.full_name} — <span className="capitalize">{profile?.role}</span>
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-tide-900/30 border border-tide-700/40 rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-tide-400 rounded-full animate-pulse" />
            <span className="text-tide-400 text-sm">
              <span className="odia">ସିଷ୍ଟମ ଚାଲୁ ଅଛି</span> — System is Live
            </span>
          </div>
          <p className="text-ocean-600 text-sm mt-4">Dashboard modules coming soon...</p>
        </div>

      </div>
    </div>
  )
}
