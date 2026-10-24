'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Factory,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Boxes,
  ShoppingCart,
  QrCode,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Layers
} from 'lucide-react'
import {
  CentroLavoro,
  TipoProcesso,
  Articolo,
  OrdineProduzione,
  FaseOdP,
  OrdineCliente
} from '@/types/database'
import {
  SEED_CENTRI_LAVORO,
  SEED_ODP,
  SEED_ARTICOLI,
  SEED_ORDINI_CLIENTI
} from '@/lib/data-service'
import { syncService } from '@/lib/sync-service'

export default function DashboardPage() {
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi: FaseOdP[] })[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [ordiniClienti, setOrdiniClienti] = useState<OrdineCliente[]>([])

  // Orizzonte Temporale Selezionato (Oggi, Settimana, Mese, Trimestre, 6 Mesi)
  type OrizzonteTemporale = 'oggi' | 'settimana' | 'mese' | 'trimestre' | 'semestre'
  const [orizzonte, setOrizzonte] = useState<OrizzonteTemporale>('settimana')

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

      setCentriLavoro(parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO))
      setArticoli(parseSicuro('machinaflow_articoli', SEED_ARTICOLI))
      setOrdiniClienti(parseSicuro('machinaflow_ordini_clienti', SEED_ORDINI_CLIENTI))

      // Carica e sincronizza OdP da Supabase Cloud
      const odpSincronizzati = await syncService.getOrdiniProduzione()
      setOdpList(odpSincronizzati)

      // Inizializza seed Supabase se vuoto
      syncService.inizializzaDatabaseSeVuoto()
    }

    caricaDati()
  }, [])

  // =========================================================================
  // CALCOLO DINAMICO KPI & CARICO CENTRI DI LAVORO
  // =========================================================================
  const odpAttivi = odpList.filter((o) => o.stato !== 'completato')
  const odpCompletati = odpList.filter((o) => o.stato === 'completato')

  // Ore totali stimate vs effettive
  let oreTotaliStimate = 0
  let oreCompletate = 0

  odpAttivi.forEach((odp) => {
    odp.fasi.forEach((fase) => {
      oreTotaliStimate += Number(fase.tempo_stimato_totale_min) / 60
      if (fase.stato === 'completata') {
        oreCompletate += Number(fase.tempo_effettivo_min || fase.tempo_stimato_totale_min) / 60
      }
    })
  })

  // Moltiplicatori di giorni e capacità lavorativa per orizzonte temporale
  const infoOrizzonte = {
    oggi: { label: 'Oggi (Turno Giornaliero)', giorni: 1, fattore: 1, desc: 'Capacità calcolata su 1 giorno lavorativo' },
    settimana: { label: '7 Giorni (Settimanale)', giorni: 5, fattore: 5, desc: 'Capacità calcolata su 5 giorni lavorativi (1 settimana)' },
    mese: { label: '30 Giorni (Mensile)', giorni: 22, fattore: 22, desc: 'Capacità calcolata su 22 giorni lavorativi (1 mese)' },
    trimestre: { label: '3 Mesi (Trimestrale)', giorni: 66, fattore: 66, desc: 'Capacità calcolata su 66 giorni lavorativi (3 mesi)' },
    semestre: { label: '6 Mesi (Portafoglio Ordini)', giorni: 130, fattore: 130, desc: 'Capacità calcolata su 130 giorni lavorativi (6 mesi)' }
  }

  // Calcolo carico per macchina scalato sull'orizzonte temporale
  const carichiMacchine = centriLavoro.map((centro) => {
    let oreAssegnate = 0
    let fasiInCorso = 0

    odpAttivi.forEach((odp) => {
      odp.fasi.forEach((fase) => {
        if (fase.centro_lavoro_id === centro.id && fase.stato !== 'completata') {
          oreAssegnate += Number(fase.tempo_stimato_totale_min) / 60
          if (fase.stato === 'in_corso') fasiInCorso++
        }
      })
    })

    const giorniLavorativi = infoOrizzonte[orizzonte].giorni
    const capacitaPeriodoOre = centro.capacita_giornaliera_ore * giorniLavorativi
    const percentuale = capacitaPeriodoOre > 0 ? Math.round((oreAssegnate / capacitaPeriodoOre) * 100) : 0

    let stato = 'Disponibile'
    if (fasiInCorso > 0) stato = 'In Lavorazione'
    if (percentuale >= 90) stato = 'Sovraccarico'

    return {
      ...centro,
      caricoOre: Number(oreAssegnate.toFixed(1)),
      capacitaPeriodoOre,
      percentuale,
      stato
    }
  })

  // Articoli sotto scorta
  const countSottoScorta = articoli.filter((a) => a.giacenza_attuale < a.scorta_minima).length

  const kpis = [
    {
      titolo: 'Ordini di Produzione Attivi',
      valore: odpAttivi.length.toString(),
      sottoTesto: `${odpAttivi.filter((o) => o.stato === 'in_lavorazione').length} in lavorazione sui reparti`,
      icona: Factory,
      colore: 'text-orange-400',
      bg: 'bg-orange-950/40 border-orange-500/20'
    },
    {
      titolo: 'Carico Lavoro Stimato OdP',
      valore: `${Math.round(oreTotaliStimate)} h`,
      sottoTesto: `${Math.round(oreCompletate)} h avanzate (${oreTotaliStimate > 0 ? Math.round((oreCompletate / oreTotaliStimate) * 100) : 0}%)`,
      icona: Clock,
      colore: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-500/20'
    },
    {
      titolo: 'Materiali Sotto Scorta (MRP)',
      valore: countSottoScorta.toString(),
      sottoTesto: countSottoScorta > 0 ? 'Richiede emissione ordini acquisto' : 'Stock a livello ottimale',
      icona: AlertTriangle,
      colore: countSottoScorta > 0 ? 'text-rose-400' : 'text-emerald-400',
      bg: countSottoScorta > 0 ? 'bg-rose-950/40 border-rose-500/20' : 'bg-emerald-950/40 border-emerald-500/20'
    },
    {
      titolo: 'Commesse Chiuse con Successo',
      valore: odpCompletati.length.toString(),
      sottoTesto: 'Pronte per spedizione o a magazzino',
      icona: CheckCircle2,
      colore: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/20'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Intestazione Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Pianificazione & Controllo Produzione
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Panoramica in tempo reale del carico delle macchine, ordini clienti e avanzamento reparti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/processi-macchine"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            Nuovo Processo / Macchina
          </Link>
          <Link
            href="/ordini"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-600/30 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Nuovo Ordine Cliente
          </Link>
        </div>
      </div>

      {/* Barra Selettore Orizzonte Temporale (Timeline Strategica) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <span className="text-xs font-bold text-white block">Orizzonte di Capacità Produttiva:</span>
            <span className="text-[11px] text-slate-400">{infoOrizzonte[orizzonte].desc}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          {(['oggi', 'settimana', 'mese', 'trimestre', 'semestre'] as OrizzonteTemporale[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setOrizzonte(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                orizzonte === tab
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'oggi' && '⚡ Oggi'}
              {tab === 'settimana' && '📅 7 Giorni'}
              {tab === 'mese' && '🗓️ 30 Giorni'}
              {tab === 'trimestre' && '📊 3 Mesi'}
              {tab === 'semestre' && '🌐 6 Mesi'}
            </button>
          ))}
        </div>
      </div>

      {/* Griglia KPI Principali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icona
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${kpi.bg} backdrop-blur-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.titolo}
                </span>
                <div className={`p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${kpi.colore}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-white">{kpi.valore}</div>
                <div className="text-xs text-slate-400 mt-1">{kpi.sottoTesto}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sezione Carico Centri di Lavoro / Macchine */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-orange-500" />
              Carico Attuale dei Centri di Lavoro & Macchine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapporto tra ore di lavoro assegnate dagli OdP e capacità settimanale della macchina.
            </p>
          </div>
          <Link
            href="/processi-macchine"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300"
          >
            Gestisci Macchine & Capacità
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carichiMacchine.map((centro) => (
            <div
              key={centro.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/20">
                      {centro.codice}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-100 mt-1.5">{centro.nome}</h3>
                    <p className="text-xs text-slate-400">Reparto: {centro.reparto}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      centro.percentuale > 90
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : centro.percentuale > 75
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {centro.stato}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-400">
                    Ore Impegnate: <strong className="text-white">{centro.caricoOre}h</strong> / {centro.capacitaPeriodoOre}h
                  </span>
                  <span
                    className={`font-bold ${
                      centro.percentuale > 90
                        ? 'text-rose-400'
                        : centro.percentuale > 75
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {centro.percentuale}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      centro.percentuale > 90
                        ? 'bg-rose-500'
                        : centro.percentuale > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(centro.percentuale, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scorciatoie Modulari Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/articoli"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors text-sm">
              Articoli, Distinte & Cicli
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              BOM unitarie e sequenza fasi con tempi ciclo/setup.
            </p>
          </div>
        </Link>

        <Link
          href="/ordini"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors text-sm">
              Ordini Clienti (Vendite)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inserisci commesse e genera gli Ordini di Produzione in un click.
            </p>
          </div>
        </Link>

        <Link
          href="/mrp"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors text-sm">
              Fabbisogni MRP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calcolo automatico deficit e liste riordino ai fornitori.
            </p>
          </div>
        </Link>

        <Link
          href="/officina"
          className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
              Terminale Touch MES
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Avanzamento fasi a bordo macchina e lettura QR Code.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
