'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Factory, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MachinaFlowLogo } from '@/components/MachinaFlowLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [isRegistrazione, setIsRegistrazione] = useState(false)
  const [messaggioSuccesso, setMessaggioSuccesso] = useState<string | null>(null)

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrore(null)
    setMessaggioSuccesso(null)
    setCaricamento(true)

    try {
      if (isRegistrazione) {
        // Registrazione nuovo utente
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })

        if (error) {
          setErrore(error.message)
        } else if (data.session) {
          // Accesso immediato senza conferma email richiesta
          const emailPulita = email.trim().toLowerCase()
          const isSuperAdminEmail = emailPulita.includes('admin')

          // Se è un Super Admin, reindirizzalo subito alla Gestione Officine & Clienti (/super-admin)
          if (isSuperAdminEmail) {
            router.push('/super-admin')
          } else {
            router.push('/')
          }
          router.refresh()
        } else {
          setMessaggioSuccesso('Account creato con successo! Controlla la tua email per confermare la registrazione, oppure effettua il login.')
          setIsRegistrazione(false)
        }
      } else {
        // Login utente esistente
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrore('Email o password errati. Riprova.')
          } else {
            setErrore(error.message)
          }
        } else {
          // Login riuscito: pulizia preventiva totale di tutte le chiavi operative per garantire zero contaminazioni tra officine
          try {
            const chiaviDaResettare = [
              'machinaflow_session_ruolo',
              'machinaflow_session_azienda',
              'machinaflow_session_azienda_id',
              'machinaflow_session_azienda_dati',
              'machinaflow_supporto_azienda_id',
              'machinaflow_supporto_azienda_nome',
              'machinaflow_odp',
              'machinaflow_articoli',
              'machinaflow_ordini_clienti',
              'machinaflow_ddt_clienti',
              'machinaflow_ddt_esterni',
              'machinaflow_centri_lavoro',
              'machinaflow_tipi_processo',
              'machinaflow_distinte',
              'machinaflow_cicli',
              'machinaflow_fasi_ciclo',
              'machinaflow_clienti',
              'machinaflow_fornitori_terzisti',
              'machinaflow_ordini_fornitori',
              'machinaflow_movimenti_magazzino',
              'machinaflow_materiali_in_preventivo',
              'machinaflow_dati_azienda_cache',
              'machinaflow_postazione_corrente_id'
            ]
            chiaviDaResettare.forEach((k) => localStorage.removeItem(k))
            localStorage.setItem('machinaflow_session_email', email.trim().toLowerCase())
          } catch {}

          const emailPulita = email.trim().toLowerCase()
          const isSuperAdminEmail = emailPulita.includes('admin')

          // Se è un Super Admin, reindirizzalo subito alla Gestione Officine & Clienti (/super-admin)
          if (isSuperAdminEmail) {
            router.push('/super-admin')
          } else {
            router.push('/')
          }
          router.refresh()
        }
      }
    } catch {
      setErrore('Errore di connessione al server di autenticazione.')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Glow ambient background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo MachinaFlow Ufficiale Coordinato */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <MachinaFlowLogo
            dimensione={56}
            sottotitolo="PCP & MES Industriale"
          />
        </div>

        {/* Card di Login */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              {isRegistrazione ? 'Crea Account' : 'Accedi al Sistema'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isRegistrazione
                ? 'Registra un nuovo utente per accedere al gestionale'
                : 'Inserisci le tue credenziali aziendali per proseguire'}
            </p>
          </div>

          {errore && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errore}</span>
            </div>
          )}

          {messaggioSuccesso && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{messaggioSuccesso}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Indirizzo Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={caricamento}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
            >
              {caricamento ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Elaborazione...</span>
                </>
              ) : (
                <>
                  <span>{isRegistrazione ? 'Registrati' : 'Accedi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistrazione(!isRegistrazione)
                setErrore(null)
                setMessaggioSuccesso(null)
              }}
              className="text-xs text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
            >
              {isRegistrazione
                ? 'Hai già un account? Effettua il login'
                : 'Prima volta su MachinaFlow? Crea un account'}
            </button>
          </div>
        </div>

        {/* Info stabilimento footer e autore */}
        <div className="text-center text-[11px] text-slate-500 mt-6 space-y-1">
          <div>
            MachinaFlow Platform &bull; Accesso Crittografato Multi-Tenant
          </div>
          <div>
            Sviluppato da{' '}
            <a
              href="https://vsdigitalcreations.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400/90 hover:text-orange-300 font-semibold transition-colors underline underline-offset-2"
            >
              VS Digital Creations
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
