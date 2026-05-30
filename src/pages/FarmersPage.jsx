import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Search, Phone, MapPin, Fish, X, AlertCircle } from 'lucide-react'

export default function FarmersPage({ onViewLedger = () => {} }) {
  const { profile } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', name_odia: '', village: '', phone: '', pond_acres: ''
  })

  useEffect(() => { if (profile) fetchFarmers() }, [profile])

  async function fetchFarmers() {
    setLoading(true)
    const { data } = await supabase
      .from('farmers')
      .select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('active', true)
      .order('created_at', { ascending: false })
    setFarmers(data || [])
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { error } = await supabase.from('farmers').insert({
        ...form,
        pond_acres: parseFloat(form.pond_acres) || 0,
        dealer_id: profile.dealer_id,
        active: true
      })
      if (error) throw error
      setForm({ name: '', name_odia: '', village: '', phone: '', pond_acres: '' })
      setShowForm(false)
      fetchFarmers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.village?.toLowerCase().includes(search.toLowerCase()) ||
    f.phone?.includes(search)
  )

  return (
    <div className="space-y-5 animate-fadeup">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg odia">ମଛୁଆ ତାଲିକା 👨‍🌾</h1>
          <p className="text-ocean-500 text-sm">Farmers List — ମୋଟ {farmers.length} ଜଣ</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-semibold transition-all text-sm">
          <UserPlus className="w-4 h-4" />
          <span className="odia">ନୂଆ ଚାଷୀ</span>
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-blue-300 font-semibold odia">ନୂଆ ଚାଷୀ ଯୋଗ କରନ୍ତୁ</h2>
              <p className="text-ocean-500 text-xs">Add New Farmer</p>
            </div>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-ocean-500" />
            </button>
          </div>

          {error && (
            <div className="flex gap-2 bg-red-900/30 border border-red-800/60 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-ocean-400 text-xs odia mb-1 block">ଚାଷୀ ନାମ (Farmer Name) *</label>
                <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Full name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-ocean-400 text-xs odia mb-1 block">ଓଡ଼ିଆ ନାମ (Odia Name)</label>
                <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 odia"
                  placeholder="ଓଡ଼ିଆରେ ନାମ" value={form.name_odia}
                  onChange={e => setForm({ ...form, name_odia: e.target.value })} />
              </div>
              <div>
                <label className="text-ocean-400 text-xs odia mb-1 block">ଫୋନ (Phone)</label>
                <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="9876543210" type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-ocean-400 text-xs odia mb-1 block">ଗ୍ରାମ (Village)</label>
                <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="ଗ୍ରାମ ନାମ" value={form.village}
                  onChange={e => setForm({ ...form, village: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-ocean-400 text-xs odia mb-1 block">ପୋଖରୀ ଏକର (Pond Acres)</label>
                <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  type="number" step="0.01" placeholder="e.g. 2.5" value={form.pond_acres}
                  onChange={e => setForm({ ...form, pond_acres: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-2xl border border-ocean-700 text-ocean-400 hover:bg-ocean-800 transition-all text-sm">
                <span className="odia">ବାତିଲ</span> / Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span className="odia">ସଞ୍ଚୟ / Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-500" />
        <input className="input pl-10"
          placeholder="ନାମ / ଗ୍ରାମ / ଫୋନ ଖୋଜନ୍ତୁ — Search name, village, phone"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center border-ocean-700">
          <Fish className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
          <p className="text-ocean-400 odia">କୌଣସି ଚାଷୀ ନାହିଁ</p>
          <p className="text-ocean-600 text-sm">No farmers found — add one above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(farmer => (
            <div key={farmer.id} className="card p-4 border border-ocean-700 rounded-2xl hover:border-blue-700/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-green-900/30 text-green-400 border border-green-800/40 px-2 py-1 rounded-lg">
                    Active
                  </span>
                  <button onClick={() => onViewLedger(farmer.id)}
                    className="text-xs bg-ocean-700 hover:bg-blue-600 text-ocean-300 hover:text-white px-2.5 py-1 rounded-lg transition-all border border-ocean-600">
                    <span className="odia">ଖାତା ଦେଖ</span>
                  </button>
                </div>
              </div>
              <p className="text-white font-semibold">{farmer.name}</p>
              {farmer.name_odia && (
                <p className="text-ocean-400 text-sm odia mt-0.5">{farmer.name_odia}</p>
              )}
              <div className="space-y-1 mt-2">
                {farmer.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-ocean-500" />
                    <p className="text-ocean-400 text-sm">{farmer.phone}</p>
                  </div>
                )}
                {farmer.village && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-ocean-500" />
                    <p className="text-ocean-500 text-xs">{farmer.village}</p>
                  </div>
                )}
                {farmer.pond_acres > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Fish className="w-3 h-3 text-ocean-500" />
                    <p className="text-ocean-500 text-xs">{farmer.pond_acres} acres</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
