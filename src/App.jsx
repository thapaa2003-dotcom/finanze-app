import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Zelfstandige from './components/Zelfstandige'
import Goals from './components/Goals'
import Reports from './components/Reports'
import Settings from './components/Settings'
import { todayISO, daysBetween, fmtEUR0, monthKey } from './lib/format'
import { vasteKostenTotaal, sumSnapshot, byCategory, nextQuarterDeadline, BTW_VRIJSTELLINGSGRENS, PEER_BENCHMARK } from './lib/calc'

const TABS = [
  ['dashboard', 'Dashboard', '◈'],
  ['transacties', 'Transacties', '⇅'],
  ['zelfstandige', 'Zelfstandige', '€'],
  ['doelen', 'Doelen', '◎'],
  ['rapport', 'Rapport', '▤'],
  ['instellingen', 'Meer', '⚙'],
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [expected, setExpected] = useState([])
  const [goals, setGoals] = useState([])
  const [commissions, setCommissions] = useState([])
  const [rules, setRules] = useState([])
  const [expensesPro, setExpensesPro] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [theme, setThemeState] = useState('dark')

  const setTheme = (t) => {
    setThemeState(t)
    document.documentElement.classList.toggle('light', t === 'light')
    document.documentElement.classList.toggle('dark', t === 'dark')
    if (profile) supabase.from('profiles').update({ settings: { ...profile.settings, theme: t } }).eq('id', profile.id).then(() => {})
  }

  useEffect(() => {
    if (localStorage.getItem('confin_logout_on_new_session') && !sessionStorage.getItem('confin_alive')) {
      supabase.auth.signOut()
    }
    sessionStorage.setItem('confin_alive', '1')
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (sessionStorage.getItem('confin_session_only')) localStorage.setItem('confin_logout_on_new_session', '1')
      else if (s) localStorage.removeItem('confin_logout_on_new_session')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  const loadAll = useCallback(async () => {
    if (!userId) return
    const [p, t, e, g, c, r, ep] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('transactions').select('*').eq('user_id', userId).order('datum', { ascending: false }).limit(5000),
      supabase.from('expected_income').select('*').eq('user_id', userId).order('verwachte_datum'),
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('commissions').select('*').eq('user_id', userId).order('verwachte_datum'),
      supabase.from('rules').select('*').eq('user_id', userId),
      supabase.from('expenses_pro').select('*').eq('user_id', userId).order('datum', { ascending: false }),
    ])
    if (p.data) {
      setProfile(p.data)
      const th = p.data.settings?.theme || 'dark'
      setThemeState(th)
      document.documentElement.classList.toggle('light', th === 'light')
      document.documentElement.classList.toggle('dark', th === 'dark')
    } else if (p.error?.code === 'PGRST116') {
      await supabase.from('profiles').insert({ id: userId })
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile(data)
    }
    setTransactions(t.data || [])
    setExpected(e.data || [])
    setGoals(g.data || [])
    setCommissions(c.data || [])
    setRules(r.data || [])
    setExpensesPro(ep.data || [])
  }, [userId])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!userId) return
    const ch = supabase.channel('confin-sync')
      .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${userId}` }, () => loadAll())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId, loadAll])

  const saveProfile = async (patch) => {
    const next = { ...profile, ...patch }
    setProfile(next)
    await supabase.from('profiles').update(patch).eq('id', userId)
  }

  const effectiefStatuut = useMemo(() => {
    if (!profile) return 'student'
    if (profile.statuut === 'zelfstandig') return 'zelfstandig'
    if (profile.overgangsdatum && todayISO() >= profile.overgangsdatum) return 'zelfstandig'
    return 'student'
  }, [profile])

  const alerts = useMemo(() => {
    if (!profile) return []
    const out = []
    const vk = vasteKostenTotaal(profile.vaste_kosten)
    const liquide = sumSnapshot(profile.snapshot).liquide + transactions.reduce((a, t) => a + t.bedrag, 0)
    const cats = byCategory(transactions.filter((t) => monthKey(t.datum) === monthKey(todayISO())))
    const bench = PEER_BENCHMARK[effectiefStatuut] || PEER_BENCHMARK.student
    for (const c of cats) {
      const budget = bench[c.name]
      if (budget && c.value >= budget * 0.8) out.push({ tone: c.value >= budget ? 'red' : 'gold', txt: `Budget ${c.name}: ${fmtEUR0(c.value)} van ±${fmtEUR0(budget)} (${Math.round((c.value / budget) * 100)}%)` })
    }
    const jaar = todayISO().slice(0, 4)
    const omzet = transactions.filter((t) => t.categorie === 'Beroepsinkomsten' && t.bedrag > 0 && t.datum.startsWith(jaar)).reduce((a, t) => a + t.bedrag, 0)
    if (omzet >= BTW_VRIJSTELLINGSGRENS * 0.8) out.push({ tone
