import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, Truck, MapPin, Fish } from 'lucide-react'

const VILLAGES = [
  'Talachua', 'Ahirajpur', 'Banipal', 'Pataparia',
  'Gumuraghat', 'Rajkanika', 'Rajnagar', 'Other'
]

const FISH_TYPES = [
  { id: 'shrimp_20', label: 'Shrimp 20 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୨୦' },
  { id: 'shrimp_30', label: 'Shrimp 30 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୩୦' },
  { id: 'shrimp_40', label: 'Shrimp 40 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୪୦' },
  { id: 'shrimp_60', label: 'Shrimp 60 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୬୦' },
  { id: 'shrimp_80', label: 'Shrimp 80 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୮୦' },
  { id: 'shrimp_100', label: 'Shrimp 100 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୧୦୦' },
  { id: 'rohu', label: 'Rohu', odia: 'ରୋହି' },
  { id: 'bhakura', label: 'Bhakura', odia: 'ଭାକୁର' },
  { id: 'catla', label: 'Catla', odia: 'କାତଳା' },
  { id: 'magur', label: 'Magur', odia: 'ମାଗୁର' },
  { id: 'hilsa', label: 'Hilsa', odia: 'ଇଲିଶ' },
]

export default function CollectionPage() {
  const { profile } = useAuth()
  const [collections, setCollections] = useState([])
  const [farmers, setFarmers] = useState([])
  const [todayRates, setTodayRates] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    farmer_id: '', village: '', fish_type: '',
    quantity_kg: '', rate_per_kg: '', notes: ''
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [col, far, rates] = await Promise.all([
      supabase.from('collections').select('*, farmers(name, village)').eq('collection_date', today).order('created_at', { ascending: false }),
      supabase.from('farmers').select('id, name, village').eq('dealer_id', profile?.dealer_id).eq('active', true),
      supabase.from('daily_rates').select('*').eq('rate_date', today)
    ])
    if (col.data) setCollections(col.data)
    if (far.data) setFarmers(far.data)
    if (rates.data) {
      const rateMap = {}
      rates.data.forEach(r => { rateMap[r.fish_type] = r.rate_per_kg })
      setTodayRates(rateMap)
    }
    setLoading(false)
  }

  function handleFishChange(fishType) {
    setForm(p => ({
      ...p,
      fish_type: fishType,
      rate_per_kg: todayRates[fishType] || ''
    }))
  }

  function handleFarmerChange(farmerId) {
    const farmer = farmers.find(f => f.id === farmerId)
    setForm(p => ({
      ...p,
      farmer_id: farmerId,
      village: farmer?.village || p.village
    }))
  }

  const totalAmount = (parseFloat(form.quantity_kg) || 0) * (parseFloat(form.rate_per_kg) || 0)

  async function saveCollection() {
    if (!form.fish_type || !form.quantity_kg || !form.rate_per_kg) {
      setMsg('❌ ମାଛ ପ୍ରକାର, ପରିମାଣ ଓ ରେଟ ଦିଅନ୍ତୁ')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('collections').insert({
      farmer_id: form.farmer_id || null,
      village: form.village,
      fish_type: form.fish_type,
      quantity_kg: parseFloat(form.quantity_kg),
      rate_per_kg: parseFloat(form.rate_per_kg),
      total_amount: totalAmount,
      collection_date: today,
      notes: form.notes,
    })
    if (error) {
      setMsg('❌ Error: ' + error.message)
    } else {
      setMsg('✅ ସଂଗ୍ରହ ଯୋଗ ହୋଇଗଲା!')
      setForm({ farmer_id: '', village: '', fish_type: '', quantity_kg: '', rate_per_kg: '', notes: '' })
      setShowForm(false)
      fetchAll()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const todayTotal = collections.reduce((sum, c) => sum + (c.total_amount || 0), 0)
  const todayKg = collections.reduce((sum, c) => sum + (c.quantity_kg || 0), 0)

  return (
    <div className="space-y-6 animate-fadeup">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold odia">ସଂଗ୍ରହ 🚛</h1>
          <p className="text-ocean-400 text-sm">Collection — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-semibold transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="odia">ନୂଆ ସଂଗ୍ରହ</span>
        </button>
      </div>

      {/* Today Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border border-green-800/40 bg-green-900/10 rounded-2xl">
          <p className="text-2xl font-bold text-green-400">{collections.length}</p>
          <p className="text-green-400 text-xs odia mt-1">ଆଜିର ଏଣ୍ଟ୍ରି</p>
          <p className="text-ocean-600 text-xs">Today's Entries</p>
        </div>
        <div className="card p-4 border border-blue-800/40 bg-blue-900/10 rounded-2xl">
          <p className="text-2xl font-bold text-blue-400">{todayKg.toFixed(1)} kg</p>
          <p className="text-blue-400 text-xs odia mt-1">ମୋଟ ପରିମାଣ</p>
          <p className="text-ocean-600 text-xs">Total Quantity</p>
        </div>
        <div className="card p-4 border border-orange-800/40 bg-orange-900/10 rounded-2xl">
          <p className="text-2xl font-bold text-orange-400">₹{todayTotal.toLocaleString('en-IN')}</p>
          <p className="text-orange-400 text-xs odia mt-1">ମୋଟ ମୂଲ୍ୟ</p>
          <p className="text-ocean-600 text-xs">Total Value</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-blue-300 font-semibold odia">ନୂଆ ସଂଗ୍ରହ ଯୋଗ</h2>
              <p className="text-ocean-500 text-xs">Add New Collection</p>
            </div>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-ocean-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Farmer */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଚାଷୀ (Farmer)</label>
              <select
                value={form.farmer_id}
                onChange={e => handleFarmerChange(e.target.value)}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ଚାଷୀ ବାଛନ୍ତୁ...</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>{f.name} — {f.village}</option>
                ))}
              </select>
            </div>

            {/* Village */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଗ୍ରାମ (Village)</label>
              <select
                value={form.village}
                onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ଗ୍ରାମ ବାଛନ୍ତୁ...</option>
                {VILLAGES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Fish Type */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ମାଛ ପ୍ରକାର (Fish Type)</label>
              <select
                value={form.fish_type}
                onChange={e => handleFishChange(e.target.value)}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ମାଛ ବାଛନ୍ତୁ...</option>
                {FISH_TYPES.map(f => (
                  <option key={f.id} value={f.id}>{f.odia} — {f.label}</option>
                ))}
              </select>
            </div>

            {/* Rate */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ରେଟ (Rate ₹/kg)</label>
              <input
                type="number"
                value={form.rate_per_kg}
                onChange={e => setForm(p => ({ ...p, rate_per_kg: e.target.value }))}
                placeholder="₹ per kg"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
              {form.fish_type && todayRates[form.fish_type] && (
                <p className="text-green-400 text-xs mt-1 odia">ଆଜିର ରେଟ: ₹{todayRates[form.fish_type]}/kg</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ପରିମାଣ (Quantity kg)</label>
              <input
                type="number"
                value={form.quantity_kg}
                onChange={e => setForm(p => ({ ...p, quantity_kg: e.target.value }))}
                placeholder="kg"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Total */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ମୋଟ ମୂଲ୍ୟ (Total Amount)</label>
              <div className="w-full bg-ocean-950 border border-ocean-700 rounded-xl px-3 py-2.5">
                <p className="text-green-400 font-bold text-lg">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-ocean-400 text-xs odia mb-1 block">ନୋଟ (Notes)</label>
              <input
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="କିଛି ନୋଟ..."
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {msg && <p className="text-sm odia">{msg}</p>}

          <button
            onClick={saveCollection}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="odia">ସେଭ କରନ୍ତୁ / Save</span>
          </button>
        </div>
      )}

      {/* Collections List */}
      {loading ? (
        <p className="text-ocean-500 odia">ଲୋଡ଼ ହେଉଛି...</p>
      ) : collections.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
          <p className="text-ocean-400 odia">ଆଜି କୋଣସି ସଂଗ୍ରହ ନାହିଁ</p>
          <p className="text-ocean-600 text-sm">No collections today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(col => {
            const fish = FISH_TYPES.find(f => f.id === col.fish_type)
            return (
              <div key={col.id} className="card p-4 border border-ocean-700 rounded-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold odia">{fish?.odia || col.fish_type}</p>
                      <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded-lg">
                        {fish?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {col.farmers?.name && (
                        <span className="text-ocean-400 text-xs">👨‍🌾 {col.farmers.name}</span>
                      )}
                      {col.village && (
                        <span className="flex items-center gap-1 text-ocean-500 text-xs">
                          <MapPin className="w-3 h-3" />{col.village}
                        </span>
                      )}
                      <span className="text-ocean-500 text-xs">
                        {col.quantity_kg} kg × ₹{col.rate_per_kg}
                      </span>
                    </div>
                  </div>
                  <p className="text-green-400 font-bold text-lg">₹{col.total_amount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
