import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, BookOpen, AlertCircle, Download, Trash2, Pencil, Printer } from 'lucide-react'

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
  for (let y = year + 1; y >= year - 3; y--) {
    seasons.push(`${y}-${String(y + 1).slice(2)}`)
  }
  return seasons
}

const ENTRY_TYPES = [
  { id: 'material', label: 'Material Issued', odia: 'ସାମଗ୍ରୀ ଦିଆଗଲା', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', isCredit: true },
  { id: 'cash_advance', label: 'Cash Advance', odia: 'ନଗଦ ଅଗ୍ରୀମ', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/40', isCredit: true },
  { id: 'harvest_recovery', label: 'Harvest Recovery', odia: 'ଫସଲ ଆଦାୟ', color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/40', isCredit: false },
  { id: 'cash_payment', label: 'Cash Payment', odia: 'ନଗଦ ଦେୟ', color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/40', isCredit: false },
  { id: 'adjustment', label: 'Adjustment', odia: 'ସଂଶୋଧନ', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/40', isCredit: true },
]

export default function FarmerLedgerPage({ preSelectedFarmerId = null }) {
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
  const [editEntry, setEditEntry] = useState(null)
  const [form, setForm] = useState({
    entry_type: '', amount: '', description: '',
    entry_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { if (profile) fetchFarmers() }, [profile])
  useEffect(() => {
    if (preSelectedFarmerId && farmers.length > 0) {
      const farmer = farmers.find(f => f.id === preSelectedFarmerId)
      if (farmer) selectFarmer(farmer)
    }
  }, [preSelectedFarmerId, farmers])
  useEffect(() => { if (selectedFarmer) fetchEntries(selectedFarmer.id) }, [season])

  async function fetchFarmers() {
    const { data } = await supabase
      .from('farmers').select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('active', true).order('name')
    setFarmers(data || [])
  }

  async function fetchEntries(farmerId) {
    setLoading(true)
    const { data } = await supabase
      .from('farmer_ledger').select('*')
      .eq('dealer_id', profile?.dealer_id)
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
    setEditEntry(null)
  }

  function openEdit(entry) {
    setEditEntry(entry)
    setForm({
      entry_type: entry.entry_type,
      amount: entry.amount,
      description: entry.description || '',
      entry_date: entry.entry_date,
    })
    setShowForm(true)
  }

  function resetForm() {
    setEditEntry(null)
    setForm({ entry_type: '', amount: '', description: '', entry_date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setError('')
  }

  async function handleDelete(entryId) {
    if (!window.confirm('Delete this entry?')) return
    await supabase.from('farmer_ledger').delete().eq('id', entryId)
    fetchEntries(selectedFarmer.id)
  }

  function printReceipt(entry) {
    const type = ENTRY_TYPES.find(t => t.id === entry.entry_type)
    const amt = parseFloat(entry.amount)
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; color: #1a56db; }
          .tagline { font-size: 12px; color: #666; }
          .receipt-no { font-size: 11px; color: #999; margin-top: 5px; }
          .section { margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
          .label { color: #666; }
          .value { font-weight: bold; }
          .amount-box { background: #f0f9ff; border: 2px solid #1a56db; border-radius: 8px; padding: 15px; text-align: center; margin: 15px 0; }
          .amount { font-size: 28px; font-weight: bold; color: #1a56db; }
          .amount-label { font-size: 12px; color: #666; }
          .footer { border-top: 1px solid #ccc; margin-top: 20px; padding-top: 10px; }
          .sign-area { display: flex; justify-content: space-between; margin-top: 30px; }
          .sign-line { border-top: 1px solid #000; width: 120px; text-align: center; font-size: 11px; padding-top: 5px; }
          .type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; 
            background: ${type?.isCredit ? '#fef2f2' : '#f0fdf4'}; 
            color: ${type?.isCredit ? '#dc2626' : '#16a34a'}; 
            border: 1px solid ${type?.isCredit ? '#fca5a5' : '#86efac'}; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🌊 NestNet</div>
          <div class="tagline">Smart Business. Simple Management.</div>
          <div class="receipt-no">Receipt #${entry.id.slice(0,8).toUpperCase()}</div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">Business:</span>
            <span class="value">${profile?.business_name || 'NestNet'}</span>
          </div>
          <div class="row">
            <span class="label">Owner:</span>
            <span class="value">${profile?.full_name || ''}</span>
          </div>
        </div>

        <hr/>

        <div class="section">
          <div class="row">
            <span class="label">Farmer Name:</span>
            <span class="value">${selectedFarmer?.name}</span>
          </div>
          <div class="row">
            <span class="label">Village:</span>
            <span class="value">${selectedFarmer?.village || '-'}</span>
          </div>
          <div class="row">
            <span class="label">Phone:</span>
            <span class="value">${selectedFarmer?.phone || '-'}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${entry.entry_date}</span>
          </div>
          <div class="row">
            <span class="label">Transaction Type:</span>
            <span class="type-badge">${type?.label || entry.entry_type}</span>
          </div>
          ${entry.description ? `<div class="row"><span class="label">Description:</span><span class="value">${entry.description}</span></div>` : ''}
        </div>

        <div class="amount-box">
          <div class="amount">₹${amt.toLocaleString('en-IN')}</div>
          <div class="amount-label">${type?.isCredit ? 'Credit / ଉଧାର' : 'Recovery / ଆଦାୟ'}</div>
        </div>

        <div class="footer">
          <div class="row">
            <span class="label">Season:</span>
            <span class="value">${season}</span>
          </div>
          <div class="row">
            <span class="label">Generated:</span>
            <span class="value">${new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div class="sign-area">
          <div class="sign-line">Farmer Sign</div>
          <div class="sign-line">Owner Sign</div>
        </div>

        <div style="text-align:center; margin-top:20px; font-size:10px; color:#999;">
          Powered by NestNet · dealeros-platform.vercel.app
        </div>
      </body>
      </html>
    `
    const win = window.open('', '_blank', 'width=500,height=700')
    win.document.write(receiptHTML)
    win.document.close()
    win.print()
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editEntry) {
        const { error } = await supabase.from('farmer_ledger').update({
          entry_type: form.entry_type,
          amount: parseFloat(form.amount),
          description: form.description,
          entry_date: form.entry_date,
        }).eq('id', editEntry.id)
        if (error) throw error
      } else {
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
      }
      resetForm()
      fetchEntries(selectedFarmer.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalCredit = entries
    .filter(e => ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const totalRecovered = entries
    .filter(e => !ENTRY_TYPES.find(t => t.id === e.entry_type)?.isCredit)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const balance = totalCredit - totalRecovered

  function exportCSV() {
    if (!entries.length) return
    const rows = [['Date', 'Type', 'Description', 'Credit (+)', 'Recovery (-)', 'Balance']]
    let running = 0
    entries.forEach(e => {
      const type = ENTRY_TYPES.find(t => t.id === e.entry_type)
      const amt = parseFloat(e.amount)
      const credit = type?.isCredit ? amt : 0
      const recovery = !type?.isCredit ? amt : 0
      running += credit - recovery
      rows.push([e.entry_date, type?.label || e.entry_type, e.description || '', credit || '', recovery || '', running])
    })
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
            <h2 className="text-white font-bold odia">ଚାଷୀ ଖାତା</h2>
            <p className="text-ocean-500 text-xs">Farmer Ledger</p>
          </div>
          <input className="input text-sm" placeholder="ଖୋଜ / Search..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {filteredFarmers.map(farmer => (
            <button key={farmer.id} onClick={() => selectFarmer(farmer)}
              className={`w-full text-left p-3 rounded-xl border transition-all
                ${selectedFarmer?.id === farmer.id
                  ? 'bg-blue-500/20 border-blue-500/40 text-white'
                  : 'bg-ocean-900 border-ocean-800 text-ocean-300 hover:border-ocean-600'}`}>
              <p className="font-medium text-sm">{farmer.name}</p>
              {farmer.name_odia && <p className="text-xs odia opacity-70">{farmer.name_odia}</p>}
              {farmer.village && <p className="text-xs opacity-50">{farmer.village}</p>}
            </button>
          ))}
        </div>

        {/* Right — Ledger */}
        <div className="flex-1 min-w-0">
          {!selectedFarmer ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
                <p className="text-ocean-400 odia">ଚାଷୀ ବାଛନ୍ତୁ</p>
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
                <div className="card p-3 border-red-800/40 bg-red-900/10 rounded-2xl">
                  <p className="text-red-400 font-bold text-xl">₹{totalCredit.toLocaleString('en-IN')}</p>
                  <p className="text-red-400 text-xs odia">ମୋଟ ଉଧାର</p>
                  <p className="text-ocean-600 text-xs">Total Credit Given</p>
                </div>
                <div className="card p-3 border-green-800/40 bg-green-900/10 rounded-2xl">
                  <p className="text-green-400 font-bold text-xl">₹{totalRecovered.toLocaleString('en-IN')}</p>
                  <p className="text-green-400 text-xs odia">ମୋଟ ଆଦାୟ</p>
                  <p className="text-ocean-600 text-xs">Total Recovered</p>
                </div>
                <div className={`card p-3 rounded-2xl ${balance > 0 ? 'border-red-800/40 bg-red-900/10' : balance < 0 ? 'border-green-800/40 bg-green-900/10' : 'border-ocean-700'}`}>
                  <p className={`font-bold text-xl ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-green-400' : 'text-ocean-400'}`}>
                    ₹{Math.abs(balance).toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs odia ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-green-400' : 'text-ocean-400'}`}>
                    {balance > 0 ? 'ଦେବାକୁ ଅଛି' : balance < 0 ? 'ପାଇବାକୁ ଅଛି' : 'ସଫା'}
                  </p>
                  <p className="text-ocean-600 text-xs">
                    {balance > 0 ? 'Dealer Owes Farmer' : balance < 0 ? 'Farmer Owes Dealer' : 'Clear'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
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

              {/* Add/Edit Form */}
              {showForm && (
                <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-blue-300 font-semibold odia">
                        {editEntry ? 'ଏଣ୍ଟ୍ରି ଠିକ କରନ୍ତୁ' : 'ନୂଆ ଏଣ୍ଟ୍ରି'} — {season}
                      </h3>
                      <p className="text-ocean-500 text-xs">{editEntry ? 'Edit Entry' : 'New Ledger Entry'}</p>
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
                        {ENTRY_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.odia} / {t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ରାଶି (Amount ₹) *</label>
                      <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        type="number" step="0.01" placeholder="0.00"
                        value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ବିବରଣ (Description)</label>
                      <input className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Feed 50kg, Medicine, Advance..."
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-ocean-400 text-xs odia mb-1 block">ତାରିଖ (Date)</label>
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

              {/* Entries List */}
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
                  <div className="grid grid-cols-6 gap-2 px-3 py-2 text-ocean-500 text-xs">
                    <span className="odia">ତାରିଖ</span>
                    <span className="col-span-2 odia">ବିବରଣ</span>
                    <span className="text-red-400 text-right odia">ଉଧାର (+)</span>
                    <span className="text-green-400 text-right odia">ଆଦାୟ (-)</span>
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
                            </div>
                            <span className={`text-right font-semibold text-sm ${isCredit ? 'text-red-400' : 'text-ocean-700'}`}>
                              {isCredit ? `+₹${amt.toLocaleString('en-IN')}` : ''}
                            </span>
                            <span className={`text-right font-semibold text-sm ${!isCredit ? 'text-green-400' : 'text-ocean-700'}`}>
                              {!isCredit ? `-₹${amt.toLocaleString('en-IN')}` : ''}
                            </span>
                            {/* Edit/Delete */}
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

                  {/* Footer Total */}
                  <div className="card p-3 border-ocean-600 bg-ocean-800/30 rounded-2xl mt-2">
                    <div className="grid grid-cols-6 gap-2">
                      <span className="text-ocean-400 text-xs odia col-span-2">ମୋଟ / Total</span>
                      <span></span>
                      <span className="text-red-400 font-bold text-right">+₹{totalCredit.toLocaleString('en-IN')}</span>
                      <span className="text-green-400 font-bold text-right">-₹{totalRecovered.toLocaleString('en-IN')}</span>
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
