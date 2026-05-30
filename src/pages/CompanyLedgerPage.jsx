import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, BookOpen, Download, AlertCircle } from 'lucide-react'

function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 4) return `${year}-${String(year + 1).slice(2)}`
  else return `${year - 1}-${String(year).slice(2)}`
}

function getSeasonOptions() {
  const year = new Date().getFullYear()
  const seasons = []
  for (let y = year; y >= year - 3; y--) {
    seasons.push(`${y}-${String(y + 1).slice(2)}`)
  }
  return seasons
}

const ENTRY_TYPES = [
  { id: 'dispatch', label: 'Fish Dispatched', odia: 'ମାଛ ପଠାଗଲା', isCredit: true, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40' },
  { id: 'payment_received', label: 'Payment Received', odia: 'ପଇଠ ଆଗଲା', isCredit: false, color: 'text-tide-400', bg: 'bg-tide-900/20', border: 'border-tide-800/40' },
  { id: 'adjustment', label: 'Adjustment', odia: 'ସଂଶୋଧନ', isCredit: true, color: 'text-sand-400', bg: 'bg-sand-900/20', border: 'border-sand-800/40' },
]

export default function CompanyLedgerPage() {
  const { profile } = useAuth()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [entries, setEntries] = useState([])
  const [season, setSeason] = useState(getCurrentSeason())
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    entry_type: '', amount: '', description: '',
    quantity_kg: '', rate_per_kg: '',
    entry_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { if (profile) fetchCompanies() }, [profile])
  useEffect(() => { if (selectedCompany) fetchEntries(selectedCompany.id) }, [season])

  async function fetchCompanies() {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('active', true)
      .order('name')
    setCompanies(data || [])
  }

  async function fetchEntries(companyId) {
    setLoading(true)
    const { data } = await supabase
      .from('company_ledger')
      .select('*')
      .eq('company_id', companyId)
      .eq('season', season)
      .order('entry_date', { ascending: true })
    setEntries(data || [])
    setLoading(false)
  }

  function selectCompany(company) {
    setSelectedCompany(company)
    fetchEntries(company.id)
    setShowForm(false)
  }

  const totalDispatched = entries
    .filter(e => ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const totalReceived = entries
    .filter(e => !ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const balance = totalDispatched - totalReceived

  // Auto calculate amount if kg and rate given
  useEffect(() => {
    if (form.quantity_kg && form.rate_per_kg) {
      const amt = parseFloat(form.quantity_kg) * parseFloat(form.rate_per_kg)
      setForm(f => ({ ...f, amount: amt.toFixed(2) }))
    }
  }, [form.quantity_kg, form.rate_per_kg])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { error } = await supabase.from('company_ledger').insert({
        company_id: selectedCompany.id,
        dealer_id: profile.dealer_id,
        entry_type: form.entry_type,
        amount: parseFloat(form.amount),
        quantity_kg: parseFloat(form.quantity_kg) || null,
        rate_per_kg: parseFloat(form.rate_per_kg) || null,
        description: form.description,
        entry_date: form.entry_date,
        season: season,
      })
      if (error) throw error
      setForm({ entry_type: '', amount: '', description: '', quantity_kg: '', rate_per_kg: '', entry_date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchEntries(selectedCompany.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function exportCSV() {
    if (!entries.length) return
    const rows = [['Date', 'Type', 'Description', 'Qty (kg)', 'Rate', 'Dispatched (+)', 'Received (-)', 'Balance']]
    let running = 0
    entries.forEach(e => {
      const type = ENTRY_TYPES.find(t => t.id === e.entry_type)
      const amt = parseFloat(e.amount)
      const credit = type?.isCredit ? amt : 0
      const debit = !type?.isCredit ? amt : 0
      running += credit - debit
      rows.push([e.entry_date, type?.label, e.description || '', e.quantity_kg || '', e.rate_per_kg || '', credit || '', debit || '', running])
    })
    rows.push(['', '', 'TOTAL DISPATCHED', '', '', totalDispatched, '', ''])
    rows.push(['', '', 'TOTAL RECEIVED', '', '', '', totalReceived, ''])
    rows.push(['', '', 'BALANCE DUE', '', '', balance, '', ''])
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCompany.name}_${season}_ledger.csv`
    a.click()
  }

  const filteredCompanies = companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fadeup">
      <div className="flex gap-4">

        {/* Left — Company List */}
        <div className="w-60 shrink-0 space-y-2">
          <div className="mb-3">
            <h2 className="text-white font-bold odia">କମ୍ପାନୀ ଖାତା</h2>
            <p className="text-ocean-500 text-xs">Company Ledger</p>
          </div>
          <input className="input text-sm" placeholder="ଖୋଜ / Search..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-ocean-600 text-sm">No companies yet</p>
              <p className="text-ocean-700 text-xs mt-1">Add from Buyers/Clients page</p>
            </div>
          ) : (
            filteredCompanies.map(company => (
              <button key={company.id} onClick={() => selectCompany(company)}
                className={`w-full text-left p-3 rounded-xl border transition-all
                  ${selectedCompany?.id === company.id
                    ? 'bg-ocean-700 border-ocean-500 text-white'
                    : 'bg-ocean-900 border-ocean-800 text-ocean-300 hover:border-ocean-600'}`}>
                <p className="font-medium text-sm">{company.name}</p>
                {company.location && <p className="text-xs opacity-50">{company.location}</p>}
                {company.contact && <p className="text-xs opacity-50">{company.contact}</p>}
              </button>
            ))
          )}
        </div>

        {/* Right — Ledger */}
        <div className="flex-1 min-w-0">
          {!selectedCompany ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
                <p className="text-ocean-400 odia">କମ୍ପାନୀ ବାଛନ୍ତୁ</p>
                <p className="text-ocean-600 text-sm">Select a company from left</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-white font-bold text-lg">{selectedCompany.name}</h2>
                  {selectedCompany.location && <p className="text-ocean-400 text-sm">{selectedCompany.location}</p>}
                  {selectedCompany.contact && <p className="text-ocean-500 text-xs">{selectedCompany.contact}</p>}
                </div>
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
                  <p className="text-red-400 font-bold text-xl">₹{totalDispatched.toLocaleString('en-IN')}</p>
                  <p className="text-red-400 text-xs odia">ମୋଟ ପଠାଗଲା</p>
                  <p className="text-ocean-600 text-xs">Total Dispatched</p>
                </div>
                <div className="card p-3 border-tide-800/40 bg-tide-900/10">
                  <p className="text-tide-400 font-bold text-xl">₹{totalReceived.toLocaleString('en-IN')}</p>
                  <p className="text-tide-400 text-xs odia">ମୋଟ ଆଗଲା</p>
                  <p className="text-ocean-600 text-xs">Total Received</p>
                </div>
                <div className={`card p-3 ${balance > 0 ? 'border-red-800/40 bg-red-900/10' : 'border-tide-800/40 bg-tide-900/10'}`}>
                  <p className={`font-bold text-xl ${balance > 0 ? 'text-red-400' : 'text-tide-400'}`}>
                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs odia ${balance > 0 ? 'text-red-400' : 'text-tide-400'}`}>
                    {balance > 0 ? 'ବାକି ଦେବାକୁ ଅଛି' : 'ସଫା'}
                  </p>
                  <p className="text-ocean-600 text-xs">
                    {balance > 0 ? 'Company Owes Dealer' : 'Clear'}
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
                      <p className="text-ocean-500 text-xs">New Entry</p>
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

                    {form.entry_type === 'dispatch' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label odia">ପରିମାଣ / Quantity (kg)</label>
                          <input className="input" type="number" step="0.01" placeholder="kg"
                            value={form.quantity_kg} onChange={e => setForm({...form, quantity_kg: e.target.value})} />
                        </div>
                        <div>
                          <label className="label odia">ରେଟ / Rate (₹/kg)</label>
                          <input className="input" type="number" step="0.01" placeholder="₹/kg"
                            value={form.rate_per_kg} onChange={e => setForm({...form, rate_per_kg: e.target.value})} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="label odia">ରାଶି / Amount (₹) *</label>
                      <input className="input" type="number" step="0.01" placeholder="0.00"
                        value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                      {form.entry_type === 'dispatch' && form.quantity_kg && form.rate_per_kg && (
                        <p className="text-tide-400 text-xs mt-1">
                          Auto: {form.quantity_kg} kg × ₹{form.rate_per_kg} = ₹{(parseFloat(form.quantity_kg) * parseFloat(form.rate_per_kg)).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="label odia">ବିବରଣ / Description</label>
                      <input className="input" placeholder="e.g. Vannamei 40 count, batch 1..."
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

              {/* Entries */}
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
                  <div className="grid grid-cols-6 gap-2 px-3 py-2 text-ocean-500 text-xs">
                    <span className="odia">ତାରିଖ</span>
                    <span className="col-span-2 odia">ବିବରଣ</span>
                    <span className="text-ocean-400 text-right">Qty</span>
                    <span className="text-red-400 text-right odia">ପଠାଗଲା (+)</span>
                    <span className="text-tide-400 text-right odia">ଆଗଲା (-)</span>
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
                          <div className="grid grid-cols-6 gap-2 items-center">
                            <span className="text-ocean-500 text-xs">{entry.entry_date}</span>
                            <div className="col-span-2">
                              <span className={`text-xs font-semibold ${type?.color}`}>{type?.odia}</span>
                              {entry.description && <p className="text-ocean-300 text-xs mt-0.5">{entry.description}</p>}
                            </div>
                            <span className="text-ocean-400 text-right text-xs">
                              {entry.quantity_kg ? `${entry.quantity_kg}kg` : ''}
                            </span>
                            <span className={`text-right font-semibold ${isCredit ? 'text-red-400' : 'text-ocean-700'}`}>
                              {isCredit ? `+₹${amt.toLocaleString('en-IN')}` : ''}
                            </span>
                            <span className={`text-right font-semibold ${!isCredit ? 'text-tide-400' : 'text-ocean-700'}`}>
                              {!isCredit ? `-₹${amt.toLocaleString('en-IN')}` : ''}
                            </span>
                          </div>
                          <div className="text-right mt-1">
                            <span className={`text-xs ${running > 0 ? 'text-red-400' : 'text-tide-400'}`}>
                              ବକେୟା: ₹{Math.abs(running).toLocaleString('en-IN')} {running > 0 ? '↑' : '↓'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  })()}

                  <div className="card p-3 border-ocean-600 bg-ocean-800/30">
                    <div className="grid grid-cols-6 gap-2">
                      <span className="text-ocean-400 text-xs odia col-span-3">ମୋଟ / Total</span>
                      <span></span>
                      <span className="text-red-400 font-bold text-right">+₹{totalDispatched.toLocaleString('en-IN')}</span>
                      <span className="text-tide-400 font-bold text-right">-₹{totalReceived.toLocaleString('en-IN')}</span>
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
