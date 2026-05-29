import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, BookOpen, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

const ENTRY_TYPES = [
  { id: 'material', label: 'Material Issued', odia: 'ସାମଗ୍ରୀ ଦିଆଗଲା', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', sign: '+' },
  { id: 'cash_advance', label: 'Cash Advance', odia: 'ନଗଦ ଅଗ୍ରୀମ', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', sign: '+' },
  { id: 'harvest_recovery', label: 'Harvest Recovery', odia: 'ଫସଲ ଆଦାୟ', color: 'text-tide-400', bg: 'bg-tide-900/20', border: 'border-tide-800/40', sign: '-' },
  { id: 'cash_payment', label: 'Cash Payment', odia: 'ନଗଦ ଦେୟ', color: 'text-tide-400', bg: 'bg-tide-900/20', border: 'border-tide-800/40', sign: '-' },
  { id: 'adjustment', label: 'Adjustment', odia: 'ସଂଶୋଧନ', color: 'text-sand-400', bg: 'bg-sand-900/20', border: 'border-sand-800/40', sign: '±' },
]

export default function FarmerLedgerPage() {
  const { profile } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [selectedFarmer, setSelectedFarmer] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ entry_type: '', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (profile) fetchFarmers() }, [profile])

  async function fetchFarmers() {
    const { data } = await supabase
      .from('farmers')
      .select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('active', true)
      .order('name')
    setFarmers(data || [])
  }

  async function fetchEntries(farmerId) {
    setLoading(true)
    const { data } = await supabase
      .from('farmer_ledger')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('entry_date', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  function selectFarmer(farmer) {
    setSelectedFarmer(farmer)
    fetchEntries(farmer.id)
    setShowForm(false)
  }

  // Calculate running balance
  const balance = entries.reduce((sum, e) => {
    if (['material', 'cash_advance'].includes(e.entry_type)) return sum + parseFloat(e.amount)
    if (['harvest_recovery', 'cash_payment'].includes(e.entry_type)) return sum - parseFloat(e.amount)
    return sum
  }, 0)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { error } = await supabase.from('farmer_ledger').insert({
        farmer_id: selectedFarmer.id,
        dealer_id: profile.dealer_id,
        entry_type: form.entry_type,
        amount: parseFloat(form.amount),
        description: form.description,
        entry_date: form.entry_date,
      })
      if (error) throw error
      setForm({ entry_type: '', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchEntries(selectedFarmer.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fadeup h-full">
      <div className="flex gap-4 h-full">

        {/* Left — Farmer List */}
        <div className="w-64 shrink-0 space-y-2">
          <div className="mb-3">
            <h2 className="text-white font-bold odia">ମଛୁଆ ଖାତା</h2>
            <p className="text-ocean-500 text-xs">Farmer Ledger</p>
          </div>
          {farmers.length === 0 ? (
            <p className="text-ocean-600 text-sm">No farmers yet</p>
          ) : (
            farmers.map(farmer => (
              <button key={farmer.id} onClick={() => selectFarmer(farmer)}
                className={`w-full text-left p-3 rounded-xl border transition-all
                  ${selectedFarmer?.id === farmer.id
                    ? 'bg-ocean-700 border-ocean-500 text-white'
                    : 'bg-ocean-900 border-ocean-800 text-ocean-300 hover:border-ocean-600'}`}>
                <p className="font-medium text-sm">{farmer.name}</p>
                {farmer.name_odia && <p className="text-xs odia opacity-70">{farmer.name_odia}</p>}
                {farmer.village && <p className="text-xs opacity-50">{farmer.village}</p>}
              </button>
            ))
          )}
        </div>

        {/* Right — Ledger */}
        <div className="flex-1 min-w-0">
          {!selectedFarmer ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
                <p className="text-ocean-400 odia">ମଛୁଆ ବାଛନ୍ତୁ</p>
                <p className="text-ocean-600 text-sm">Select a farmer to view ledger</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Farmer Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white font-bold text-lg">{selectedFarmer.name}</h2>
                  {selectedFarmer.name_odia && <p className="text-ocean-400 odia text-sm">{selectedFarmer.name_odia}</p>}
                  <p className="text-ocean-500 text-xs">{selectedFarmer.village} · {selectedFarmer.phone}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-400' : 'text-tide-400'}`}>
                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs odia ${balance > 0 ? 'text-red-400' : 'text-tide-400'}`}>
                    {balance > 0 ? 'ଦେବାକୁ ଅଛି (Owes Dealer)' : balance < 0 ? 'ପାଇବାକୁ ଅଛି (Dealer Owes)' : 'ସମାନ (Clear)'}
                  </p>
                </div>
              </div>

              {/* Balance Card */}
              <div className={`card p-4 border ${balance > 0 ? 'border-red-800/40 bg-red-900/10' : 'border-tide-800/40 bg-tide-900/10'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {balance > 0 ? <TrendingUp className="w-5 h-5 text-red-400" /> : <TrendingDown className="w-5 h-5 text-tide-400" />}
                    <span className="text-ocean-300 text-sm odia">ବର୍ତ୍ତମାନ ବକେୟା / Current Balance</span>
                  </div>
                  <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                    <Plus className="w-4 h-4" />
                    <span className="odia">ଏଣ୍ଟ୍ରି ଯୋଗ</span>
                  </button>
                </div>
              </div>

              {/* Add Entry Form */}
              {showForm && (
                <div className="card p-5 border-ocean-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold odia">ନୂଆ ଏଣ୍ଟ୍ରି</h3>
                      <p className="text-ocean-500 text-xs">New Ledger Entry</p>
                    </div>
                    <button onClick={() => setShowForm(false)}>
                      <X className="w-4 h-4 text-ocean-500" />
                    </button>
                  </div>

                  {error && (
                    <div className="flex gap-2 bg-red-900/30 border border-red-800/60 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-3">
                    {/* Entry Type */}
                    <div>
                      <label className="label odia">ଏଣ୍ଟ୍ରି ପ୍ରକାର / Entry Type *</label>
                      <select className="input" value={form.entry_type}
                        onChange={e => setForm({...form, entry_type: e.target.value})} required>
                        <option value="">ପ୍ରକାର ବାଛନ୍ତୁ...</option>
                        {ENTRY_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.odia} / {t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="label odia">ରାଶି / Amount (₹) *</label>
                      <input className="input" type="number" step="0.01" placeholder="0.00"
                        value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="label odia">ବିବରଣ / Description</label>
                      <input className="input" placeholder="e.g. Feed 50kg, Medicine, Advance..."
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="label odia">ତାରିଖ / Date</label>
                      <input className="input" type="date"
                        value={form.entry_date} onChange={e => setForm({...form, entry_date: e.target.value})} />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                        <span className="odia">ବାତିଲ</span>
                      </button>
                      <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        <Save className="w-4 h-4" />
                        <span className="odia">ସଞ୍ଚୟ</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Entries List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="card p-8 text-center border-ocean-700">
                  <BookOpen className="w-10 h-10 text-ocean-700 mx-auto mb-3" />
                  <p className="text-ocean-400 odia">କୌଣସି ଏଣ୍ଟ୍ରି ନାହିଁ</p>
                  <p className="text-ocean-600 text-sm">No entries yet — add first entry above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map(entry => {
                    const type = ENTRY_TYPES.find(t => t.id === entry.entry_type)
                    const isCredit = ['material', 'cash_advance'].includes(entry.entry_type)
                    return (
                      <div key={entry.id} className={`card p-4 border ${type?.border} ${type?.bg}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${type?.color} ${type?.border} ${type?.bg}`}>
                                {type?.odia}
                              </span>
                            </div>
                            {entry.description && <p className="text-ocean-300 text-sm mt-1">{entry.description}</p>}
                            <p className="text-ocean-600 text-xs mt-1">{entry.entry_date}</p>
                          </div>
                          <p className={`font-bold text-lg ${isCredit ? 'text-red-400' : 'text-tide-400'}`}>
                            {isCredit ? '+' : '-'}₹{parseFloat(entry.amount).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
