import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Fish, LogOut, LayoutDashboard, Users, BookOpen,
  Package, Truck, TrendingUp, Receipt, BarChart3,
  Menu, X, ChevronRight, TrendingDown, Waves
} from 'lucide-react'
import FarmersPage from './FarmersPage'
import DailyRatePage from './DailyRatePage'
import BuyersPage from './BuyersPage'
import CollectionPage from './CollectionPage'
import FarmerLedgerPage from './FarmerLedgerPage'
import CompanyLedgerPage from './CompanyLedgerPage'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        odia: 'ଆଜିର ସ୍ଥିତି', id: 'dashboard' },
  { icon: Users,           label: 'Farmers',          odia: 'ଚାଷୀ',         id: 'farmers' },
  { icon: Users,           label: 'Buyers/Clients',   odia: 'ଖରିଦାର',       id: 'buyers' },
  { icon: BookOpen,        label: 'Farmer Ledger',    odia: 'ଚାଷୀ ଖାତା',   id: 'ledger' },
  { icon: TrendingUp,      label: 'Daily Rate',       odia: 'ଆଜିର ରେଟ',    id: 'rates' },
  { icon: Truck,           label: 'Collection',       odia: 'ସଂଗ୍ରହ',       id: 'collection' },
  { icon: Package,         label: 'Stock & Materials',odia: 'ସ୍ଟକ',         id: 'stock' },
  { icon: Fish,            label: 'Harvest',          odia: 'ଫସଲ',          id: 'harvest' },
  { icon: BarChart3,       label: 'Reports',          odia: 'ରିପୋର୍ଟ',      id: 'reports' },
  { icon: Receipt,         label: 'Expenses',         odia: 'ଖର୍ଚ',         id: 'expenses' },
]

