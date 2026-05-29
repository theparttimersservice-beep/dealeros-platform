import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Search, Phone, MapPin, Fish, X, AlertCircle } from 'lucide-react'

export default function FarmersPage() {
  const { profile } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', name_odia: '', village: '', phone: '', pond_acres: '' })

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg odia">ମଛୁଆ ତାଲିକା</h1>
          <p className="text-ocean-500 text-sm">Farmers List — {farmers.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span className="odia">ମଛୁଆ ଯୋଗ</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-500" />
        <input className="input pl-10" placeholder="ନାମ / ଗ୍ରାମ / ଫୋନ ଖୋଜନ୍ତୁ — Search name, village, phone"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-md p-6 animate-fadeup">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-bold odia">ନୂଆ ମଛୁଆ ଯୋଗ</h2>
                <p className="text-ocean-500 text-sm">Add New Farmer</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-ocean-500 hover:text-ocean-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex gap-2 bg-red-900/30 border border-red-800/60 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label"><span className="odia">ମଛୁଆ ନାମ</span> / Farmer Name *</label>
                <input className="input" placeholder="Full name in English"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label"><span className="odia">ଓଡ଼ିଆ ନାମ</span> / Name in Odia</label>
                <input className="input odia" placeholder="ଓଡ଼ିଆରେ ନାମ ଲିଖନ୍ତୁ"
                  value={form.name_odia} onChange={e => setForm({...form, name_odia: e.target.value})} />
              </div>
              <div>
                <label className="label"><span className="odia">ଗ୍ରାମ</span> / Village</label>
                <input className="input" placeholder="Village name"
                  value={form.village} onChange={e => setForm({...form, village: e.target.value})} />
              </div>
              <div>
                <label className="label"><span className="odia">ଫୋନ</span> / Phone</label>
                <input className="input" placeholder="9876543210"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="label"><span className="odia">ପୋଖରୀ ଏକର</span> / Pond Acres</label>
                <input className="input" type="number" step="0.01" placeholder="e.g. 2.5"
                  value={form.pond_acres} onChange={e => setForm({...form, pond_acres: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  <span className="odia">ବାତିଲ</span>
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  <span className="odia">ସଞ୍ଚୟ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farmers List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center border-ocean-700">
          <Fish className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
          <p className="text-ocean-400 odia">କୌଣସି ମଛୁଆ ନାହିଁ</p>
          <p className="text-ocean-600 text-sm">No farmers found — add one above</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(farmer => (
            <div key={farmer.id} className="card p-4 border-ocean-700 hover:border-ocean-500 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{farmer.name}</p>
                    {farmer.name_odia && <p className="text-ocean-400 text-sm odia">{farmer.name_odia}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    {farmer.village && (
                      <span className="flex items-center gap-1 text-ocean-500 text-xs">
                        <MapPin className="w-3 h-3" />{farmer.village}
                      </span>
                    )}
                    {farmer.phone && (
                      <span className="flex items-center gap-1 text-ocean-500 text-xs">
                        <Phone className="w-3 h-3" />{farmer.phone}
                      </span>
                    )}
                    {farmer.pond_acres > 0 && (
                      <span className="flex items-center gap-1 text-ocean-500 text-xs">
                        <Fish className="w-3 h-3" />{farmer.pond_acres} acres
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge-paid">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
