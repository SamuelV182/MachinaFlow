'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Azienda } from '@/types/database'

export default function ImpostazioniAziendaPage() {
  const supabase = createClient()
  const [caricamento, setCaricamento] = useState(true)
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false)
  const [messaggioSuccesso, setMessaggioSuccesso] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  const [azienda, setAzienda] = useState<Azienda | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email_titolare: '',
    telefono: '',
    partita_iva: '',
    codice_fiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    logo_url: '',
    note_ddt_predefinite: ''
  })

  // Precarica subito dalla cache locale per render istantaneo (< 0.05s)
  useEffect(() => {
    try {
      const azCache = localStorage.getItem('machinaflow_dati_azienda_cache')
      if (azCache) {
        const parsed = JSON.parse(azCache)
        setAzienda(parsed)
        setForm({
          nome: parsed.nome || '',
          email_titolare: parsed.email_titolare || '',
          telefono: parsed.telefono || '',
          partita_iva: parsed.partita_iva || '',
          codice_fiscale: parsed.codice_fiscale || '',
          indirizzo: parsed.indirizzo || '',
          citta: parsed.citta || '',
          cap: parsed.cap || '',
          provincia: parsed.provincia || '',
          logo_url: parsed.logo_url || '',
          note_ddt_predefinite: parsed.note_ddt_predefinite || ''
        })
        setCaricamento(false)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const caricaDatiAzienda = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          setCaricamento(false)
          return
        }

        // 1. Recupera profilo per identificare azienda_id
        const { data: profilo } = await supabase
          .from('profili_utenti')
          .select('azienda_id, ruolo')
          .eq('id', user.id)
          .single()

        let targetAziendaId = profilo?.azienda_id || 'az-pilota-01'

        // Controlla se c'è modalità supporto attiva in localStorage (per Super Admin)
        try {
          const azSupporto = localStorage.getItem('machinaflow_supporto_azienda_id')
          if (azSupporto) targetAziendaId = azSupporto
        } catch {}

        // 2. Recupera record azienda dal database
        const { data: azData, error: azErr } = await supabase
          .from('aziende')
          .select('*')
          .eq('id', targetAziendaId)
          .single()

        if (azErr) throw azErr

        if (azData) {
          setAzienda(azData as Azienda)
          const dati = {
            nome: azData.nome || '',
            email_titolare: azData.email_titolare || '',
            telefono: azData.telefono || '',
            partita_iva: azData.partita_iva || '',
            codice_fiscale: azData.codice_fiscale || '',
            indirizzo: azData.indirizzo || '',
            citta: azData.citta || '',
            cap: azData.cap || '',
            provincia: azData.provincia || '',
            logo_url: azData.logo_url || '',
            note_ddt_predefinite: azData.note_ddt_predefinite || ''
          }
          setForm(dati)
          try {
            localStorage.setItem('machinaflow_dati_azienda_cache', JSON.stringify({ ...azData, ...dati }))
          } catch {}
        }
      } catch (err: any) {
        console.error('Errore caricamento dati azienda:', err)
      } finally {
        setCaricamento(false)
      }
    }

    caricaDatiAzienda()
  }, [supabase])

  const handleSalva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!azienda) return

    setSalvataggioInCorso(true)
    setErrore(null)
    setMessaggioSuccesso(null)

    try {
      const { error: errUpdate } = await supabase
        .from('aziende')
        .update({
          nome: form.nome.trim(),
          telefono: form.telefono.trim() || null,
          partita_iva: form.partita_iva.trim() || null,
          codice_fiscale: form.codice_fiscale.trim() || null,
          indirizzo: form.indirizzo.trim() || null,
          citta: form.citta.trim() || null,
          cap: form.cap.trim() || null,
          provincia: form.provincia.trim().toUpperCase() || null,
          logo_url: form.logo_url.trim() || null,
          note_ddt_predefinite: form.note_ddt_predefinite.trim() || null
        })
        .eq('id', azienda.id)

      if (errUpdate) throw errUpdate

      setMessaggioSuccesso('Dati aziendali e logo aggiornati con successo! I nuovi dati appariranno immediatamente su tutti i DDT e schede di lavorazione.')
      setTimeout(() => setMessaggioSuccesso(null), 5000)
    } catch (err: any) {
      setErrore(`Errore salvataggio: ${err.message || 'Riprova più tardi'}`)
    } finally {
      setSalvataggioInCorso(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
          <Building2 className="w-4 h-4" />
          <span>Configurazione Fabbrica &bull; Intestazione Fiscale</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Dati Aziendali &amp; Personalizzazione Documenti (DDT)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Queste informazioni appariranno automaticamente nell&apos;intestazione dei tuoi Documenti di Trasporto (DDT di vendita ed invio conto terzi) e nelle Schede Lavoro A4.
        </p>
      </div>

      {messaggioSuccesso && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{messaggioSuccesso}</span>
        </div>
      )}

      {errore && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errore}</span>
        </div>
      )}

      {caricamento ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Caricamento dati aziendali in corso...
        </div>
      ) : (
        <form onSubmit={handleSalva} className="space-y-6">
          {/* Box 1: Anagrafica Fiscale */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              Ragione Sociale e Riferimenti Fiscali
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Ragione Sociale Ufficiale *
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="es. Torneria Meccanica Rossi S.r.l."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Partita IVA
                </label>
                <input
                  type="text"
                  value={form.partita_iva}
                  onChange={(e) => setForm({ ...form, partita_iva: e.target.value })}
                  placeholder="es. IT01234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  value={form.codice_fiscale}
                  onChange={(e) => setForm({ ...form, codice_fiscale: e.target.value })}
                  placeholder="es. 01234567890 o C.F."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Box 2: Indirizzo Stabilimento / Mittente */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Sede di Partenza Merci (Luogo di Partenza DDT)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">
                  Indirizzo e Numero Civico
                </label>
                <input
                  type="text"
                  value={form.indirizzo}
                  onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                  placeholder="es. Via dell'Artigianato 12"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Città
                </label>
                <input
                  type="text"
                  value={form.citta}
                  onChange={(e) => setForm({ ...form, citta: e.target.value })}
                  placeholder="es. Brescia"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  CAP
                </label>
                <input
                  type="text"
                  value={form.cap}
                  onChange={(e) => setForm({ ...form, cap: e.target.value })}
                  placeholder="es. 25100"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Provincia (Sigla)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.provincia}
                  onChange={(e) => setForm({ ...form, provincia: e.target.value.toUpperCase() })}
                  placeholder="es. BS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Box 3: Logo Aziendale & Note DDT */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Logo Aziendale &amp; Note Standard per il Trasportatore
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  URL Logo Aziendale (Immagine Web PNG / JPG trasparente)
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://mio-sito.it/logo-officina.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono text-xs"
                  />
                  {form.logo_url && (
                    <div className="w-12 h-10 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Il logo verrà stampato automaticamente nell&apos;angolo in alto a sinistra di tutte le bolle di trasporto A4.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Note Legali / Condizioni di Trasporto Predefinite DDT
                </label>
                <textarea
                  rows={3}
                  value={form.note_ddt_predefinite}
                  onChange={(e) => setForm({ ...form, note_ddt_predefinite: e.target.value })}
                  placeholder="es. Merce viaggia a rischio e pericolo del committente anche se venduta franco destino. Eventuali contestazioni entro 8 giorni dal ricevimento."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Barra Azioni */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              Modifiche immediatamente visibili su tutti i terminali e report.
            </div>

            <button
              type="submit"
              disabled={salvataggioInCorso}
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{salvataggioInCorso ? 'Salvataggio...' : 'Salva Impostazioni'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
