import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, Phone, MapPin, X, Save, ShoppingBag } from 'lucide-react'

export default function BuyersPage({ onViewLedger = () => {} }) {
  const { profile } = useAuth()
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    name: '', owner_name: '', phone: '', village: '',
    district: '', business_type: '', notes: ''
  })

  useEffect(() => { fetchBuyers() }, [])

  async function fetchBuyers() {
    setLoading(true)
    const { data } = await supabase
      .from('buyers')
      .select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (data) setBuyers(data)
    setLoading(false)
  }

  async function saveBuyer() {
    if (!form.name || !form.phone) {
      setMsg('❌ ନାମ ଓ ମୋବାଇଲ ଦିଅନ୍ତୁ')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('buyers').insert({
      name: form.name,
      owner_name: form.owner_name,
      phone: form.phone,
      village: form.village,
      district: form.district,
      business_type: form.business_type,
      notes: form.notes,
      dealer_id: profile.dealer_id,
      active: true,
    })
    if (error) {
      setMsg('❌ Error: ' + error.message)
    } else {
      setMsg('✅ ଖରିଦାର ଯୋଗ ହୋଇଗଲା!')
      setForm({ name: '', owner_name: '', phone: '', village: '', district: '', business_type: '', notes: '' })
      setShowForm(false)
      fetchBuyers()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const businessTypes = [
    'Fish Trader', 'Shrimp Exporter', 'Wholesale Dealer',
    'Retail Shop', 'Hotel/Restaurant', 'Processing Unit', 'Other'
  ]

  return (
    <div className="space-y-6 animate-fadeup">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold odia">ଖରିଦାର ତାଲିକା 🛒</h1>
          <p className="text-ocean-400 text-sm">Buyers/Clients — ମୋଟ {buyers.length} ଜଣ</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-semibold transition-all text-sm">
          <Plus className="w-4 h-4" />
          <span className="odia">ନୂଆ ଖରିଦାର</span>
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-blue-300 font-semibold odia">ନୂଆ ଖରିଦାର ଯୋଗ କରନ୍ତୁ</h2>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-ocean-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ବ୍ୟବସାୟ ନାମ (Business Name) *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="ବ୍ୟବସାୟ ନାମ"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ମାଲିକ ନାମ (Owner Name)</label>
              <input value={form.owner_name} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))}
                placeholder="ମାଲିକଙ୍କ ନାମ"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ମୋବାଇଲ (Mobile) *</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="10 digit number" type="tel"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ବ୍ୟବସାୟ ପ୍ରକାର (Business Type)</label>
              <select value={form.business_type} onChange={e => setForm(p => ({ ...p, business_type: e.target.value }))}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500">
                <option value="">Select type...</option>
                {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଗ୍ରାମ/ସହର (Village/City)</label>
              <input value={form.village} onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
                placeholder="ଗ୍ରାମ ବା ସହର"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଜିଲ୍ଲା (District)</label>
              <input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                placeholder="ଜିଲ୍ଲା ନାମ"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {msg && <p className="text-sm odia">{msg}</p>}

          <button onClick={saveBuyer} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span className="odia">ସେଭ କରନ୍ତୁ / Save</span>
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-ocean-500 odia">ଲୋଡ଼ ହେଉଛି...</p>
      ) : buyers.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
          <p className="text-ocean-400 odia">କୋଣସି ଖରିଦାର ନାହାଁନ୍ତି</p>
          <p className="text-ocean-600 text-sm">No buyers added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyers.map(buyer => (
            <div key={buyer.id} className="card p-4 border border-ocean-700 rounded-2xl hover:border-blue-700/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  {buyer.business_type && (
                    <span className="text-xs bg-ocean-800 text-ocean-400 px-2 py-1 rounded-lg">
                      {buyer.business_type}
                    </span>
                  )}
                  <button onClick={() => onViewLedger(buyer.id)}
                    className="text-xs bg-ocean-700 hover:bg-blue-600 text-ocean-300 hover:text-white px-2.5 py-1 rounded-lg transition-all border border-ocean-600">
                    <span className="odia">ଖାତା ଦେଖ</span>
                  </button>
                </div>
              </div>
              <p className="text-white font-semibold">{buyer.name}</p>
              {buyer.owner_name && <p className="text-ocean-400 text-sm mt-0.5">{buyer.owner_name}</p>}
              {buyer.phone && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Phone className="w-3 h-3 text-ocean-500" />
                  <p className="text-ocean-400 text-sm">{buyer.phone}</p>
                </div>
              )}
              {buyer.village && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-ocean-500" />
                  <p className="text-ocean-500 text-xs">
                    {buyer.village}{buyer.district ? ', ' + buyer.district : ''}
                  </p>
                </div>
              )}
              {buyer.notes && (
                <p className="text-ocean-600 text-xs mt-2 border-t border-ocean-800 pt-2">
                  {buyer.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