export default function Dashboard() {
  const { profile, logout } = useAuth()
  const [active, setActive] = useState('dashboard')
  const [selectedFarmerId, setSelectedFarmerId] = useState(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashStats, setDashStats] = useState({
    farmers: 0,
    buyers: 0,
    collection: 0,
    farmerOutstanding: 0,
    buyerBalance: 0,
  })

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const todayISO = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (profile) fetchStats()
  }, [profile])

  async function fetchStats() {
    try {
      const [farmersRes, buyersRes, collectionsRes, farmerLedgerRes, companyLedgerRes] = await Promise.all([

        supabase
          .from('farmers')
          .select('id', { count: 'exact' })
          .eq('dealer_id', profile?.dealer_id)
          .eq('active', true),

        supabase
          .from('buyers')
          .select('id', { count: 'exact' })
          .eq('active', true),

        supabase
          .from('collections')
          .select('quantity_kg')
          .eq('collection_date', todayISO),

        supabase
          .from('farmer_ledger')
          .select('entry_type, amount')
          .eq('dealer_id', profile?.dealer_id),

        supabase
          .from('company_ledger')
          .select('entry_type, amount'),
      ])

      const todayKg = collectionsRes.data?.reduce((s, c) => s + (c.quantity_kg || 0), 0) || 0

      const farmerCredit   = farmerLedgerRes.data?.filter(e => ['material', 'cash_advance'].includes(e.entry_type)).reduce((s, e) => s + (e.amount || 0), 0) || 0
      const farmerRecovery = farmerLedgerRes.data?.filter(e => e.entry_type === 'harvest_recovery').reduce((s, e) => s + (e.amount || 0), 0) || 0
      const farmerOutstanding = farmerCredit - farmerRecovery

      const buyerDispatch = companyLedgerRes.data?.filter(e => e.entry_type === 'dispatch').reduce((s, e) => s + (e.amount || 0), 0) || 0
      const buyerPayment  = companyLedgerRes.data?.filter(e => e.entry_type === 'payment_received').reduce((s, e) => s + (e.amount || 0), 0) || 0
      const buyerBalance  = buyerDispatch - buyerPayment

      setDashStats({
        farmers: farmersRes.count || 0,
        buyers:  buyersRes.count  || 0,
        collection: todayKg,
        farmerOutstanding,
        buyerBalance,
      })

    } catch (e) {
      console.log('Stats fetch error', e)
    }
  }

  const statsCards = [
    {
      label: 'Active Farmers', odia: 'ସକ୍ରିୟ ଚାଷୀ',
      value: dashStats.farmers,
      color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/40', icon: Users
    },
    {
      label: 'Active Buyers', odia: 'ସକ୍ରିୟ ଖରିଦାର',
      value: dashStats.buyers,
      color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-800/40', icon: Users
    },
    {
      label: "Today's Collection", odia: 'ଆଜିର ସଂଗ୍ରହ',
      value: dashStats.collection.toFixed(1) + ' kg',
      color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/40', icon: Truck
    },
    {
      label: 'Farmer Outstanding', odia: 'ଚାଷୀ ବାକି ରାଶି',
      value: '₹' + dashStats.farmerOutstanding.toLocaleString('en-IN'),
      color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', icon: TrendingDown
    },
    {
      label: 'Buyer Balance Due', odia: 'ଖରିଦାର ବାକି ରାଶି',
      value: '₹' + dashStats.buyerBalance.toLocaleString('en-IN'),
      color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-800/40', icon: TrendingUp
    },
  ]

  return (
    <div className="min-h-screen bg-ocean-950 flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 bg-ocean-900 border-r border-ocean-800 flex flex-col shrink-0`}>

        {/* Logo */}
        <div className="p-5 border-b border-ocean-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight tracking-wide">NestNet</p>
              <p className="text-ocean-400 text-xs">Smart Business. Simple Management.</p>
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="px-4 py-3 border-b border-ocean-800 bg-ocean-950/30">
          <p className="text-ocean-300 text-xs font-semibold truncate">{profile?.business_name || 'ଆପଣଙ୍କ ବ୍ୟବସାୟ'}</p>
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
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
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
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs odia">ସିଷ୍ଟମ ଚାଲୁ</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">

          {active === 'dashboard' && (
            <div className="animate-fadeup space-y-6">

              {/* Welcome */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-white text-2xl font-bold">
                    <span className="odia">ନମସ୍କାର</span>, {profile?.full_name?.split(' ')[0] || 'Owner'} 👋
                  </h1>
                  <p className="text-ocean-400 text-sm mt-1 odia">ଆଜିର ବ୍ୟବସାୟ ସ୍ଥିତି ଦେଖନ୍ତୁ</p>
                  <p className="text-ocean-600 text-xs mt-0.5">{today}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-ocean-400 text-xs odia">ଆପଣଙ୍କ ବ୍ୟବସାୟ</p>
                  <p className="text-white text-sm font-semibold">{profile?.business_name || 'NestNet'}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {statsCards.map((stat, i) => (
                  <div key={i} className={`card p-4 border ${stat.border} ${stat.bg} rounded-2xl`}>
                    <div className="flex items-start justify-between mb-2">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className={`text-xs font-medium odia mt-1 ${stat.color}`}>{stat.odia}</p>
                    <p className="text-ocean-600 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-ocean-300 text-sm font-semibold mb-3 odia">⚡ ଶୀଘ୍ର କାର୍ଯ୍ୟ / Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'Add Farmer',     odia: 'ଚାଷୀ ଯୋଗ କରନ୍ତୁ',  icon: Users,      id: 'farmers',    color: 'text-blue-400' },
                    { label: 'Daily Rate',     odia: 'ଆଜିର ରେଟ ଦିଅନ୍ତୁ', icon: TrendingUp, id: 'rates',      color: 'text-green-400' },
                    { label: 'New Collection', odia: 'ନୂଆ ସଂଗ୍ରହ',        icon: Truck,      id: 'collection', color: 'text-orange-400' },
                  ].map((action, i) => (
                    <button key={i} onClick={() => setActive(action.id)}
                      className="card p-4 hover:bg-ocean-800 transition-all text-left border-ocean-700 group rounded-2xl">
                      <action.icon className={`w-6 h-6 ${action.color} mb-2`} />
                      <p className="text-ocean-300 text-xs font-medium odia">{action.odia}</p>
                      <p className="text-ocean-600 text-xs">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info banner */}
              <div className="card p-5 border-blue-800/30 bg-blue-900/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Waves className="w-5 h-5 text-blue-400" />
                  <p className="text-blue-300 text-sm font-semibold">NestNet — Smart Business. Simple Management.</p>
                </div>
                <p className="text-ocean-500 text-xs odia">ଆଜିର ରେଟ, ସଂଗ୍ରହ, ପେମେଣ୍ଟ ଏବଂ ରିପୋର୍ଟ ସବୁ ଏଠାରେ ମିଳିବ।</p>
              </div>

            </div>
          )}

          {active === 'farmers'        && <FarmersPage onViewLedger={(id) => { setSelectedFarmerId(id); setActive('ledger') }} />}
          {active === 'rates'          && <DailyRatePage />}
          {active === 'buyers'         && <BuyersPage onViewLedger={(id) => { setSelectedCompanyId(id); setActive('company-ledger') }} />}
          {active === 'company-ledger' && <CompanyLedgerPage preSelectedCompanyId={selectedCompanyId} />}
          {active === 'collection'     && <CollectionPage />}
          {active === 'ledger'         && <FarmerLedgerPage preSelectedFarmerId={selectedFarmerId} />}

          {/* Coming soon */}
          {!['dashboard','farmers','ledger','buyers','rates','collection','company-ledger'].includes(active) && (
            <div className="animate-fadeup flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-ocean-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {(() => { const item = menuItems.find(m => m.id === active); return item ? <item.icon className="w-8 h-8 text-ocean-500" /> : null })()}
                </div>
                <p className="text-ocean-300 font-medium odia">{menuItems.find(m => m.id === active)?.odia}</p>
                <p className="text-ocean-600 text-sm mt-1">{menuItems.find(m => m.id === active)?.label} — Coming soon</p>
                <p className="text-ocean-700 text-xs mt-1 odia">ଶୀଘ୍ର ଆସୁଛି...</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
