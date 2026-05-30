import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Save, Receipt, TrendingUp, TrendingDown, Clock } from 'lucide-react'

export default function PaymentsPage() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState([])
  const [farmers, setFarmers] = useState([])
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    farmer_id: '', buyer_id: '', payment_type: 'received',
    amount: '', payment_mode: 'cash', notes: '', payment_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [pay, far, buy] = await Promise.all([
      supabase.from('payments').select('*, farmers(name), buyers(name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('farmers').select('id, name').eq('dealer_id', profile?.dealer_id).eq('active', true),
      supabase.from('buyers').select('id, name').eq('active', true),
    ])
    if (pay.data) setPayments(pay.data)
    if (far.data) setFarmers(far.data)
    if (buy.data) setBuyers(buy.data)
    setLoading(false)
  }

  async function savePayment() {
    if (!form.amount || !form.payment_type) {
      setMsg('❌ ପ୍ରକାର ଓ ପରିମାଣ ଦିଅନ୍ତୁ')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('payments').insert({
      farmer_id: form.farmer_id || null,
      dealer_id: form.buyer_id || null,
      payment_type: form.payment_type,
      amount: parseFloat(form.amount),
      payment_mode: form.payment_mode,
      payment_date: form.payment_date,
      notes: form.notes,
    })
    if (error) {
      setMsg('❌ Error: ' + error.message)
    } else {
      setMsg('✅ ପେମେଣ୍ଟ ଯୋଗ ହୋଇଗଲା!')
      setForm({ farmer_id: '', buyer_id: '', payment_type: 'received', amount: '', payment_mode: 'cash', notes: '', payment_date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchAll()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const totalReceived = payments.filter(p => p.payment_type === 'received').reduce((s, p) => s + (p.amount || 0), 0)
  const totalPaid = payments.filter(p => p.payment_type === 'paid').reduce((s, p) => s + (p.amount || 0), 0)
  const totalAdvance = payments.filter(p => p.payment_type === 'advance').reduce((s, p) => s + (p.amount || 0), 0)

  const paymentTypes = [
    { id: 'received', label: 'Received', odia: 'ଆସିଲା', color: 'text-green-400' },
    { id: 'paid', label: 'Paid', odia: 'ଦିଆଗଲା', color: 'text-red-400' },
    { id: 'advance', label: 'Advance', odia: 'ଆଡ଼ଭାନ୍ସ', color: 'text-yellow-400' },
    { id: 'due', label: 'Due', odia: 'ବାକି', color: 'text-orange-400' },
  ]

  const paymentModes = ['cash', 'upi', 'bank', 'cheque']

  return (
    <div className="space-y-6 animate-fadeup">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold odia">ପେମେଣ୍ଟ 💰</h1>
          <p className="text-ocean-400 text-sm">Payments — ସବୁ ଲେଣଦେଣ</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-semibold transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="odia">ନୂଆ ପେମେଣ୍ଟ</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border border-green-800/40 bg-green-900/10 rounded-2xl">
          <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-400">₹{totalReceived.toLocaleString('en-IN')}</p>
          <p className="text-green-400 text-xs odia mt-1">ମୋଟ ଆସିଲା</p>
          <p className="text-ocean-600 text-xs">Total Received</p>
        </div>
        <div className="card p-4 border border-red-800/40 bg-red-900/10 rounded-2xl">
          <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-red-400 text-xs odia mt-1">ମୋଟ ଦିଆଗଲା</p>
          <p className="text-ocean-600 text-xs">Total Paid</p>
        </div>
        <div className="card p-4 border border-yellow-800/40 bg-yellow-900/10 rounded-2xl">
          <Clock className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-yellow-400">₹{totalAdvance.toLocaleString('en-IN')}</p>
          <p className="text-yellow-400 text-xs odia mt-1">ଆଡ଼ଭାନ୍ସ</p>
          <p className="text-ocean-600 text-xs">Advance</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 border border-blue-800/40 bg-blue-900/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-blue-300 font-semibold odia">ନୂଆ ପେମେଣ୍ଟ ଯୋଗ</h2>
              <p className="text-ocean-500 text-xs">Add New Payment</p>
            </div>
            <button onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-ocean-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Payment Type */}
            <div className="md:col-span-2">
              <label className="text-ocean-400 text-xs odia mb-2 block">ପ୍ରକାର (Payment Type) *</label>
              <div className="grid grid-cols-4 gap-2">
                {paymentTypes.map(pt => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, payment_type: pt.id }))}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      form.payment_type === pt.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-ocean-800 border-ocean-700 text-ocean-400'
                    }`}
                  >
                    <p className="odia">{pt.odia}</p>
                    <p className="opacity-70">{pt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ପରିମାଣ (Amount ₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="₹ Amount"
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-lg font-bold"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ତାରିଖ (Date)</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ମାଧ୍ୟମ (Payment Mode)</label>
              <select
                value={form.payment_mode}
                onChange={e => setForm(p => ({ ...p, payment_mode: e.target.value }))}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {paymentModes.map(m => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Farmer */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଚାଷୀ (Farmer)</label>
              <select
                value={form.farmer_id}
                onChange={e => setForm(p => ({ ...p, farmer_id: e.target.value }))}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ଚାଷୀ ବାଛନ୍ତୁ...</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Buyer */}
            <div>
              <label className="text-ocean-400 text-xs odia mb-1 block">ଖରିଦାର (Buyer)</label>
              <select
                value={form.buyer_id}
                onChange={e => setForm(p => ({ ...p, buyer_id: e.target.value }))}
                className="w-full bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ଖରିଦାର ବାଛନ୍ତୁ...</option>
                {buyers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
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
            onClick={savePayment}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="odia">ସେଭ କରନ୍ତୁ / Save</span>
          </button>
        </div>
      )}

      {/* Payments List */}
      {loading ? (
        <p className="text-ocean-500 odia">ଲୋଡ଼ ହେଉଛି...</p>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <Receipt className="w-12 h-12 text-ocean-700 mx-auto mb-3" />
          <p className="text-ocean-400 odia">କୋଣସି ପେମେଣ୍ଟ ନାହିଁ</p>
          <p className="text-ocean-600 text-sm">No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(pay => {
            const pt = paymentTypes.find(t => t.id === pay.payment_type)
            const isCredit = pay.payment_type === 'received'
            return (
              <div key={pay.id} className="card p-4 border border-ocean-700 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                        isCredit ? 'bg-green-900/30 text-green-400 border-green-800/40' :
                        pay.payment_type === 'paid' ? 'bg-red-900/30 text-red-400 border-red-800/40' :
                        'bg-yellow-900/30 text-yellow-400 border-yellow-800/40'
                      }`}>
                        <span className="odia">{pt?.odia}</span> / {pt?.label}
                      </span>
                      <span className="text-ocean-500 text-xs uppercase">{pay.payment_mode}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {pay.farmers?.name && <span className="text-ocean-400 text-xs">👨‍🌾 {pay.farmers.name}</span>}
                      {pay.buyers?.name && <span className="text-ocean-400 text-xs">🛒 {pay.buyers.name}</span>}
                      <span className="text-ocean-600 text-xs">{pay.payment_date}</span>
                      {pay.notes && <span className="text-ocean-600 text-xs">· {pay.notes}</span>}
                    </div>
                  </div>
                  <p className={`font-bold text-xl ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                    {isCredit ? '+' : '-'}₹{pay.amount?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
