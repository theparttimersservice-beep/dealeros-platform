import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, BookOpen, TrendingUp, TrendingDown, AlertCircle, Download } from 'lucide-react'

// Current season based on month
function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  if (month >= 4) return `${year}-${String(year + 1).slice(2)}`
  else return `${year - 1}-${String(year).slice(2)}`
}

function getSeasonOptions() {
  const current = new Date()
  const year = current.getFullYear()
  const seasons = []
  for (let y = year + 1; y >= year - 3; y--) {
    seasons.push(`${y}-${String(y + 1).slice(2)}`)
  }
  return seasons
}

const ENTRY_TYPES = [
  { id: 'material', label: 'Material Issued', odia: 'ସାମଗ୍ରୀ ଦିଆଗଲା', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', isCredit: true },
  { id: 'cash_advance', label: 'Cash Advance', odia: 'ନଗଦ ଅଗ୍ରୀମ', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', isCredit: true },
  { id: 'harvest_recovery', label: 'Harvest Recovery', odia: 'ଫସଲ ଆଦାୟ', color: 'text-tide-400', bg: 'bg-tide-900/20', border: 'border-tide-800/40', isCredit: false },
  { id: 'cash_payment', label: 'Cash Payment', odia: 'ନଗଦ ଦେୟ', color: 'text-tide-400', bg: 'bg-tide-900/20', border: 'border-tide-800/40', isCredit: false },
  { id: 'adjustment', label: 'Adjustment', odia: 'ସଂଶୋଧନ', color: 'text-sand-400', bg: 'bg-sand-900/20', border: 'border-sand-800/40', isCredit: true },
]

export default function FarmerLedgerPage() {
  const { profile } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [selectedFarmer, setSelectedFarmer] = useState(null)
  const [entries, setEntries] = useState([])
  const [season, setSeason] = useState(getCurrentSeason())
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    entry_type: '', amount: '', description: '',
    entry_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { if (profile) fetchFarmers() }, [profile])
  useEffect(() => { if (selectedFarmer) fetchEntries(selectedFarmer.id) }, [season])

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
      .eq('season', season)
      .order('entry_date', { ascending: true })
    setEntries(data || [])
    setLoading(false)
  }

  function selectFarmer(farmer) {
    setSelectedFarmer(farmer)
    fetchEntries(farmer.id)
    setShowForm(false)
  }

  // Total credit given
  const totalCredit = entries
    .filter(e => ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  // Total recovered
  const totalRecovered = entries
    .filter(e => !ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  // Balance = credit - recovery (positive = farmer owes dealer)
  const balance = totalCredit - totalRecovered

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
        season: season,
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

  // Export to CSV
  function exportCSV() {
    if (!entries.length) return
    const rows = [
      ['Date', 'Type', 'Description', 'Credit (+)', 'Recovery (-)', 'Running Balance'],
    ]
    let running = 0
    entries.forEach(e => {
      const type = ENTRY_TYPES.find(t => t.id === e.entry_type)
      const amt = parseFloat(e.amount)
      const credit = type?.isCredit ? amt : 0
      const recovery = !type?.isCredit ? amt : 0
      running += credit - recovery
      rows.push([e.entry_date, type?.label || e.entry_type, e.description || '', credit || '', recovery || '', running])
    })
    rows.push(['', '', 'TOTAL CREDIT', totalCredit, '', ''])
    rows.push(['', '', 'TOTAL RECOVERED', '', totalRecovered, ''])
    rows.push(['', '', 'BALANCE', balance, '', ''])

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFarmer.name}_${season}_ledger.csv`
    a.click()
  }

  const filteredFarmers = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.village?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fadeup">
      <div className="flex gap-4">

        {/* Left — Farmer List */}
        <div className="w-60 shrink-0 space-y-2">
          <div className="mb-3">
            <h2 className="text-white font-bold odia">ମଛୁଆ ଖାତା</h2>
            <p className="text-ocean-500 text-xs">Farmer Ledger</p>
          </div>

          {/* Search */}
          <input className="input text-sm" placeholder="ଖୋଜ / Search..."
            value={search} onChange={e => setSearch(e.target.value)} />

          {filteredFarmers.length === 0 ? (
            <p className="text-ocean-600 text-sm">No farmers yet</p>
          ) : (
            filteredFarmers.map(farmer => (
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
                <p className="text-ocean-600 text-sm">Select a farmer from left</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-white font-bold text-lg">{selectedFarmer.name}</h2>
                  {selectedFarmer.name_odia && <p className="text-ocean-400 odia text-sm">{selectedFarmer.name_odia}</p>}
                  <p className="text-ocean-500 text-xs">{selectedFarmer.village} · {selectedFarmer.phone}</p>
                </div>

                {/* Season Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-ocean-400 text-xs odia">ସିଜନ:</label>
                  <select className="input text-sm py-1.5 w-32"
                    value={season} onChange={e => setSeason(e.target.value)}>
                    {getSeasonOptions().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-3 border-red-800/40 bg-red-900/10">
                  <p className="text-red-400 font-bold text-xl">₹{totalCredit.toLocaleString('en-IN')}</p>
                  <p className="text-red-400 text-xs odia">ମୋଟ ଉଧାର</p>
                  <p className="text-ocean-600 text-xs">Total Credit Given</p>
                </div>
                <div className="card p-3 border-tide-800/40 bg-tide-900/10">
                  <p className="text-tide-400 font-bold text-xl">₹{totalRecovered.toLocaleString('en-IN')}</p>
                  <p className="text-tide-400 text-xs odia">ମୋଟ ଆଦାୟ</p>
                  <p className="text-ocean-600 text-xs">Total Recovered</p>
                </div>
                <div className={`card p-3 ${balance > 0 ? 'border-red-800/40 bg-red-900/10' : balance < 0 ? 'border-tide-800/40 bg-tide-900/10' : 'border-ocean-700 bg-ocean-900/20'}`}>
                  <p className={`font-bold text-xl ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-tide-400' : 'text-ocean-400'}`}>
                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs odia ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-tide-400' : 'text-ocean-400'}`}>
                    {balance > 0 ? 'ଦେବାକୁ ଅଛି' : balance < 0 ? 'ପାଇବାକୁ ଅଛି' : 'ସଫା'}
                  </p>
                  <p className="text-ocean-600 text-xs">
                    {balance > 0 ? 'Farmer Owes Dealer' : balance < 0 ? 'Dealer Owes Farmer' : 'Clear'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                  <Plus className="w-4 h-4" />
                  <span className="odia">ଏଣ୍ଟ୍ରି ଯୋଗ</span>
                </button>
                <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-2">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Add Entry Form */}
              {showForm && (
                <div className="card p-5 border-ocean-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold odia">ନୂଆ ଏଣ୍ଟ୍ରି — {season}</h3>
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
                    <div>
                      <label className="label odia">ରାଶି / Amount (₹) *</label>
                      <input className="input" type="number" step="0.01" placeholder="0.00"
                        value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                    </div>
                    <div>
                      <label className="label odia">ବିବରଣ / Description</label>
                      <input className="input" placeholder="e.g. Feed 50kg, Medicine, Advance..."
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
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

              {/* Entries List with Running Balance */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="card p-8 text-center border-ocean-700">
                  <BookOpen className="w-10 h-10 text-ocean-700 mx-auto mb-3" />
                  <p className="text-ocean-400 odia">ଏହି ସିଜନରେ କୌଣସି ଏଣ୍ଟ୍ରି ନାହିଁ</p>
                  <p className="text-ocean-600 text-sm">No entries for {season} season</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-2 px-3 py-2 text-ocean-500 text-xs">
                    <span className="odia">ତାରିଖ</span>
                    <span className="col-span-2 odia">ବିବରଣ</span>
                    <span className="text-red-400 text-right odia">ଉଧାର (+)</span>
                    <span className="text-tide-400 text-right odia">ଆଦାୟ (-)</span>
                  </div>

                  {(() => {
                    let running = 0
                    return entries.map(entry => {
                      const type = ENTRY_TYPES.find(t => t.id === entry.entry_type)
                      const amt = parseFloat(entry.amount)
                      const isCredit = type?.isCredit
                      if (isCredit) running += amt
                      else running -= amt
                      return (
                        <div key={entry.id} className={`card p-3 border ${type?.border} ${type?.bg}`}>
                          <div className="grid grid-cols-5 gap-2 items-center">
                            <span className="text-ocean-500 text-xs">{entry.entry_date}</span>
                            <div className="col-span-2">
                              <span className={`text-xs font-semibold ${type?.color}`}>{type?.odia}</span>
                              {entry.description && <p className="text-ocean-300 text-xs mt-0.5">{entry.description}</p>}
                            </div>
                            <span className={`text-right font-semibold ${isCredit ? 'text-red-400' : 'text-ocean-700'}`}>
                              {isCredit ? `+₹${amt.toLocaleString('en-IN')}` : ''}
                            </span>
                            <span className={`text-right font-semibold ${!isCredit ? 'text-tide-400' : 'text-ocean-700'}`}>
                              {!isCredit ? `-₹${amt.toLocaleString('en-IN')}` : ''}
                            </span>
                          </div>
                          {/* Running balance */}
                          <div className="text-right mt-1">
                            <span className={`text-xs ${running > 0 ? 'text-red-400' : 'text-tide-400'}`}>
                              ବକେୟା: ₹{Math.abs(running).toLocaleString('en-IN')} {running > 0 ? '↑' : '↓'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  })()}

                  {/* Footer Total */}
                  <div className="card p-3 border-ocean-600 bg-ocean-800/30 mt-2">
                    <div className="grid grid-cols-5 gap-2">
                      <span className="text-ocean-400 text-xs odia col-span-2">ମୋଟ / Total</span>
                      <span className="text-red-400 font-bold text-right">+₹{totalCredit.toLocaleString('en-IN')}</span>
                      <span className="text-tide-400 font-bold text-right">-₹{totalRecovered.toLocaleString('en-IN')}</span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
