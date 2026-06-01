import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Building2, Shield, FileText, MapPin, Phone, Save, CheckCircle, AlertCircle, Info } from 'lucide-react'

const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
]

export default function SettingsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [hasGST, setHasGST] = useState(false)

  const [form, setForm] = useState({
    name: '',
    owner_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pan: '',
    gstin: '',
    gst_type: '',
  })

  useEffect(() => {
    if (profile?.dealer_id) fetchDealer()
  }, [profile])

  async function fetchDealer() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('id', profile.dealer_id)
      .single()

    if (data) {
      setForm({
        name:       data.name       || '',
        owner_name: data.owner_name || '',
        phone:      data.phone      || '',
        address:    data.address    || '',
        city:       data.city       || '',
        state:      data.state      || '',
        state_code: data.state_code || '',
        pan:        data.pan        || '',
        gstin:      data.gstin      || '',
        gst_type:   data.gst_type   || '',
      })
      setHasGST(!!data.gstin)
    }
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // State select hone par state_code auto set
    if (name === 'state') {
      const found = INDIAN_STATES.find(s => s.name === value)
      if (found) setForm(prev => ({ ...prev, state: value, state_code: found.code }))
    }

    // GSTIN se state auto detect
    if (name === 'gstin' && value.length >= 2) {
      const code = value.substring(0, 2)
      const found = INDIAN_STATES.find(s => s.code === code)
      if (found) setForm(prev => ({ ...prev, gstin: value, state: found.name, state_code: found.code }))
    }
  }

  function validateGSTIN(gstin) {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return regex.test(gstin)
  }

  async function handleSave() {
    setError('')
    setSaving(true)

    // Validation
    if (!form.name.trim()) { setError('Business naam zaroori hai'); setSaving(false); return }
    if (hasGST && form.gstin && !validateGSTIN(form.gstin)) {
      setError('GSTIN format sahi nahi hai (e.g. 21AAAAA0000A1Z5)'); setSaving(false); return
    }

    const updateData = {
      name:       form.name.trim(),
      owner_name: form.owner_name.trim(),
      phone:      form.phone.trim(),
      address:    form.address.trim(),
      city:       form.city.trim(),
      state:      form.state,
      state_code: form.state_code,
      pan:        form.pan.toUpperCase().trim(),
      gstin:      hasGST ? form.gstin.toUpperCase().trim() : null,
      gst_type:   hasGST ? form.gst_type : null,
    }

    const { error: err } = await supabase
      .from('dealers')
      .update(updateData)
      .eq('id', profile.dealer_id)

    setSaving(false)
    if (err) { setError('Save nahi hua: ' + err.message); return }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-ocean-400 text-sm odia">ଲୋଡ ହେଉଛି...</div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeup">

      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold odia">ବ୍ୟବସାୟ ସେଟିଂ</h1>
        <p className="text-ocean-400 text-sm">Business Settings</p>
      </div>

      {/* Business Details */}
      <div className="card p-5 rounded-2xl border-ocean-700 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-blue-400" />
          <p className="text-blue-300 text-sm font-semibold odia">ବ୍ୟବସାୟ ବିବରଣ</p>
          <p className="text-ocean-500 text-xs">/ Business Details</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label odia">ବ୍ୟବସାୟ ନାମ <span className="text-ocean-500">/ Business Name</span> *</label>
            <input name="name" value={form.name} onChange={handleChange}
              className="input w-full mt-1" placeholder="Maa Mangala Fish Center" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label odia">ମାଲିକ ନାମ <span className="text-ocean-500">/ Owner Name</span></label>
              <input name="owner_name" value={form.owner_name} onChange={handleChange}
                className="input w-full mt-1" placeholder="Dinabandhu Das" />
            </div>
            <div>
              <label className="label odia">ମୋବାଇଲ <span className="text-ocean-500">/ Phone</span></label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="input w-full mt-1" placeholder="9XXXXXXXXX" maxLength={10} />
            </div>
          </div>

          <div>
            <label className="label odia">ଠିକଣା <span className="text-ocean-500">/ Address</span></label>
            <input name="address" value={form.address} onChange={handleChange}
              className="input w-full mt-1" placeholder="Village, Post Office, District" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label odia">ସହର <span className="text-ocean-500">/ City</span></label>
              <input name="city" value={form.city} onChange={handleChange}
                className="input w-full mt-1" placeholder="Bhubaneswar" />
            </div>
            <div>
              <label className="label odia">ରାଜ୍ୟ <span className="text-ocean-500">/ State</span></label>
              <select name="state" value={form.state} onChange={handleChange}
                className="input w-full mt-1">
                <option value="">-- Select State --</option>
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label odia">PAN ନମ୍ବର <span className="text-ocean-500">/ PAN Number</span></label>
            <input name="pan" value={form.pan} onChange={handleChange}
              className="input w-full mt-1" placeholder="AAAAA0000A"
              maxLength={10} style={{ textTransform: 'uppercase' }} />
            <p className="text-ocean-600 text-xs mt-1">ITR filing ke liye zaroori</p>
          </div>
        </div>
      </div>

      {/* GST Section */}
      <div className="card p-5 rounded-2xl border-ocean-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <p className="text-emerald-300 text-sm font-semibold odia">GST ବିବରଣ</p>
            <p className="text-ocean-500 text-xs">/ GST Details</p>
          </div>

          {/* GST Toggle */}
          <button
            onClick={() => { setHasGST(!hasGST); if (hasGST) { setForm(p => ({ ...p, gstin: '', gst_type: '' })) } }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border
              ${hasGST
                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                : 'bg-ocean-800 border-ocean-700 text-ocean-400'
              }`}>
            <div className={`w-3 h-3 rounded-full ${hasGST ? 'bg-emerald-400' : 'bg-ocean-600'}`} />
            {hasGST ? 'GST Registered ✓' : 'GST Nahi Hai'}
          </button>
        </div>

        {!hasGST && (
          <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-800/30 rounded-xl p-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-xs font-medium odia">GST ପଞ୍ଜୀକୃତ ନୁହଁ</p>
              <p className="text-amber-600 text-xs mt-0.5">Turnover &lt; ₹40 lakh — Simple P&L report milega. GST invoice nahi banega.</p>
            </div>
          </div>
        )}

        {hasGST && (
          <div className="space-y-4">
            <div>
              <label className="label odia">GSTIN ନମ୍ବର <span className="text-ocean-500">/ GSTIN</span> *</label>
              <input name="gstin" value={form.gstin} onChange={handleChange}
                className="input w-full mt-1" placeholder="21AAAAA0000A1Z5"
                maxLength={15} style={{ textTransform: 'uppercase' }} />
              {form.gstin.length === 15 && (
                <p className={`text-xs mt-1 ${validateGSTIN(form.gstin) ? 'text-emerald-400' : 'text-red-400'}`}>
                  {validateGSTIN(form.gstin) ? '✓ Valid GSTIN' : '✗ Invalid GSTIN format'}
                </p>
              )}
              {form.state && (
                <p className="text-ocean-500 text-xs mt-1">State auto-detected: {form.state} (Code: {form.state_code})</p>
              )}
            </div>

            <div>
              <label className="label odia">GST ପ୍ରକାର <span className="text-ocean-500">/ GST Type</span></label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {[
                  {
                    value: 'composition',
                    title: 'Composition Scheme',
                    odia: 'କମ୍ପୋଜିସନ',
                    desc: 'Turnover < ₹1.5Cr, 1% tax, quarterly filing. Most rural dealers.'
                  },
                  {
                    value: 'regular',
                    title: 'Regular Scheme',
                    odia: 'ରେଗୁଲର',
                    desc: 'Full GST with ITC, monthly GSTR-1 & 3B filing.'
                  },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setForm(p => ({ ...p, gst_type: opt.value }))}
                    className={`p-3 rounded-xl border text-left transition-all
                      ${form.gst_type === opt.value
                        ? 'bg-blue-900/30 border-blue-600/50 text-blue-300'
                        : 'bg-ocean-800 border-ocean-700 text-ocean-400 hover:border-ocean-600'
                      }`}>
                    <p className="text-xs font-semibold odia">{opt.odia}</p>
                    <p className="text-xs font-medium mt-0.5">{opt.title}</p>
                    <p className="text-xs opacity-60 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* GST Info Box */}
            <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-3 space-y-1">
              <p className="text-blue-300 text-xs font-semibold">Fish GST Rates (Reference)</p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {[
                  { item: 'Fresh/Live Fish', rate: '0% (Exempt)' },
                  { item: 'Frozen Fish', rate: '5% GST' },
                  { item: 'Fish Seeds', rate: '0% (Exempt)' },
                  { item: 'Fish Feed', rate: '5% GST' },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-ocean-400 text-xs">{r.item}</span>
                    <span className="text-blue-300 text-xs font-medium">{r.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm odia">ସଫଳତାର ସହ ସେଭ ହେଲା ✓ <span className="text-ocean-400">/ Saved successfully</span></p>
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl">
        <Save className="w-4 h-4" />
        <span className="odia">{saving ? 'ସେଭ ହେଉଛି...' : 'ସେଭ କରନ୍ତୁ'}</span>
        <span className="text-xs opacity-70">/ {saving ? 'Saving...' : 'Save Settings'}</span>
      </button>

    </div>
  )
}
