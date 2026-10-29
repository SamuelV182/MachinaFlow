'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Building2,
  Plus,
  Users,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Search,
  Factory,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  KeyRound,
  RefreshCw,
  Headphones,
  Trash2,
  PowerOff,
  Power,
  Cpu,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Azienda, InvitoAzienda } from '@/types/database'

export default function SuperAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [aziende, setAziende] = useState<Azienda[]>([])
  const [inviti, setInviti] = useState<InvitoAzienda[]>([])
  const [conteggioMacchine, setConteggioMacchine] = useState<Record<string, number>>({})
  const [conteggioUtenti, setConteggioUtenti] = useState<Record<string, number>>({})
  const [conteggioOdp, setConteggioOdp] = useState<Record<string, number>>({})
  const [caricamento, setCaricamento] = useState(true)
  const [ricerca, setRicerca] = useState('')

  // Stato Modale Conferma Eliminazione Officina
  const [aziendaDaEliminare, setAziendaDaEliminare] = useState<Azienda | null>(null)
  const [eliminazioneInCorso, setEliminazioneInCorso] = useState(false)

  // Stato Modale Crea Nuova Officina
  const [modaleNuovaAzienda, setModaleNuovaAzienda] = useState(false)
  const [creazioneInCorso, setCreazioneInCorso] = useState(false)
  const [formAzienda, setFormAzienda] = useState({
    nome: '',
    email_titolare: '',
    telefono: '',
    partita_iva: '',
    citta: ''
  })

  // Stato Modale Invito Generato (WhatsApp / Copia Link)
  const [invitoGenerato, setInvitoGenerato] = useState<{
    link: string
    aziendaNome: string
    email: string
    telefono?: string
  } | null>(null)
  const [copiato, setCopiato] = useState(false)

  // Caricamento dati iniziali
  const caricaDati = async () => {
    setCaricamento(true)
    try {
      const { data: aziendeData } = await supabase
        .from('aziende')
        .select('*')
        .order('creato_il', { ascending: false })

      if (aziendeData) {
        setAziende(aziendeData as Azienda[])
      }

      const { data: invitiData } = await supabase
        .from('inviti_aziende')
        .select('*')
        .order('creato_il', { ascending: false })

      if (invitiData) {
        setInviti(invitiData as InvitoAzienda[])
      }

      // Recupera conteggi macchine, utenti e ordini per ogni azienda
      const { data: macchineData } = await supabase.from('centri_lavoro').select('id, azienda_id')
      if (macchineData) {
        const mappaMacchine: Record<string, number> = {}
        macchineData.forEach((m: any) => {
          const azKey = m.azienda_id || 'az-pilota-01'
          mappaMacchine[azKey] = (mappaMacchine[azKey] || 0) + 1
        })
        setConteggioMacchine(mappaMacchine)
      }

      const { data: utentiData } = await supabase.from('profili_utenti').select('id, azienda_id')
      if (utentiData) {
        const mappaUtenti: Record<string, number> = {}
        utentiData.forEach((u: any) => {
          const azKey = u.azienda_id || 'az-pilota-01'
          mappaUtenti[azKey] = (mappaUtenti[azKey] || 0) + 1
        })
        setConteggioUtenti(mappaUtenti)
      }

      const { data: odpData } = await supabase.from('ordini_produzione').select('id, azienda_id')
      if (odpData) {
        const mappaOdp: Record<string, number> = {}
        odpData.forEach((o: any) => {
          const azKey = o.azienda_id || 'az-pilota-01'
          mappaOdp[azKey] = (mappaOdp[azKey] || 0) + 1
        })
        setConteggioOdp(mappaOdp)
      }
    } catch (err) {
      console.error('Errore caricamento dati Super Admin:', err)
    } finally {
      setCaricamento(false)
    }
  }

  useEffect(() => {
    caricaDati()
  }, [])

  // Creazione Nuova Officina & Generazione Token Invito
  const handleCreaAzienda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formAzienda.nome || !formAzienda.email_titolare) return

    setCreazioneInCorso(true)
    try {
      // 1. Genera ID univoco azienda e token invito sicuro
      const timestamp = Date.now().toString(36)
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      const nuovaAziendaId = `az-${formAzienda.nome.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}-${randomSuffix}`
      const inviteToken = `inv_${timestamp}_${Math.random().toString(36).substring(2, 10)}`

      // 2. Inserimento nuova azienda nel database Supabase
      const { error: errAzienda } = await supabase.from('aziende').insert({
        id: nuovaAziendaId,
        nome: formAzienda.nome.trim(),
        email_titolare: formAzienda.email_titolare.trim().toLowerCase(),
        telefono: formAzienda.telefono.trim() || null,
        partita_iva: formAzienda.partita_iva.trim() || null,
        citta: formAzienda.citta.trim() || null,
        stato: 'attiva'
      })

      if (errAzienda) throw errAzienda

      // 3. Inserimento record invito
      const { error: errInvito } = await supabase.from('inviti_aziende').insert({
        id: `inv-${Date.now()}`,
        token: inviteToken,
        azienda_id: nuovaAziendaId,
        email_destinatario: formAzienda.email_titolare.trim().toLowerCase(),
        nome_contatto: formAzienda.nome,
        telefono: formAzienda.telefono.trim() || null,
        stato: 'in_attesa'
      })

      if (errInvito) throw errInvito

      // 4. Costruzione del Link di Attivazione
      const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
      const linkAttivazione = `${hostUrl}/imposta-password?token=${inviteToken}&email=${encodeURIComponent(
        formAzienda.email_titolare.trim().toLowerCase()
      )}`

      // 5. Mostra il modale con i dettagli di invito (WhatsApp / Copia)
      setInvitoGenerato({
        link: linkAttivazione,
        aziendaNome: formAzienda.nome,
        email: formAzienda.email_titolare.trim().toLowerCase(),
        telefono: formAzienda.telefono
      })

      // Reset form e chiusura primo modale
      setFormAzienda({
        nome: '',
        email_titolare: '',
        telefono: '',
        partita_iva: '',
        citta: ''
      })
      setModaleNuovaAzienda(false)

      // Ricarica la lista aziende
      await caricaDati()
    } catch (err: any) {
      alert(`Errore durante la creazione dell'officina: ${err.message || 'Riprova'}`)
    } finally {
      setCreazioneInCorso(false)
    }
  }

  // Copia Link negli appunti
  const copiaNegliAppunti = (testo: string) => {
    navigator.clipboard.writeText(testo)
    setCopiato(true)
    setTimeout(() => setCopiato(false), 2500)
  }

  // Prepara messaggio WhatsApp preformattato
  const apriWhatsApp = (link: string, nomeOfficina: string, telefono?: string) => {
    const messaggio = `Ciao! È stato creato il tuo ambiente MachinaFlow per "${nomeOfficina}".\n\nPuoi impostare la tua password di accesso e iniziare a utilizzare il gestionale da questo link:\n${link}`
    const numeroPulito = telefono ? telefono.replace(/[^0-9+]/g, '') : ''
    const waUrl = numeroPulito
      ? `https://wa.me/${numeroPulito.replace('+', '')}?text=${encodeURIComponent(messaggio)}`
      : `https://wa.me/?text=${encodeURIComponent(messaggio)}`
    window.open(waUrl, '_blank')
  }

  // Genera / Rigenera Link di Accesso o Reimposta Password per qualsiasi officina
  const handleRigeneraLinkAccesso = async (az: Azienda) => {
    try {
      const timestamp = Date.now().toString(36)
      const inviteToken = `inv_${timestamp}_${Math.random().toString(36).substring(2, 10)}`

      // Inserisce o rinnova un token invito attivo
      await supabase.from('inviti_aziende').insert({
        id: `inv-${Date.now()}`,
        token: inviteToken,
        azienda_id: az.id,
        email_destinatario: az.email_titolare,
        nome_contatto: az.nome,
        telefono: az.telefono || null,
        stato: 'in_attesa'
      })

      const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
      const link = `${hostUrl}/imposta-password?token=${inviteToken}&email=${encodeURIComponent(az.email_titolare)}`

      setInvitoGenerato({
        link,
        aziendaNome: az.nome,
        email: az.email_titolare,
        telefono: az.telefono
      })

      await caricaDati()
    } catch (err: any) {
      alert(`Impossibile generare il link: ${err.message || 'Errore di connessione'}`)
    }
  }

  // Toggle Sospensione / Riattivazione Officina
  const handleToggleStatoAzienda = async (az: Azienda) => {
    const nuovoStato = az.stato === 'attiva' ? 'sospesa' : 'attiva'
    const azioneMsg = nuovoStato === 'sospesa' ? 'sospendere temporaneamente' : 'riattivare'

    if (!confirm(`Sei sicuro di voler ${azioneMsg} l'officina "${az.nome}"?`)) return

    try {
      const { error } = await supabase
        .from('aziende')
        .update({ stato: nuovoStato })
        .eq('id', az.id)

      if (error) throw error

      setAziende((prev) =>
        prev.map((item) => (item.id === az.id ? { ...item, stato: nuovoStato } : item))
      )
    } catch (err: any) {
      alert(`Errore aggiornamento stato: ${err.message || 'Riprova'}`)
    }
  }

  // Eliminazione Definitiva Officina
  const handleConfermaEliminazione = async () => {
    if (!aziendaDaEliminare) return

    setEliminazioneInCorso(true)
    try {
      // 1. Elimina eventuali inviti collegati
      await supabase.from('inviti_aziende').delete().eq('azienda_id', aziendaDaEliminare.id)

      // 2. Elimina record azienda
      const { error } = await supabase.from('aziende').delete().eq('id', aziendaDaEliminare.id)
      if (error) throw error

      setAziendaDaEliminare(null)
      await caricaDati()
    } catch (err: any) {
      alert(`Errore durante l'eliminazione: ${err.message || 'Riprova'}`)
    } finally {
      setEliminazioneInCorso(false)
    }
  }

  const aziendeFiltrate = aziende.filter(
    (az) =>
      az.nome.toLowerCase().includes(ricerca.toLowerCase()) ||
      az.email_titolare.toLowerCase().includes(ricerca.toLowerCase()) ||
      (az.citta && az.citta.toLowerCase().includes(ricerca.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header Super Admin */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin SaaS
            </span>
            <span className="text-xs text-slate-400">Piattaforma Multi-Tenant</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-sky-400" />
            Gestione Officine & Clienti
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Da qui puoi creare nuove officine meccaniche completamente indipendenti e inviare il link di invito su WhatsApp o via email.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => caricaDati()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Ricarica elenco"
          >
            <RefreshCw className={`w-4 h-4 ${caricamento ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setModaleNuovaAzienda(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crea Nuova Officina</span>
          </button>
        </div>
      </div>

      {/* Barra di Ricerca e Statistiche Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Officine Attive</span>
            <div className="text-2xl font-black text-white mt-0.5">{aziende.length}</div>
          </div>
          <Factory className="w-8 h-8 text-sky-500/60" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Inviti in Attesa</span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">
              {inviti.filter((i) => i.stato === 'in_attesa').length}
            </div>
          </div>
          <KeyRound className="w-8 h-8 text-amber-500/60" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca officina, email, città..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Tabella Elenco Officine */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            Elenco Ambienti Officina Registrati
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {aziendeFiltrate.length} officine
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Nome Officina / ID</th>
                <th className="p-3.5">Titolare / Contatto</th>
                <th className="p-3.5 text-center">Risorse & Dimensione</th>
                <th className="p-3.5 text-center">Stato</th>
                <th className="p-3.5 text-center">Data Creazione</th>
                <th className="p-3.5 text-right">Azioni Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {aziendeFiltrate.map((az) => {
                const isPilota = az.id === 'az-pilota-01'
                const invitoAperto = inviti.find((i) => i.azienda_id === az.id && i.stato === 'in_attesa')
                const numMacchine = conteggioMacchine[az.id] || (isPilota ? 4 : 0)
                const numUtenti = conteggioUtenti[az.id] || (isPilota ? 2 : 1)
                const numOdp = conteggioOdp[az.id] || (isPilota ? 5 : 0)

                return (
                  <tr key={az.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                        <span>{az.nome}</span>
                        {isPilota && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            PILOTA
                          </span>
                        )}
                        <button
                          onClick={() => {
                            try {
                              localStorage.setItem('machinaflow_supporto_azienda_id', az.id)
                              localStorage.setItem('machinaflow_supporto_azienda_nome', az.nome)
                            } catch {}
                            router.push('/')
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                          title={`Accedi e visualizza l'ambiente di ${az.nome} in modalità supporto`}
                        >
                          <Headphones className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                          <span>Modalità Supporto</span>
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                        <span>ID: {az.id}</span>
                        {az.citta && <span className="text-slate-400">• {az.citta}</span>}
                        {az.partita_iva && <span className="text-slate-500">({az.partita_iva})</span>}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-200 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {az.email_titolare}
                      </div>
                      {az.telefono && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {az.telefono}
                        </div>
                      )}
                    </td>

                    {/* Statistiche & Risorse Dimensione Officina */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300" title="Centri di lavoro / macchine configurate">
                          <Cpu className="w-3.5 h-3.5 text-sky-400" />
                          <span><strong className="text-white">{numMacchine}</strong> macch.</span>
                        </div>
                        <span className="text-slate-700">|</span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300" title="Operatori e utenti registrati">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span><strong className="text-white">{numUtenti}</strong> ut.</span>
                        </div>
                        <span className="text-slate-700">|</span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300" title="Ordini di produzione (OdP)">
                          <Factory className="w-3.5 h-3.5 text-amber-400" />
                          <span><strong className="text-white">{numOdp}</strong> odp</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        az.stato === 'attiva'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        ● {az.stato.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3.5 text-center text-slate-400 font-mono">
                      {new Date(az.creato_il).toLocaleDateString('it-IT')}
                    </td>

                    {/* Azioni Rapide: Chiave, Sospendi/Riattiva, Cestino */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Chiave: Genera / Invia Link di Registrazione o Reset Password */}
                        <button
                          onClick={() => handleRigeneraLinkAccesso(az)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                          title="Genera e invia nuovo link di accesso / reimposta password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* 2. Toggle Disabilita / Riattiva Cliente */}
                        <button
                          onClick={() => handleToggleStatoAzienda(az)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            az.stato === 'attiva'
                              ? 'bg-slate-800/80 text-slate-300 hover:bg-amber-950/60 hover:text-amber-300 border-slate-700 hover:border-amber-600/50'
                              : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border-emerald-800'
                          }`}
                          title={az.stato === 'attiva' ? 'Sospendi accesso officina' : 'Riattiva officina'}
                        >
                          {az.stato === 'attiva' ? (
                            <PowerOff className="w-4 h-4 text-slate-400 hover:text-amber-400" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>

                        {/* 3. Cestino: Elimina definitivamente (con conferma modale protetta) */}
                        <button
                          onClick={() => setAziendaDaEliminare(az)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                          title={isPilota ? "Elimina officina pilota (richiede conferma)" : "Elimina definitivamente l'officina"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {aziendeFiltrate.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nessuna officina trovata con i filtri correnti.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODALE 1: CREA NUOVA OFFICINA (VUOTA E PULITA)
          ========================================================================= */}
      {modaleNuovaAzienda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                Crea Nuova Officina Meccanica
              </h2>
              <button
                onClick={() => setModaleNuovaAzienda(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreaAzienda} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl text-sky-200 leading-relaxed">
                <strong>✨ Officina Pulita:</strong> Il nuovo ambiente verrà generato completamente vuoto (senza macchine, articoli o ordini precaricati), pronto per essere configurato dal titolare.
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ragione Sociale / Nome Officina *
                </label>
                <input
                  type="text"
                  required
                  placeholder="es: Torneria Meccanica Rossi S.r.l."
                  value={formAzienda.nome}
                  onChange={(e) => setFormAzienda({ ...formAzienda, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Email del Titolare / Account Master *
                </label>
                <input
                  type="email"
                  required
                  placeholder="es: titolare@torneriarossi.it"
                  value={formAzienda.email_titolare}
                  onChange={(e) => setFormAzienda({ ...formAzienda, email_titolare: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Questa sarà l&apos;email con cui il titolare effettuerà il login gestionale.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Telefono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="es: +39 348 1234567"
                    value={formAzienda.telefono}
                    onChange={(e) => setFormAzienda({ ...formAzienda, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Città Sede
                  </label>
                  <input
                    type="text"
                    placeholder="es: Lucca, Brescia, Modena..."
                    value={formAzienda.citta}
                    onChange={(e) => setFormAzienda({ ...formAzienda, citta: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Partita IVA (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="es: IT01234567890"
                  value={formAzienda.partita_iva}
                  onChange={(e) => setFormAzienda({ ...formAzienda, partita_iva: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleNuovaAzienda(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={creazioneInCorso}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {creazioneInCorso ? (
                    <span>Creazione in corso...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crea Officina & Genera Invito</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE 2: INVITO GENERATO (COPIA LINK & WHATSAPP RAPIDO)
          ========================================================================= */}
      {invitoGenerato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Officina Creata con Successo!
                </h2>
              </div>
              <button
                onClick={() => setInvitoGenerato(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span className="text-xs text-slate-400 block">Ambiente generato per:</span>
                <span className="text-lg font-bold text-white block mt-0.5">
                  {invitoGenerato.aziendaNome}
                </span>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-400">Email di accesso impostata: </span>
                  <strong className="text-sky-400 font-mono">{invitoGenerato.email}</strong>
                </div>
              </div>

              {/* Box Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Link Diretto per Registrare la Password del Titolare:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitoGenerato.link}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copiaNegliAppunti(invitoGenerato.link)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                  >
                    {copiato ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pulsanti Condivisione */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    apriWhatsApp(invitoGenerato.link, invitoGenerato.aziendaNome, invitoGenerato.telefono)
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Invia Subito su WhatsApp</span>
                </button>

                <button
                  onClick={() => window.open(invitoGenerato.link, '_blank')}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Apri nel Browser</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInvitoGenerato(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE 3: CONFERMA ELIMINAZIONE OFFICINA (SICUREZZA SUPER ADMIN)
          ========================================================================= */}
      {aziendaDaEliminare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 bg-red-950/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Elimina Ambiente Officina</h3>
                <p className="text-xs text-red-300/80">Azione irreversibile</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-300">
              <p>
                Stai per eliminare definitivamente l&apos;officina:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white text-sm">{aziendaDaEliminare.nome}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {aziendaDaEliminare.id}</div>
                <div className="text-slate-400 mt-1">{aziendaDaEliminare.email_titolare}</div>
              </div>
              <p className="text-slate-400 text-[11px]">
                Questa operazione rimuoverà la registrazione dell&apos;officina e tutti gli inviti associati. L&apos;accesso per gli utenti di questa officina verrà revocato immediatamente.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={eliminazioneInCorso}
                onClick={() => setAziendaDaEliminare(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={eliminazioneInCorso}
                onClick={handleConfermaEliminazione}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {eliminazioneInCorso ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminazione...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Conferma Eliminazione</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
