import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Fish, LogOut, LayoutDashboard, Users, BookOpen,
  Package, Truck, TrendingUp, Receipt, BarChart3,
  Menu, X, ChevronRight
} from 'lucide-react'
import FarmersPage from './FarmersPage'
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', odia: 'ଡ୍ୟାସ୍‌ବୋର୍ଡ', id: 'dashboard' },
  { icon: Users, label: 'Farmers', odia: 'ମଛୁଆ', id: 'farmers' },
  { icon: BookOpen, label: 'Farmer Ledger', odia: 'ମଛୁଆ ଖାତା', id: 'ledger' },
  { icon: Package, label: 'Stock & Materials', odia: 'ସ୍ଟକ', id: 'stock' },
  { icon: Users, label: 'Vendors', odia: 'ବିକ୍ରେତା', id: 'vendors' },
  { icon: Fish, label: 'Harvest', odia: 'ଫସଲ', id: 'harvest' },
  { icon: Truck, label: 'Dispatch', odia: 'ଡ଼ିସ୍ପ୍ୟାଚ', id: 'dispatch' },
  { icon: Receipt, label: 'Expenses', odia: 'ଖର୍ଚ', id: 'expenses' },
  { icon: BarChart3, label: 'Reports', odia: 'ରିପୋର୍ଟ', id: 'reports' },
]

const stats = [
  { label: 'Total Outstanding', odia: 'ମୋଟ ବକେୟା', value: '₹0', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40' },
  { label: "Today's Harvest", odia: 'ଆଜିର ଫସଲ', value: '0 kg', color: 'text-tide-400', bg: 'bg-tide-900/20', border: 'border-tide-800/40' },
  { label: 'Pending Payments', odia: 'ବାକି ଦେୟ', value: '₹0', color: 'text-sand-400', bg: 'bg-sand-900/20', border: 'border-sand-800/40' },
  { label: 'Active Farmers', odia: 'ସକ୍ରିୟ ମଛୁଆ', value: '0', color: 'text-ocean-400', bg: 'bg-ocean-900/20', border: 'border-ocean-700/40' },
]

export default function Dashboard() {
  const { profile, logout } = useAuth()
  const [active, setActive] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-ocean-950 flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 bg-ocean-900 border-r border-ocean-800 flex flex-col shrink-0`}>
        
        {/* Logo */}
        <div className="p-5 border-b border-ocean-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ocean-500/20 border border-ocean-500/40 rounded-xl flex items-center justify-center shrink-0">
              <Fish className="w-5 h-5 text-ocean-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">AquaFlow</p>
              <p className="text-ocean-500 text-xs odia">ମାଛ ବ୍ୟବସାୟ</p>
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="px-4 py-3 border-b border-ocean-800 bg-ocean-950/30">
          <p className="text-ocean-300 text-xs font-semibold truncate">{profile?.dealers?.name || '...'}</p>
          <p className="text-ocean-500 text-xs truncate">{profile?.full_name} · <span className="capitalize">{profile?.role}</span></p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                ${active === item.id
                  ? 'bg-ocean-500/20 border border-ocean-500/40 text-ocean-300'
                  : 'text-ocean-500 hover:bg-ocean-800 hover:text-ocean-300 border border-transparent'
                }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs font-medium odia truncate">{item.odia}</p>
                <p className="text-xs opacity-60 truncate">{item.label}</p>
              </div>
              {active === item.id && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-ocean-800">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-ocean-500 hover:bg-red-900/20 hover:text-red-400 transition-all border border-transparent hover:border-red-800/40">
            <LogOut className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium odia">ଲଗଆଉଟ</p>
              <p className="text-xs opacity-60">Logout</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 border-b border-ocean-800 bg-ocean-900/50 flex items-center px-4 gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-ocean-500 hover:text-ocean-300 transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <p className="text-white font-semibold text-sm odia">
              {menuItems.find(m => m.id === active)?.odia}
            </p>
            <p className="text-ocean-500 text-xs">
              {menuItems.find(m => m.id === active)?.label}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-tide-400 rounded-full animate-pulse" />
            <span className="text-tide-400 text-xs odia">ସିଷ୍ଟମ ଚାଲୁ</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">

          {active === 'dashboard' && (
            <div className="animate-fadeup space-y-6">

              {/* Welcome */}
              <div>
                <h1 className="text-white text-xl font-bold">
                  <span className="odia">ନମସ୍କାର</span>, {profile?.full_name?.split(' ')[0] || 'Owner'} 👋
                </h1>
                <p className="text-ocean-500 text-sm mt-1">{profile?.dealers?.name}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className={`card p-4 border ${stat.border} ${stat.bg}`}>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className={`text-xs font-medium odia mt-1 ${stat.color}`}>{stat.odia}</p>
                    <p className="text-ocean-600 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div>
                <h2 className="text-ocean-300 text-sm font-semibold mb-3 odia">ଶୀଘ୍ର କାର୍ଯ୍ୟ / Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Add Farmer', odia: 'ମଛୁଆ ଯୋଗ', icon: Users, id: 'farmers' },
                    { label: 'New Ledger Entry', odia: 'ଖାତା ଏଣ୍ଟ୍ରି', icon: BookOpen, id: 'ledger' },
                    { label: 'Record Harvest', odia: 'ଫସଲ ରେକର୍ଡ', icon: Fish, id: 'harvest' },
                    { label: 'Add Expense', odia: 'ଖର୍ଚ ଯୋଗ', icon: Receipt, id: 'expenses' },
                  ].map((action, i) => (
                    <button key={i} onClick={() => setActive(action.id)}
                      className="card p-4 hover:bg-ocean-800 transition-all text-left border-ocean-700 group">
                      <action.icon className="w-6 h-6 text-ocean-400 mb-2 group-hover:text-ocean-300" />
                      <p className="text-ocean-300 text-xs font-medium odia">{action.odia}</p>
                      <p className="text-ocean-600 text-xs">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coming soon modules */}
              <div className="card p-5 border-ocean-700">
                <p className="text-ocean-400 text-sm odia mb-1">ଆସୁଥିବା ମଡ୍ୟୁଲ</p>
                <p className="text-ocean-600 text-xs">Farmer Ledger, Stock Management, Harvest Recording, Dispatch & Reports — coming next!</p>
              </div>

            </div>
          )}

          {active === 'farmers' && <FarmersPage />}

{active !== 'dashboard' && active !== 'farmers' && (
  <div className="animate-fadeup flex items-center justify-center h-64">
    <div className="text-center">
      <div className="w-16 h-16 bg-ocean-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {(() => { const item = menuItems.find(m => m.id === active); return item ? <item.icon className="w-8 h-8 text-ocean-500" /> : null })()}
      </div>
      <p className="text-ocean-300 font-medium odia">{menuItems.find(m => m.id === active)?.odia}</p>
      <p className="text-ocean-600 text-sm mt-1">{menuItems.find(m => m.id === active)?.label} — Coming soon</p>
    </div>
  </div>
)}

        </main>
      </div>
    </div>
  )
}
