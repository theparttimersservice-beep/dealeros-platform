import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Phone, MapPin, X, Save, Users } from 'lucide-react'

export default function DealersPage() {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    name: '', mobile: '', village: '', district: '', notes: ''
  })

  useEffect(() => { fetchDealers() }, [])

  async function fetchDealers() {
    setLoading(true)
    const { data } = await supabase.from('dealers').select('*').order('created_at', { ascending: false })
    if (data) setDealers(data)
    setLoading(false)
  }

  async function saveDealer() {
    if (!form.name || !form.mobile) {
      setMsg('❌ ନାମ ଓ ମୋବାଇଲ ଦିଅନ୍ତୁ')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('dealers').insert({
      name: form.name,
      mobile: form.mobile,
      village: form.village,
      district: form.district,
      notes: form.notes,
    })
    if (error) {
      setMsg('❌ Error: ' + error.message)
    } else {
      setMsg('✅ ବ୍ୟବସାୟୀ ଯୋଗ ହୋଇଗଲା!')
      setForm({ name: '', mobile: '', village: '', district: '', notes: '' })
      setShowForm(false)
      fetchDealers()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="space-y-6 animate-fadeup">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold odia">ବ୍ୟବସାୟୀ ତାଲିକା 👥</h1>
          <p className="text-ocean-400 text-sm">Dealers — ମୋଟ {dealers.length} ଜଣ</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-semibold transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="odia">ନୂଆ ବ୍ୟବସାୟୀ</span>
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-blue-300 font-semibold odia">ନୂଆ ବ୍ୟବସାୟୀ ଯୋଗ କରନ୍ତୁ</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-ocean-500" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ନାମ (Name) *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="ବ୍ୟବସାୟୀଙ୍କ ନାମ"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ମୋବାଇଲ (Mobile) *</label>
              <input
                value={form.mobile}
                onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                placeholder="10 digit number"
                type="tel"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଗ୍ରାମ (Village)</label>
              <input
                value={form.village}
                onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
                placeholder="ଗ୍ରାମ ନାମ"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଜିଲ୍ଲା (District)</label>
              <input
                value={form.district}
                onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                placeholder="ଜିଲ୍ଲା ନାମ"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-ocean-400 text-xs odia mb-1 block">ନୋଟ (Notes)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="କିଛି ନୋଟ..."
                rows={2}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {msg && <p className="text-sm odia">{msg}</p>}

          <button
            onClick={saveDealer}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="odia">ସେଭ କରନ୍ତୁ / Save</span>
          </button>
        </div>
      )}

      {/* Dealers List */}
      {loading ? (
        <p className="text-ocean-500 odia">ଲୋଡ଼ ହେଉଛି...</p>
      ) : dealers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
          <p className="text-ocean-400 odia">କୋଣସି ବ୍ୟବସାୟୀ ନାହାଁନ୍ତି</p>
          <p className="text-ocean-600 text-sm">No dealers added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealers.map(dealer => (
            <div key={dealer.id} className="card p-4 border border-ocean-700 rounded-2xl hover:border-blue-700/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-white font-semibold">{dealer.name}</p>
              {dealer.mobile && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone className="w-3 h-3 text-ocean-500" />
                  <p className="text-ocean-400 text-sm">{dealer.mobile}</p>
                </div>
              )}
              {dealer.village && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-ocean-500" />
                  <p className="text-ocean-500 text-xs">{dealer.village}{dealer.district ? ', ' + dealer.district : ''}</p>
                </div>
              )}
              {dealer.notes && (
                <p className="text-ocean-600 text-xs mt-2 border-t border-ocean-800 pt-2">{dealer.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
