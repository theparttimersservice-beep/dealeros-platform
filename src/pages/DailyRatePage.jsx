import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, TrendingDown, Plus, Save } from 'lucide-react'

const FISH_TYPES = [
  { id: 'shrimp_20', label: 'Shrimp 20 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୨୦' },
  { id: 'shrimp_30', label: 'Shrimp 30 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୩୦' },
  { id: 'shrimp_40', label: 'Shrimp 40 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୪୦' },
  { id: 'shrimp_60', label: 'Shrimp 60 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୬୦' },
  { id: 'shrimp_80', label: 'Shrimp 80 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୮୦' },
  { id: 'shrimp_100', label: 'Shrimp 100 Count', odia: 'ଚିଙ୍ଗୁଡ଼ି ୧୦୦' },
  { id: 'rohu', label: 'Rohu', odia: 'ରୋହି' },
  { id: 'bhakura', label: 'Bhakura', odia: 'ଭାକୁର' },
  { id: 'catla', label: 'Catla', odia: 'କାତଳା' },
  { id: 'magur', label: 'Magur', odia: 'ମାଗୁର' },
  { id: 'hilsa', label: 'Hilsa', odia: 'ଇଲିଶ' },
]

export default function DailyRatePage() {
  const { profile } = useAuth()
  const [rates, setRates] = useState({})
  const [savedRates, setSavedRates] = useState([])
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (profile) fetchTodayRates()
  }, [profile])

  async function fetchTodayRates() {
    const { data } = await supabase
      .from('daily_rates')
      .select('*')
      .eq('dealer_id', profile?.dealer_id)
      .eq('rate_date', today)
      .order('fish_type')
    if (data) {
      const rateMap = {}
      data.forEach(r => { rateMap[r.fish_type] = r.rate_per_kg })
      setRates(rateMap)
      setSavedRates(data)
    }
  }

  async function saveRates() {
    setLoading(true)
    setSaveMsg('')
    try {
      for (const fish of FISH_TYPES) {
        const val = rates[fish.id]
        if (!val) continue
        const existing = savedRates.find(r => r.fish_type === fish.id)
        if (existing) {
          await supabase.from('daily_rates').update({ rate_per_kg: val }).eq('id', existing.id)
        } else {
          await supabase.from('daily_rates').insert({
            fish_type: fish.id,
            rate_per_kg: val,
            rate_date: today,
            dealer_id: profile?.dealer_id,
          })
        }
      }
      setSaveMsg('✅ ରେଟ ସେଭ ହୋଇଗଲା!')
      fetchTodayRates()
    } catch (e) {
      setSaveMsg('❌ Error saving rates')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fadeup">

      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold odia">ଆଜିର ରେଟ 📊</h1>
        <p className="text-ocean-400 text-sm">Today's Market Rate — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FISH_TYPES.map(fish => (
          <div key={fish.id} className="card p-4 border border-ocean-700 rounded-2xl bg-ocean-900/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white text-sm font-semibold odia">{fish.odia}</p>
                <p className="text-ocean-500 text-xs">{fish.label}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ocean-400 text-sm font-bold">₹</span>
              <input
                type="number"
                placeholder="0"
                value={rates[fish.id] || ''}
                onChange={e => setRates(prev => ({ ...prev, [fish.id]: e.target.value }))}
                className="flex-1 bg-ocean-800 border border-ocean-700 rounded-xl px-3 py-2 text-white text-lg font-bold focus:outline-none focus:border-blue-500 w-full"
              />
              <span className="text-ocean-500 text-xs">/kg</span>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveRates}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span className="odia">ରେଟ ସେଭ କରନ୍ତୁ</span>
          <span className="text-blue-200 text-sm">/ Save Rates</span>
        </button>
        {saveMsg && <p className="text-sm odia">{saveMsg}</p>}
      </div>

      {/* Today's Summary */}
      {savedRates.length > 0 && (
        <div className="card p-5 border border-ocean-700 rounded-2xl">
          <h2 className="text-ocean-300 text-sm font-semibold mb-3 odia">✅ ଆଜିର ସେଭ ହୋଇଥିବା ରେଟ</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {savedRates.map(r => {
              const fish = FISH_TYPES.find(f => f.id === r.fish_type)
              return (
                <div key={r.id} className="bg-ocean-800 rounded-xl px-3 py-2">
                  <p className="text-ocean-400 text-xs odia">{fish?.odia || r.fish_type}</p>
                  <p className="text-white font-bold">₹{r.rate_per_kg}/kg</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
