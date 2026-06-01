import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, FileDown, Search, Receipt } from 'lucide-react'

const CATEGORIES = [
  { value: 'transport',   label: 'Transport',       odia: 'ପରିବହନ' },
  { value: 'labour',      label: 'Labour',          odia: 'ମଜୁରି' },
  { value: 'feed',        label: 'Fish Feed',       odia: 'ମାଛ ଖାଦ୍ୟ' },
  { value: 'medicine',    label: 'Medicine',        odia: 'ଔଷଧ' },
  { value: 'equipment',   label: 'Equipment',       odia: 'ଯନ୍ତ୍ରପାତି' },
  { value: 'electricity', label: 'Electricity',     odia: 'ବିଦ୍ୟୁତ' },
  { value: 'rent',        label: 'Rent',            odia: 'ଭଡ଼ା' },
  { value: 'phone',       label: 'Phone/Internet',  odia: 'ଫୋନ' },
  { value: 'bank',        label: 'Bank Charges',    odia: 'ବ୍ୟାଙ୍କ ଚାର୍ଜ' },
  { value: 'other',       label: 'Other',           odia: 'ଅନ୍ୟ' },
]

function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 4
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`
}

export default function ExpensesPage() {
  const { profile } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [season, setSeason] = useState(getCurrentSeason())

  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    gst_amount: '',
    receipt_number: '',
  })

  useEffect(() => {
    if (profile) fetchExpenses()
  }, [profile, season])

  async function fetchExpenses() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('dealer_id', profile.dealer_id)
      .eq('season', season)
      .order('expense_date', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.category) return alert('Category select karo')
    if (!form.amount || isNaN(form.amount)) return alert('Amount sahi dalo')
    setSaving(true)
    const { error } = await supabase.from('expenses').insert({
      dealer_id:      profile.dealer_id,
      expense_date:   form.expense_date,
      category:       form.category,
      description:    form.description.trim(),
      amount:         parseFloat(form.amount),
      gst_amount:     parseFloat(form.gst_amount || 0),
      receipt_number: form.receipt_number.trim(),
      season,
      created_by:     profile.id,
    })
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setForm({
      expense_date: new Date().toISOString().split('T')[0],
      category: '', description: '', amount: '', gst_amount: '', receipt_number: '',
    })
    setShowForm(false)
    fetchExpenses()
  }

  async function handleDelete(id) {
    if (!confirm('Delete karna chahte ho?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchExpenses()
  }

  function exportCSV() {
    const rows = [
      ['Date', 'Category', 'Description', 'Amount', 'GST', 'Net Amount', 'Receipt No'],
      ...filtered.map(e => [
        e.expense_date,
        CATEGORIES.find(c => c.value === e.category)?.label || e.category,
        e.description || '',
        e.amount,
        e.gst_amount || 0,
        (e.amount - (e.gst_amount || 0)).toFixed(2),
        e.receipt_number || '',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${season}.csv`
    a.click()
  }

  const filtered = expenses.filter(e => {
    const matchSearch = !searchText ||
      e.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      e.receipt_number?.toLowerCase().includes(searchText.toLowerCase())
    const matchCat = !filterCategory || e.category === filterCategory
    return matchSearch && matchCat
  })

  const totalAmount  = filtered.reduce((s, e) => s + (e.amount || 0), 0)
  const totalGST     = filtered.reduce((s, e) => s + (e.gst_amount || 0), 0)
  const totalNet     = totalAmount - totalGST

  const seasons = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear - 2; y <= currentYear; y++) {
    seasons.push(`${y}-${String(y + 1).slice(2)}`)
  }

  return (
    <div className="space-y-5 animate-fadeup">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold odia">ଖର୍ଚ ହିସାବ</h1>
          <p className="text-ocean-400 text-sm">Expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="btn-secondary flex items-center gap-2 px-3 py-2 rounded-xl text-xs">
            <FileDown className="w-4 h-4" />
            <span className="odia">CSV</span>
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
            <Plus className="w-4 h-4" />
            <span className="odia">ନୂଆ ଖର୍ଚ</span>
          </button>
        </div>
      </div>

      {/* Season selector */}
      <div className="flex items-center gap-3">
        <span className="text-ocean-400 text-xs odia">Season:</span>
        <div className="flex gap-2">
          {seasons.map(s => (
            <button key={s} onClick={() => setSeason(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                ${season === s
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'border-ocean-700 text-ocean-500 hover:border-ocean-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Expenses',  odia: 'ମୋଟ ଖର୍ଚ',      value: '₹' + totalAmount.toLocaleString('en-IN'),  color: 'text-red-400',     bg: 'bg-red-900/20',     border: 'border-red-800/40' },
          { label: 'GST Paid',        odia: 'GST ଦେଇଛ',       value: '₹' + totalGST.toLocaleString('en-IN'),     color: 'text-amber-400',   bg: 'bg-amber-900/20',   border: 'border-amber-800/40' },
          { label: 'Net Expense',     odia: 'ନେଟ ଖର୍ଚ',       value: '₹' + totalNet.toLocaleString('en-IN'),     color: 'text-orange-400',  bg: 'bg-orange-900/20',  border: 'border-orange-800/40' },
        ].map((s, i) => (
          <div key={i} className={`card p-4 border ${s.border} ${s.bg} rounded-2xl`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-xs font-medium odia mt-1 ${s.color}`}>{s.odia}</p>
            <p className="text-ocean-600 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 rounded-2xl border-blue-800/30 bg-blue-900/10 space-y-4">
          <p className="text-blue-300 text-sm font-semibold odia">ନୂଆ ଖର୍ଚ ଯୋଗ କରନ୍ତୁ / Add New Expense</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label odia">ତାରିଖ <span className="text-ocean-500">/ Date</span></label>
              <input type="date" value={form.expense_date}
                onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))}
                className="input w-full mt-1" />
            </div>
            <div>
              <label className="label odia">ବର୍ଗ <span className="text-ocean-500">/ Category</span></label>
              <select value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="input w-full mt-1">
                <option value="">-- Select --</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.odia} / {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label odia">ବିବରଣ <span className="text-ocean-500">/ Description</span></label>
            <input value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input w-full mt-1" placeholder="Expense details..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label odia">ରାଶି <span className="text-ocean-500">/ Amount ₹</span></label>
              <input type="number" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="input w-full mt-1" placeholder="0" />
            </div>
            <div>
              <label className="label odia">GST ରାଶି <span className="text-ocean-500">/ GST ₹</span></label>
              <input type="number" value={form.gst_amount}
                onChange={e => setForm(p => ({ ...p, gst_amount: e.target.value }))}
                className="input w-full mt-1" placeholder="0" />
            </div>
            <div>
              <label className="label odia">ରସିଦ ନଂ <span className="text-ocean-500">/ Receipt No</span></label>
              <input value={form.receipt_number}
                onChange={e => setForm(p => ({ ...p, receipt_number: e.target.value }))}
                className="input w-full mt-1" placeholder="Optional" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex-1 py-2 rounded-xl text-sm odia">
              {saving ? 'ସେଭ ହେଉଛି...' : 'ସେଭ କରନ୍ତୁ / Save'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="btn-secondary px-6 py-2 rounded-xl text-sm odia">
              ବାତିଲ / Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ocean-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)}
            className="input w-full pl-9" placeholder="Search description, receipt..." />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="input w-48">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card rounded-2xl border-ocean-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ocean-700 bg-ocean-900/50">
              <th className="text-left px-4 py-3 text-ocean-400 text-xs odia">ତାରିଖ</th>
              <th className="text-left px-4 py-3 text-ocean-400 text-xs odia">ବର୍ଗ</th>
              <th className="text-left px-4 py-3 text-ocean-400 text-xs odia">ବିବରଣ</th>
              <th className="text-right px-4 py-3 text-ocean-400 text-xs odia">GST</th>
              <th className="text-right px-4 py-3 text-ocean-400 text-xs odia">ରାଶି</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-ocean-500 odia">ଲୋଡ ହେଉଛି...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Receipt className="w-10 h-10 text-ocean-700 mx-auto mb-2" />
                  <p className="text-ocean-500 text-sm odia">କୌଣସି ଖର୍ଚ ନାହିଁ</p>
                  <p className="text-ocean-700 text-xs">No expenses found</p>
                </td>
              </tr>
            ) : filtered.map(e => {
              const cat = CATEGORIES.find(c => c.value === e.category)
              return (
                <tr key={e.id} className="border-b border-ocean-800 hover:bg-ocean-800/30 transition-colors">
                  <td className="px-4 py-3 text-ocean-300 text-xs">{e.expense_date}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded-lg border border-blue-800/30">
                      <span className="odia">{cat?.odia || e.category}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ocean-300 text-xs">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-right text-amber-400 text-xs">
                    {e.gst_amount ? '₹' + Number(e.gst_amount).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-400 text-sm">
                    ₹{Number(e.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(e.id)}
                      className="text-ocean-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-ocean-700 bg-ocean-900/30">
                <td colSpan={3} className="px-4 py-3 text-ocean-400 text-xs odia">ମୋଟ / Total ({filtered.length} entries)</td>
                <td className="px-4 py-3 text-right text-amber-400 text-xs font-semibold">₹{totalGST.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-red-400 font-bold">₹{totalAmount.toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  )
}
