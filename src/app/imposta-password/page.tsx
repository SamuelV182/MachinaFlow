'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Lock,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Factory,
  Eye,
  EyeOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ImpostaPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const tokenParam = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [nomeAzienda, setNomeAzienda] = useState<string | null>(null)
  const [aziendaId, setAziendaId] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(true)
  const [erroreVerifica, setErroreVerifica] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confermaPassword, setConfermaPassword] = useState('')
  const [mostraPassword, setMostraPassword] = useState(false)
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)
  const [messaggioErrore, setMessaggioErrore] = useState<string | null>(null)
  const [completato, setCompletato] = useState(false)

  // Verifica validità del Token di Invito
  useEffect(() => {
    const validaInvito = async () => {
      if (!tokenParam) {
        setErroreVerifica('Link di invito non valido o token mancante.')
        setVerificando(false)
        return
      }

      setToken(tokenParam)
      setEmail(emailParam)

      try {
        const { data: invito, error } = await supabase
          .from('inviti_aziende')
          .select('*, azienda:aziende(*)')
          .eq('token', tokenParam)
          .single()

        if (error || !invito) {
          setErroreVerifica('Questo link di invito non è più valido o è già stato utilizzato.')
        } else if (invito.stato === 'accettato') {
          setErroreVerifica('L&apos;invito è già stato utilizzato. Puoi effettuare il login con la password registrata.')
        } else {
          setEmail(invito.email_destinatario)
          setAziendaId(invito.azienda_id)
          if (invito.azienda) {
            setNomeAzienda(invito.azienda.nome)
          }
        }
      } catch (err: any) {
        setErroreVerifica('Errore durante la verifica dell&apos;invito. Riprova più tardi.')
      } finally {
        setVerificando(false)
      }
    }

    validaInvito()
  }, [tokenParam, emailParam, supabase])

  // Registrazione Password & Attivazione Utente
  const handleRegistraPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessaggioErrore(null)

    if (password.length < 6) {
      setMessaggioErrore('La password deve contenere almeno 6 caratteri.')
      return
    }

    if (password !== confermaPassword) {
      setMessaggioErrore('Le due password inserite non coincidono.')
      return
    }

    setSalvataggioInCorso(true)
    try {
      // 1. Registra l'utente in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (authError) {
        // Se l'utente esiste già in auth, prova a fare signIn o update
        throw authError
      }

      const userId = authData.user?.id

      if (userId && aziendaId) {
        // 2. Crea il profilo utente associato all'azienda creata
        await supabase.from('profili_utenti').upsert({
          id: userId,
          email: email.trim().toLowerCase(),
          azienda_id: aziendaId,
          ruolo: 'admin_officina'
        })
      }

      // 3. Marca l'invito come accettato
      if (token) {
        await supabase
          .from('inviti_aziende')
          .update({
            stato: 'accettato',
            utilizzato_il: new Date().toISOString()
          })
          .eq('token', token)
      }

      setCompletato(true)

      // Reindirizza al gestionale dopo 2 secondi
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setMessaggioErrore(err.message || 'Errore durante l&apos;impostazione della password.')
    } finally {
      setSalvataggioInCorso(false)
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Verifica del link di attivazione in corso...</p>
        </div>
      </div>
    )
  }

  if (erroreVerifica) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Link Non Valido o Scaduto</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{erroreVerifica}</p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
            >
              <span>Vai al Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Intestazione Brand MachinaFlow */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <Factory className="w-3.5 h-3.5" />
            <span>MachinaFlow • Attivazione Ufficiale</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Benvenuto nella tua Officina
          </h1>
          <p className="text-xs text-slate-400">
            {nomeAzienda ? (
              <>
                Stai configurando l&apos;accesso per l&apos;ambiente{' '}
                <strong className="text-sky-400">{nomeAzienda}</strong>
              </>
            ) : (
              'Imposta la tua password personale per completare l&apos;attivazione'
            )}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {completato ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Password Impostata con Successo!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Reindirizzamento automatico al tuo nuovo ambiente di lavoro...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegistraPassword} className="space-y-5">
              {messaggioErrore && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{messaggioErrore}</span>
                </div>
              )}

              {/* BOX IDENTIFICAZIONE EMAIL ESPLICITA (IN SOLA LETTURA) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    Account in Attivazione:
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                    BLOCCATA / PERSONALE
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-white pl-5 select-all">
                  {email}
                </div>
                <span className="text-[10px] text-slate-500 pl-5 block">
                  Questa è l&apos;email definitiva associata all&apos;amministrazione dell&apos;officina.
                </span>
              </div>

              {/* Nuova Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Scegli Nuova Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostraPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Almeno 6 caratteri..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostraPassword(!mostraPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {mostraPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Conferma Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Conferma Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostraPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Ripeti la password..."
                    value={confermaPassword}
                    onChange={(e) => setConfermaPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={salvataggioInCorso}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {salvataggioInCorso ? (
                  <span>Attivazione in corso...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Conferma Password e Accedi all&apos;Officina</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          MachinaFlow • Gestione di Produzione & MES per Officine Meccaniche
        </p>
      </div>
    </div>
  )
}

export default function ImpostaPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Caricamento...</p>
          </div>
        </div>
      }
    >
      <ImpostaPasswordContent />
    </Suspense>
  )
}
