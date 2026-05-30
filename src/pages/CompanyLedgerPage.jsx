import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, BookOpen, Download, AlertCircle, Trash2, Pencil, Printer } from 'lucide-react'

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
  { id: 'payment_received', label: 'Payment Received', odia: 'ପଇଠ ଆଗଲା', isCredit: false, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/40' },
  { id: 'adjustment', label: 'Adjustment', odia: 'ସଂଶୋଧନ', isCredit: true, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/40' },
]

export default function CompanyLedgerPage({ preSelectedCompanyId = null }) {
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
  const [editEntry, setEditEntry] = useState(null)
  const [form, setForm] = useState({
    entry_type: '', amount: '', description: '',
    quantity_kg: '', rate_per_kg: '',
    entry_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { if (profile) fetchCompanies() }, [profile])
  useEffect(() => { if (selectedCompany) fetchEntries(selectedCompany.id) }, [season])
  useEffect(() => {
    if (preSelectedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === preSelectedCompanyId)
      if (company) selectCompany(company)
    }
  }, [preSelectedCompanyId, companies])

  async function fetchCompanies() {
    const { data } = await supabase
      .from('buyers').select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('active', true).order('name')
    setCompanies(data || [])
  }

  async function fetchEntries(companyId) {
    setLoading(true)
    const { data } = await supabase
      .from('company_ledger').select('*')
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
    setEditEntry(null)
  }

  function openEdit(entry) {
    setEditEntry(entry)
    setForm({
      entry_type: entry.entry_type,
      amount: entry.amount,
      description: entry.description || '',
      quantity_kg: entry.quantity_kg || '',
      rate_per_kg: entry.rate_per_kg || '',
      entry_date: entry.entry_date,
    })
    setShowForm(true)
  }

  function resetForm() {
    setEditEntry(null)
    setForm({ entry_type: '', amount: '', description: '', quantity_kg: '', rate_per_kg: '', entry_date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setError('')
  }

  async function handleDelete(entryId) {
    if (!window.confirm('Delete this entry?')) return
    await supabase.from('company_ledger').delete().eq('id', entryId)
    fetchEntries(selectedCompany.id)
  }

  function printReceipt(entry) {
    const type = ENTRY_TYPES.find(t => t.id === entry.entry_type)
    const amt = parseFloat(entry.amount)
    const receiptHTML = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .logo { font-size: 24px; font-weight: bold; color: #1a56db; }
        .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
        .label { color: #666; }
        .value { font-weight: bold; }
        .amount-box { background: #f0f9ff; border: 2px solid #1a56db; border-radius: 8px; padding: 15px; text-align: center; margin: 15px 0; }
        .amount { font-size: 28px; font-weight: bold; color: #1a56db; }
        .sign-area { display: flex; justify-content: space-between; margin-top: 30px; }
        .sign-line { border-top: 1px solid #000; width: 120px; text-align: center; font-size: 11px; padding-top: 5px; }
        @media print { body { margin: 0; } }
      </style></head><body>
        <div class="header">
          <div class="logo">🌊 NestNet</div>
          <div style="font-size:12px;color:#666">Smart Business. Simple Management.</div>
          <div style="font-size:11px;color:#999">Receipt #${entry.id.slice(0,8).toUpperCase()}</div>
        </div>
        <div class="row"><span class="label">Buyer Name:</span><span class="value">${selectedCompany?.name}</span></div>
        <div class="row"><span class="label">Location:</span><span class="value">${selectedCompany?.village || '-'}</span></div>
        <div class="row"><span class="label">Phone:</span><span class="value">${selectedCompany?.phone || '-'}</span></div>
        <div class="row"><span class="label">Date:</span><span class="value">${entry.entry_date}</span></div>
        <div class="row"><span class="label">Type:</span><span class="value">${type?.label}</span></div>
        ${entry.quantity_kg ? `<div class="row"><span class="label">Quantity:</span><span class="value">${entry.quantity_kg} kg @ ₹${entry.rate_per_kg}/kg</span></div>` : ''}
        ${entry.description ? `<div class="row"><span class="label">Description:</span><span class="value">${entry.description}</span></div>` : ''}
        <div class="amount-box">
          <div class="amount">₹${amt.toLocaleString('en-IN')}</div>
          <div style="font-size:12px;color:#666">${type?.isCredit ? 'Dispatched / ପଠାଗଲା' : 'Received / ଆଗଲା'}</div>
        </div>
        <div class="row"><span class="label">Season:</span><span class="value">${season}</span></div>
        <div class="sign-area">
          <div class="sign-line">Buyer Sign</div>
          <div class="sign-line">Owner Sign</div>
        </div>
        <div style="text-align:center;margin-top:20px;font-size:10px;color:#999">Powered by NestNet</div>
      </body></html>`
    const win = window.open('', '_blank', 'width=500,height=700')
    win.document.write(receiptHTML)
    win.document.close()
    win.print()
  }

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
      if (editEntry) {
        const { error } = await supabase.from('company_ledger').update({
          entry_type: form.entry_type,
          amount: parseFloat(form.amount),
          quantity_kg: parseFloat(form.quantity_kg) || null,
          rate_per_kg: parseFloat(form.rate_per_kg) || null,
          description: form.description,
          entry_date: form.entry_date,
        }).eq('id', editEntry.id)
        if (error) throw error
      } else {
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
      }
      resetForm()
      fetchEntries(selectedCompany.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalDispatched = entries
    .filter(e => ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const totalReceived = entries
    .filter(e => !ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const balance = totalDispatched - totalReceived

  function exportCSV() {
    if (!entries.length) return
    const rows = [['Date', 'Type', 'Description', 'Qty(kg)', 'Rate', 'Dispatched(+)', 'Received(-)', 'Balance']]
    let running = 0
    entries.forEach(e => {
      const type = ENTRY_TYPES.find(t => t.id === e.entry_type)
      const amt = parseFloat(e.amount)
      const credit = type?.isCredit ? amt : 0
      const debit = !type?.isCredit ? amt : 0
      running += credit - debit
      rows.push([e.entry_date, type?.label, e.description || '', e.quantity_kg || '', e.rate_per_kg || '', credit || '', debit || '', running])
    })
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
        <div className="w-60 shrink-0 space-y-2">
          <div className="mb-3">
            <h2 className="text-white font-bold odia">ଖରିଦାର ଖାତା</h2>
            <p className="text-ocean-500 text-xs">Buyer Ledger</p>
          </div>
          <input className="input text-sm" placeholder="ଖୋଜ / Search..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-ocean-600 text-sm">No buyers yet</p>
              <p className="text-ocean-700 text-xs mt-1">Add from Buyers/Clients page</p>
            </div>
          ) : filteredCompanies.map(company => (
            <button key={company.id} onClick={() => selectCompany(company)}
              className={`w-full text-left p-3 rounded-xl border transition-all
                ${selectedCompany?.id === company.id
                  ? 'bg-blue-500/20 border-blue-500/40 text-white'
                  : 'bg-ocean-900 border-ocean-800 text-ocean-300 hover:border-ocean-600'}`}>
              <p className="font-medium text-sm">{company.name}</p>
              {company.village && <p className="text-xs opacity-50">{company.village}{company.district ? ', ' + company.district : ''}</p>}
              {company.phone && <p className="text-xs opacity-50">{company.phone}</p>}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {!selectedCompany ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
                <p className="text-ocean-400 odia">ଖରିଦାର ବାଛନ୍ତୁ</p>
                <p className="text-ocean-600 text-sm">Select a buyer from left</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-white font-bold text-lg">{selectedCompany.name}</h2>
                  {selectedCompany.village && <p className="text-ocean-400 text-sm">{selectedCompany.village}{selectedCompany.district ? ', ' + selectedCompany.district : ''}</p>}
                  {selectedCompany.phone && <p className="text-ocean-500 text-xs">{selectedCompany.phone}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-ocean-400 text-xs odia">ସିଜନ:</label>
                  <select className="input text-sm py-1.5 w-32" value={season} onChange={e => setSeason(e.target.value)}>
                    {getSeasonOptions().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="card p-3 border-red-800/40 bg-red-900/10 rounded-2xl">
                  <p className="text-red-400 font-bold text-xl">₹{totalDispatched.toLocaleString('en-IN')}</p>
                  <p className="text-red-400 text-xs odia">ମୋଟ ପଠାଗଲା</p>
                  <p className="text-ocean-600 text-xs">Total Dispatched</p>
                </div>
                <div className="card p-3 border-green-800/40 bg-green-900/10 rounded-2xl">
                  <p className="text-green-400 font-bold text-xl">₹{totalReceived.toLocaleString('en-IN')}</p>
                  <p className="text-green-400 text-xs odia">ମୋଟ ଆଗଲା</p>
                  <p className="text-ocean-600 text-xs">Total Received</p>
                </div>
                <div className={`card p-3 rounded-2xl ${balance > 0 ? 'border-red-800/40 bg-red-900/10' : 'border-green-800/40 bg-green-900/10'}`}>
                  <p className={`font-bold text-xl ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs odia ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {balance > 0 ? 'ବାକି ଦେବାକୁ ଅଛି' : 'ସଫା'}
                  </p>
                  <p className="text-ocean-600 text-xs">{balance > 0 ? 'Buyer Owes Dealer' : 'Clear'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { resetForm(); setShowForm(true) }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                  <Plus className="w-4 h-4" />
                  <span className="odia">ଏଣ୍ଟ୍ରି ଯୋଗ</span>
                </button>
                <button onClick={exportCSV}
                  className="flex items-center gap-2 bg-ocean-800 hover:bg-ocean-700 text-ocean-300 px-4 py-2 rounded-xl text-sm transition-all">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {showForm && (
                <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-blue-300 font-semibold odia">{editEntry ? 'ଏଣ୍ଟ୍ରି ଠିକ' : 'ନୂଆ ଏଣ୍ଟ୍ରି'} — {season}</h3>
                      <p className="text-ocean-500 text-xs">{editEntry ? 'Edit Entry' : 'New Entry'}</p>
                    </div>
                    <button onClick={resetForm}><X className="w-4 h-4 text-ocean-500" /></button>
                  </div>

                  {error && (
                    <div className="flex gap-2 bg-red-900/30 border border-red-800/60 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-3">
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ଏଣ୍ଟ୍ରି ପ୍ରକାର *</label>
                      <select className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        value={form.entry_type} onChange={e => setForm({...form, entry_type: e.target.value})} required>
                        <option value="">ପ୍ରକାର ବାଛନ୍ତୁ...</option>
                        {ENTRY_TYPES.map(t => <option key={t.id} value={t.id}>{t.odia} / {t.label}</option>)}
                      </select>
                    </div>
                    {form.entry_type === 'dispatch' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-ocean-400 text-xs odia mb-1 block">ପରିମାଣ (kg)</label>
                          <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                            type="number" step="0.01" placeholder="kg"
                            value={form.quantity_kg} onChange={e => setForm({...form, quantity_kg: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-ocean-400 text-xs odia mb-1 block">ରେଟ (₹/kg)</label>
                          <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                            type="number" step="0.01" placeholder="₹/kg"
                            value={form.rate_per_kg} onChange={e => setForm({...form, rate_per_kg: e.target.value})} />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ରାଶି (₹) *</label>
                      <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        type="number" step="0.01" placeholder="0.00"
                        value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                      {form.entry_type === 'dispatch' && form.quantity_kg && form.rate_per_kg && (
                        <p className="text-green-400 text-xs mt-1">
                          Auto: {form.quantity_kg}kg × ₹{form.rate_per_kg} = ₹{(parseFloat(form.quantity_kg) * parseFloat(form.rate_per_kg)).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ବିବରଣ</label>
                      <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Vannamei 40 count, batch 1..."
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ତାରିଖ</label>
                      <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        type="date" value={form.entry_date}
                        onChange={e => setForm({...form, entry_date: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={resetForm}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-ocean-700 text-ocean-400 hover:bg-ocean-800 transition-all text-sm">
                        <span className="odia">ବାତିଲ</span>
                      </button>
                      <button type="submit" disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50">
                        {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        <Save className="w-4 h-4" />
                        <span className="odia">{editEntry ? 'ଅପଡେଟ' : 'ସଞ୍ଚୟ'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

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
                    <span className="text-right odia">Action</span>
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
                        <div key={entry.id} className={`card p-3 border ${type?.border} ${type?.bg} rounded-2xl`}>
                          <div className="grid grid-cols-6 gap-2 items-center">
                            <span className="text-ocean-500 text-xs">{entry.entry_date}</span>
                            <div className="col-span-2">
                              <span className={`text-xs font-semibold ${type?.color}`}>{type?.odia}</span>
                              {entry.description && <p className="text-ocean-300 text-xs mt-0.5">{entry.description}</p>}
                              {entry.quantity_kg && <p className="text-ocean-500 text-xs">{entry.quantity_kg}kg @ ₹{entry.rate_per_kg}</p>}
                            </div>
                            <span className="text-ocean-400 text-right text-xs">
                              {entry.quantity_kg ? `${entry.quantity_kg}kg` : ''}
                            </span>
                            <span className={`text-right font-semibold text-sm ${isCredit ? 'text-red-400' : 'text-green-400'}`}>
                              {isCredit ? `+₹${amt.toLocaleString('en-IN')}` : `-₹${amt.toLocaleString('en-IN')}`}
                            </span>
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => printReceipt(entry)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-900/30 hover:bg-green-800/50 text-green-400 transition-all">
                                <Printer className="w-3 h-3" />
                              </button>
                              <button onClick={() => openEdit(entry)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 transition-all">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(entry.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right mt-1">
                            <span className={`text-xs ${running > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              ବକେୟା: ₹{Math.abs(running).toLocaleString('en-IN')} {running > 0 ? '↑' : '↓'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  })()}

                  <div className="card p-3 border-ocean-600 bg-ocean-800/30 rounded-2xl">
                    <div className="grid grid-cols-6 gap-2">
                      <span className="text-ocean-400 text-xs odia col-span-3">ମୋଟ / Total</span>
                      <span></span>
                      <span className="text-red-400 font-bold text-right">+₹{totalDispatched.toLocaleString('en-IN')}</span>
                      <span></span>
                    </div>
                    <div className="grid grid-cols-6 gap-2 mt-1">
                      <span className="col-span-3"></span>
                      <span></span>
                      <span className="text-green-400 font-bold text-right">-₹{totalReceived.toLocaleString('en-IN')}</span>
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
