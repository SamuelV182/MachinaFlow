'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Factory,
  Calendar,
  Clock,
  Printer,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Search,
  AlertTriangle,
  Hourglass
} from 'lucide-react'
import { OrdineProduzione, FaseOdP, Articolo } from '@/types/database'
import { SEED_ODP, SEED_ARTICOLI } from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

type OdPConFasi = OrdineProduzione & {
  fasi: FaseOdP[]
  articolo?: Articolo
}

export default function ProduzionePage() {
  const [odpList, setOdpList] = useState<OdPConFasi[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [termineRicerca, setTermineRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')

  useEffect(() => {
    const caricaDati = async () => {
      const parseSicuro = <T,>(chiave: string, fallback: T): T => {
        try {
          const item = localStorage.getItem(chiave)
          if (!item || item === 'undefined' || item === 'null') return fallback
          return JSON.parse(item) as T
        } catch {
          return fallback
        }
      }

      const articoliList = parseSicuro('machinaflow_articoli', SEED_ARTICOLI)
      setArticoli(articoliList)

      // Carica ordini sincronizzati da Supabase Cloud
      const odpCaricati = await syncService.getOrdiniProduzione()

      // Se c'erano ordini in localStorage mai sincronizzati, caricali su Supabase
      const locali = parseSicuro<(OrdineProduzione & { fasi: FaseOdP[] })[]>('machinaflow_odp', [])
      for (const loc of locali) {
        if (!odpCaricati.some((c) => c.id === loc.id)) {
          await syncService.salvaOrdineProduzione(loc)
          odpCaricati.push(loc)
        }
      }

      const arricchiti: OdPConFasi[] = odpCaricati.map((odp) => {
        // Controllo automatico di coerenza: se tutte le fasi risultano completate, l'OdP è completato
        const tutteCompletate = odp.fasi && odp.fasi.length > 0 && odp.fasi.every((f) => f.stato === 'completata')
        const almenoUnaInCorso = odp.fasi && odp.fasi.some((f) => f.stato === 'in_corso')
        const statoReale = tutteCompletate ? 'completato' : almenoUnaInCorso ? 'in_lavorazione' : odp.stato

        // Se lo stato calcolato differisce da quello salvato nel DB, allinealo
        if (statoReale !== odp.stato) {
          syncService.aggiornaStatoOdP(odp.id, statoReale, tutteCompletate ? odp.quantita_da_produrre : odp.quantita_prodotta)
        }

        return {
          ...odp,
          stato: statoReale,
          quantita_prodotta: tutteCompletate ? odp.quantita_da_produrre : odp.quantita_prodotta,
          articolo: articoliList.find((a) => a.id === odp.articolo_id)
        }
      })

      setOdpList(arricchiti)
    }

    caricaDati()
  }, [])

  const odpFiltrati = odpList.filter((o) => {
    const combaciaStato = filtroStato === 'tutti' || o.stato === filtroStato
    const combaciaTesto =
      o.codice_odp.toLowerCase().includes(termineRicerca.toLowerCase()) ||
      (o.articolo && o.articolo.descrizione.toLowerCase().includes(termineRicerca.toLowerCase())) ||
      (o.articolo && o.articolo.codice_articolo.toLowerCase().includes(termineRicerca.toLowerCase()))
    return combaciaStato && combaciaTesto
  })

  const calcolaProgresso = (fasi: FaseOdP[]) => {
    if (!fasi || fasi.length === 0) return 0
    const completate = fasi.filter((f) => f.stato === 'completata').length
    return Math.round((completate / fasi.length) * 100)
  }

  const getPrioritaBadge = (p: number) => {
    switch (p) {
      case 4:
        return { label: 'URGENTE', color: 'bg-rose-950 text-rose-300 border-rose-800' }
      case 3:
        return { label: 'ALTA', color: 'bg-amber-950 text-amber-300 border-amber-800' }
      case 2:
        return { label: 'MEDIA', color: 'bg-blue-950 text-blue-300 border-blue-800' }
      default:
        return { label: 'BASSA', color: 'bg-slate-800 text-slate-400 border-slate-700' }
    }
  }

  // Calcolo Puntualità per Capo Officina
  const calcolaPuntualitaOdP = (odp: OdPConFasi) => {
    if (odp.stato === 'completato') {
      return {
        label: 'COMPLETATO',
        color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        diffGiorni: 0,
        isRitardo: false
      }
    }

    if (!odp.data_fine_pianificata) return null

    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const scadenza = new Date(odp.data_fine_pianificata)
    scadenza.setHours(0, 0, 0, 0)

    const diffMs = scadenza.getTime() - oggi.getTime()
    const diffGiorni = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffGiorni < 0) {
      return {
        label: `RITARDO (${Math.abs(diffGiorni)} gg)`,
        color: 'bg-rose-950 text-rose-300 border-rose-800 font-black animate-pulse',
        diffGiorni,
        isRitardo: true
      }
    } else if (diffGiorni === 0) {
      return {
        label: 'SCADE OGGI',
        color: 'bg-amber-950 text-amber-300 border-amber-800 font-bold',
        diffGiorni: 0,
        isRitardo: false
      }
    } else if (diffGiorni <= 2) {
      return {
        label: `IN SCADENZA (${diffGiorni} gg)`,
        color: 'bg-amber-950 text-amber-300 border-amber-800',
        diffGiorni,
        isRitardo: false
      }
    }

    return {
      label: `NEI TEMPI (${diffGiorni} gg)`,
      color: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      diffGiorni,
      isRitardo: false
    }
  }

  return (
    <div className="space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Factory className="w-8 h-8 text-orange-500" />
            Ordini di Produzione (OdP / Commesse)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitora l'avanzamento delle fasi nei reparti e stampa la Scheda di Lavorazione con QR Code per l'officina.
          </p>
        </div>

        <Link
          href="/ordini"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all"
        >
          Vai agli Ordini Clienti
        </Link>
      </div>

      {/* Filtri e Ricerca */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'tutti', label: 'Tutti gli OdP' },
            { id: 'pianificato', label: 'Pianificati' },
            { id: 'in_lavorazione', label: 'In Lavorazione' },
            { id: 'completato', label: 'Completati' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroStato(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filtroStato === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={termineRicerca}
            onChange={(e) => setTermineRicerca(e.target.value)}
            placeholder="Cerca per codice OdP o articolo..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Elenco OdP */}
      <div className="space-y-4">
        {odpFiltrati.map((odp) => {
          const progresso = calcolaProgresso(odp.fasi)
          const priorita = getPrioritaBadge(odp.priorita)
          const puntualita = calcolaPuntualitaOdP(odp)
          const tempoTotaleMin = odp.fasi.reduce((a, b) => a + b.tempo_stimato_totale_min, 0)

          return (
            <div
              key={odp.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                puntualita?.isRitardo
                  ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-mono font-bold text-orange-400 bg-orange-950/80 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    {odp.codice_odp}
                  </span>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priorita.color}`}>
                    Priorità: {priorita.label}
                  </span>

                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      odp.stato === 'completato'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : odp.stato === 'in_lavorazione'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {odp.stato.replace('_', ' ')}
                  </span>

                  {puntualita && (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${puntualita.color}`}>
                      {puntualita.isRitardo ? <AlertTriangle className="w-3 h-3 text-rose-300" /> : <Clock className="w-3 h-3 text-current" />}
                      {puntualita.label}
                    </span>
                  )}

                  {odp.data_fine_pianificata && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Consegna: <strong className="text-slate-200">{odp.data_fine_pianificata}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">
                    {odp.articolo?.codice_articolo} — {odp.articolo?.descrizione}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Quantità da produrre: <strong className="text-orange-400 font-bold">{odp.quantita_da_produrre} {odp.articolo?.unita_misura}</strong> • Tempo Totale Stimato: {Math.round(tempoTotaleMin / 60)}h {tempoTotaleMin % 60}m
                  </p>
                </div>

                {/* Barra Avanzamento */}
                <div className="max-w-md space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">
                      Avanzamento Fasi: {odp.fasi.filter((f) => f.stato === 'completata').length} / {odp.fasi.length}
                    </span>
                    <span className={progresso === 100 ? 'text-emerald-400' : 'text-orange-400'}>
                      {progresso}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progresso === 100 ? 'bg-emerald-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Azioni */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                <Link
                  href={`/produzione/${odp.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all group"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa Scheda Lavoro (QR)</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )
        })}

        {odpFiltrati.length === 0 && (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Factory className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">Nessun ordine di produzione trovato</p>
            <p className="text-xs text-slate-500 mt-1">
              Vai nella sezione "Ordini Clienti" e clicca su "Genera Ordine di Produzione (OdP)".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
