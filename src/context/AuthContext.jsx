import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, attempt = 1) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
        setLoading(false)
        return
      }
      if (error && attempt < 4) {
        setTimeout(() => fetchProfile(userId, attempt + 1), 600)
        return
      }
    } catch (e) {
      if (attempt < 4) {
        setTimeout(() => fetchProfile(userId, attempt + 1), 600)
        return
      }
      console.log('Profile not found after retries')
    }
    setLoading(false)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function register({ email, password, fullName, businessName, phone, city, state }) {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) throw authError
    const userId = authData.user.id

    // Step 2: Create dealer record first (users.dealer_id is a FK to dealers.id)
    // dealers table requires: name (NOT NULL), owner_name (NOT NULL)
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        id: userId,
        name: businessName,
        owner_name: fullName,
        phone: phone,
        city: city,
        state: state || 'Odisha'
      })
    if (dealerError) throw dealerError

    // Step 3: Create user profile (now dealer_id FK will resolve fine)
    const { data: newProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        dealer_id: userId,
        full_name: fullName,
        business_name: businessName,
        phone: phone,
        city: city,
        state: state || 'Odisha',
        role: 'owner'
      })
      .select()
      .single()
    if (profileError) throw profileError

    setUser(authData.user)
    setProfile(newProfile)
    return authData
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
