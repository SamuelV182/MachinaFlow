'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  ShoppingCart,
  Factory,
  Layers,
  Truck,
  QrCode,
  LayoutDashboard,
  Boxes,
  Cpu,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Printer,
  Calendar,
  Building2,
  Check,
  MousePointer2,
  FileText,
  BadgeAlert
} from 'lucide-react'

type StepType = 'ordini' | 'produzione' | 'mrp' | 'fornitori' | 'officina'

interface StepMeta {
  id: StepType
  titolo: string
  percorso: string
  navVoce: string
  durata: number
  descrizione: string
}

const PASSI: StepMeta[] = [
  {
    id: 'ordini',
    titolo: '1. Registra Ordine Cliente',
    percorso: '/ordini',
    navVoce: 'Ordini Clienti',
    durata: 7,
    descrizione: 'Inserimento commessa cliente, selezione disegno tecnico e quantità con conferma immediata.'
  },
  {
    id: 'produzione',
    titolo: '2. Genera OdP & Fasi',
    percorso: '/produzione',
    navVoce: 'Ordini di Produzione',
    durata: 6,
    descrizione: 'Creazione automatica OdP-2026-089, scomposizione ciclo standard (Tornio + Centro 5 Assi) e stampa Scheda QR.'
  },
  {
    id: 'mrp',
    titolo: '3. Fabbisogno Materiali (MRP)',
    percorso: '/mrp',
    navVoce: 'Fabbisogno Materiali (MRP)',
    durata: 7,
    descrizione: 'Il motore MRP rileva allarme rosso: barra Alluminio 6082 mancante. Blocco anti-doppio ordine.'
  },
  {
    id: 'fornitori',
    titolo: '4. Arrivo Barra da Fornitore',
    percorso: '/mrp (Arrivo DDT)',
    navVoce: 'Fabbisogno Materiali (MRP)',
    durata: 6,
    descrizione: 'Scarico DDT MetalAlluminio S.p.A., colata registrata e vincolo al lotto. Il semaforo diventa verde.'
  },
  {
    id: 'officina',
    titolo: '5. Terminale Officina Touch',
    percorso: '/officina',
    navVoce: 'Terminale Officina',
    durata: 12,
    descrizione: 'Bordo macchina: l’operatore vede la Fase OdP reale in testa alla coda, clicca AVVIA, la macchina lavora e clicca COMPLETA FASE registrando i pezzi conformi.'
  }
]

export function SimulatoreFlussoCompleto() {
  const [passoIdx, setPassoIdx] = useState(0)
  const [inPlay, setInPlay] = useState(true)
  const [tempo, setTempo] = useState(0)

  // Stati dinamici interni alle schermate
  const [ordineSalvato, setOrdineSalvato] = useState(false)
  const [odpAperto, setOdpAperto] = useState(false)
  const [materialeArrivato, setMaterialeArrivato] = useState(false)
  const [macchinaInLavoro, setMacchinaInLavoro] = useState(false)
  const [faseCompletata, setFaseCompletata] = useState(false)
  const [modaleCompletaVisibile, setModaleCompletaVisibile] = useState(false)
  const [pezziBuoni, setPezziBuoni] = useState(0)

  const passoCorrente = PASSI[passoIdx]

  // Timer per la riproduzione continua stile video
  // Usiamo un ref per passoIdx in modo che l'intervallo non venga ricreato continuamente ad ogni secondo
  const passoIdxRef = useRef(passoIdx)
  useEffect(() => {
    passoIdxRef.current = passoIdx
  }, [passoIdx])

  useEffect(() => {
    if (!inPlay) return

    const timer = setInterval(() => {
      setTempo((prevTempo) => {
        const currentIdx = passoIdxRef.current
        const durataCorrente = PASSI[currentIdx].durata

        if (prevTempo + 1 >= durataCorrente) {
          const nextIdx = currentIdx < PASSI.length - 1 ? currentIdx + 1 : 0
          setPassoIdx(nextIdx)
          return 0
        }
        return prevTempo + 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [inPlay])

  // Sequenza animata realistica per ciascuna schermata
  useEffect(() => {
    if (passoIdx === 0) {
      setOrdineSalvato(false)
      const t = setTimeout(() => setOrdineSalvato(true), 2800)
      return () => clearTimeout(t)
    }
    if (passoIdx === 1) {
      setOrdineSalvato(true)
      setOdpAperto(false)
      const t = setTimeout(() => setOdpAperto(true), 2200)
      return () => clearTimeout(t)
    }
    if (passoIdx === 2) {
      setMaterialeArrivato(false)
    }
    if (passoIdx === 3) {
      setMaterialeArrivato(false)
      const t = setTimeout(() => setMaterialeArrivato(true), 2400)
      return () => clearTimeout(t)
    }
    if (passoIdx === 4) {
      setMacchinaInLavoro(false)
      setModaleCompletaVisibile(false)
      setFaseCompletata(false)
      setPezziBuoni(0)

      // 1. Clic su "AVVIA LAVORAZIONE (PRIORITÀ N. 1)" dopo 2.5s
      const t1 = setTimeout(() => {
        setMacchinaInLavoro(true)
      }, 2500)

      // 2. Clic su "COMPLETA FASE" e apertura modale di chiusura dopo 7.5s
      const t2 = setTimeout(() => {
        setModaleCompletaVisibile(true)
      }, 7500)

      // 3. Conferma chiusura nella modale con 150 pz conformi dopo 10s
      const t3 = setTimeout(() => {
        setModaleCompletaVisibile(false)
        setFaseCompletata(true)
      }, 10200)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
  }, [passoIdx])

  // Incremento contatore pezzi durante l'officina
  useEffect(() => {
    if (passoIdx === 4 && macchinaInLavoro) {
      const interval = setInterval(() => {
        setPezziBuoni((p) => (p < 36 ? p + 1 : p))
      }, 250)
      return () => clearInterval(interval)
    } else {
      setPezziBuoni(0)
    }
  }, [passoIdx, macchinaInLavoro])

  const riavvia = () => {
    setPassoIdx(0)
    setTempo(0)
    setOrdineSalvato(false)
    setOdpAperto(false)
    setMaterialeArrivato(false)
    setMacchinaInLavoro(false)
    setFaseCompletata(false)
    setModaleCompletaVisibile(false)
    setPezziBuoni(0)
    setInPlay(true)
  }

  return (
    <div className="relative mx-auto max-w-6xl w-full">
      {/* Header Presentazione */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>Tour Guidato nel Gestionale Reale</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Vivi l&apos;esperienza autentica di MachinaFlow
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Nessuna slide o screenshot finto: guarda come si naviga realmente tra le schermate ufficiali per evadere una commessa meccanica.
          </p>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0 shadow-lg">
          <button
            onClick={() => setInPlay(!inPlay)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            {inPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{inPlay ? 'Pausa' : 'Avvia Video'}</span>
          </button>

          <button
            onClick={riavvia}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Riavvia il tour"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs di navigazione rapida per saltare da una pagina reale all'altra */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {PASSI.map((step, idx) => {
          const attivo = passoIdx === idx
          const completato = passoIdx > idx

          return (
            <button
              key={step.id}
              onClick={() => {
                setPassoIdx(idx)
                setTempo(0)
              }}
              className={`p-2.5 sm:p-3 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
                attivo
                  ? 'bg-orange-500/10 border-orange-500/60 text-white shadow-lg shadow-orange-500/10'
                  : completato
                  ? 'bg-slate-900/90 border-emerald-500/30 text-slate-300'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-orange-400 mb-1">
                <span>{step.id.toUpperCase()}</span>
                {completato && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="font-bold text-xs truncate text-slate-100">{step.titolo}</div>
              <div className="text-[10px] text-slate-500 truncate font-mono">{step.percorso}</div>

              {attivo && inPlay && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                  <div
                    className="h-full bg-orange-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${((tempo + 1) / step.durata) * 100}%` }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* =================================================================== */}
      {/* VERA FINESTRA APPLICATIVA (STESSO APP-SHELL E SIDEBAR DI MACHINAROW) */}
      {/* =================================================================== */}
      <div className="rounded-3xl bg-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col min-h-[580px] sm:min-h-[620px]">
        {/* Barra del Browser con URL dinamico */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <div className="ml-3 hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
              <span className="text-emerald-400">https://</span>
              <span>app.machinaflow.it</span>
              <span className="text-orange-400 font-bold">{passoCorrente.percorso}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold">
              OFFICINA MECCANICA PRO
            </span>
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center">
              SV
            </div>
          </div>
        </div>

        {/* Corpo Software: Sidebar Reale a Sinistra + Schermata Reale a Destra */}
        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR UFFICIALE MACHINAFPOW (fedele al 100%) */}
          <aside className="w-14 sm:w-56 bg-slate-950 border-r border-slate-800 p-2 sm:p-3 flex flex-col justify-between shrink-0 select-none">
            <div className="space-y-4">
              {/* Logo Sidebar */}
              <div className="hidden sm:flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-black text-sm">
                  M
                </div>
                <div>
                  <div className="text-xs font-black text-white tracking-wide">MACHINAFLOW</div>
                  <div className="text-[9px] font-mono text-slate-400">MES &amp; PCP v2.4</div>
                </div>
              </div>

              {/* Voci di Menu con evidenziazione automatica della pagina attiva */}
              <nav className="space-y-1">
                {[
                  { name: 'Dashboard Carico', icon: LayoutDashboard, path: '/' },
                  { name: 'Ordini di Produzione', icon: Factory, path: '/produzione', key: 'produzione' },
                  { name: 'Ordini Clienti', icon: ShoppingCart, path: '/ordini', key: 'ordini' },
                  { name: 'Fabbisogno (MRP)', icon: Layers, path: '/mrp', key: 'mrp' },
                  { name: 'Articoli & BOM', icon: Boxes, path: '/articoli' },
                  { name: 'Macchine & Centri', icon: Cpu, path: '/processi-macchine' },
                  { name: 'Terminale Officina', icon: QrCode, path: '/officina', key: 'officina' },
                  { name: 'Spedizioni & DDT', icon: Truck, path: '/spedizioni' }
                ].map((item) => {
                  const Icon = item.icon
                  const isItemAttivo =
                    (passoCorrente.id === 'ordini' && item.key === 'ordini') ||
                    (passoCorrente.id === 'produzione' && item.key === 'produzione') ||
                    ((passoCorrente.id === 'mrp' || passoCorrente.id === 'fornitori') && item.key === 'mrp') ||
                    (passoCorrente.id === 'officina' && item.key === 'officina')

                  return (
                    <div
                      key={item.name}
                      className={`flex items-center gap-2.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isItemAttivo
                          ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 font-black'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline truncate">{item.name}</span>
                    </div>
                  )
                })}
              </nav>
            </div>

            <div className="hidden sm:block p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-mono">
              <div className="text-emerald-400 font-bold">● CLOUD ENGINE ATTIVO</div>
              <div>Tenant: Officina Rossi</div>
            </div>
          </aside>

          {/* CONTENUTO REALE DELLA PAGINA */}
          <main className="flex-1 bg-slate-950 p-3 sm:p-5 overflow-y-auto flex flex-col justify-between">
            
            {/* ============================================================= */}
            {/* 1. PAGINA REALE: ORDINI CLIENTI (/ordini)                      */}
            {/* ============================================================= */}
            {passoIdx === 0 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Header pagina reale */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-orange-400" />
                      <span>Gestione Ordini Clienti</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Inserimento commesse, specifiche tolleranze e generazione tempestiva OdP
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Cerca commessa...</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-orange-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nuovo Ordine</span>
                    </div>
                  </div>
                </div>

                {/* Form Reale Modale/Scheda Compilata */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">
                      Scheda Nuova Commessa #2026-042
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      STATO: BOZZA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Cliente Intestatario</label>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold">
                        Meccanica Bolognese S.r.l.
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Codice Articolo / Disegno</label>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold">
                        FL-340 Flangia Pompa Idraulica
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Quantità &amp; Consegna Richiesta</label>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-orange-400 font-bold font-mono">
                        150 PZ • 28/11/2026
                      </div>
                    </div>
                  </div>

                  {/* Barra azione con cursore simulato */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Distinta Base &amp; Ciclo collegati in automatico dall&apos;anagrafica articolo.
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                      ordineSalvato
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/25'
                    }`}>
                      {ordineSalvato ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ORDINE CONFERMATO &amp; SALVATO</span>
                        </>
                      ) : (
                        <>
                          <MousePointer2 className="w-3.5 h-3.5 animate-bounce" />
                          <span>Salva Commessa</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabella Storico Ordini (uguale alla schermata vera) */}
                <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Codice</th>
                        <th className="p-2.5">Cliente</th>
                        <th className="p-2.5">Articolo</th>
                        <th className="p-2.5">Q.tà</th>
                        <th className="p-2.5">Stato Produzione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr className="bg-orange-500/10 font-bold">
                        <td className="p-2.5 text-orange-400 font-mono">ORD-2026-042</td>
                        <td className="p-2.5 text-white">Meccanica Bolognese</td>
                        <td className="p-2.5 text-white">FL-340 Flangia Pompa</td>
                        <td className="p-2.5 font-mono">150 pz</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pronto per OdP
                          </span>
                        </td>
                      </tr>
                      <tr className="text-slate-400">
                        <td className="p-2.5 font-mono">ORD-2026-041</td>
                        <td className="p-2.5">OleoDynamic Spa</td>
                        <td className="p-2.5">Albero Scanalato Ø45</td>
                        <td className="p-2.5 font-mono">80 pz</td>
                        <td className="p-2.5 text-emerald-400">In Lavorazione</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 2. PAGINA REALE: ORDINI DI PRODUZIONE (/produzione)            */}
            {/* ============================================================= */}
            {passoIdx === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <Factory className="w-5 h-5 text-orange-400" />
                      <span>Ordini di Produzione (OdP)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Pianificazione delle commesse in fabbrica e schede lavoro per il capo officina
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
                      ODP-2026-089 GENERATO
                    </span>
                  </div>
                </div>

                {/* Scheda OdP Dettaglio con Fasi Ciclo */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">FL-340 Flangia Pompa Idraulica • 150 Pezzi</div>
                      <div className="text-[10px] text-slate-400 font-mono">Riferimento: ORD-2026-042 • Consegna: 28/11/2026</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200">
                      <Printer className="w-3.5 h-3.5 text-orange-400" />
                      <span>Scheda A4 con QR Code</span>
                    </div>
                  </div>

                  {/* Fasi di Lavorazione del ciclo */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Fasi Ciclo Operativo Standard:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">FASE 10</div>
                          <div className="font-bold text-white">Taglio Seghetto</div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">45 min</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/40 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-orange-400 font-mono font-bold">FASE 20</div>
                          <div className="font-bold text-white">Tornio CNC Doosan Lynx</div>
                        </div>
                        <span className="text-[10px] font-mono text-orange-400 font-bold">3h 20m</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">FASE 30</div>
                          <div className="font-bold text-white">Centro 5 Assi Mazak</div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">2h 15m</span>
                      </div>
                    </div>
                  </div>

                  {/* Allarme Materiale */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>L&apos;OdP richiede barre di alluminio. Verifica fabbisogni con il motore MRP.</span>
                    </div>
                    <span className="text-xs font-bold text-orange-400 underline flex items-center gap-1 cursor-pointer">
                      <span>Apri MRP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 3. PAGINA REALE: FABBISOGNO MRP (/mrp)                         */}
            {/* ============================================================= */}
            {passoIdx === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-orange-400" />
                      <span>Fabbisogno Materiali (MRP)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Analisi scorte a magazzino, impegni futuri e prevenzione blocchi di linea
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                      <BadgeAlert className="w-3.5 h-3.5" />
                      <span>1 MATERIALE CRITICO</span>
                    </span>
                  </div>
                </div>

                {/* Tabella MRP Ufficiale con evidenziazione rossa */}
                <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Materiale Richiesto</th>
                        <th className="p-2.5">Fabbisogno OdP</th>
                        <th className="p-2.5">Giacenza a Terra</th>
                        <th className="p-2.5">Mancante Effettivo</th>
                        <th className="p-2.5">Azione Rapida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {/* Riga Rossa Mancante */}
                      <tr className="bg-red-500/15 border-l-4 border-red-500 font-bold">
                        <td className="p-2.5">
                          <div className="text-white">Barra Alluminio Anticorodal 6082 Ø60mm</div>
                          <div className="text-[10px] text-slate-400 font-normal">Per: OdP-2026-089 (150 flange)</div>
                        </td>
                        <td className="p-2.5 font-mono text-white">12 Barre (36 m)</td>
                        <td className="p-2.5 font-mono text-red-400">2 Barre in magazzino</td>
                        <td className="p-2.5 font-mono text-red-400 font-black">-10 Barre mancanti</td>
                        <td className="p-2.5">
                          <div className="px-2.5 py-1 rounded-lg bg-orange-500 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1 shadow-sm">
                            <Plus className="w-3 h-3" />
                            <span>Ordina a Fornitore</span>
                          </div>
                        </td>
                      </tr>

                      {/* Riga Verde Conforme */}
                      <tr className="text-slate-400">
                        <td className="p-2.5">
                          <div className="text-slate-200">Inserto Tornitura Sandvik CNMG 120408</div>
                        </td>
                        <td className="p-2.5 font-mono">5 pz</td>
                        <td className="p-2.5 font-mono text-emerald-400">24 pz disponibili</td>
                        <td className="p-2.5 text-emerald-400 font-mono">0 pz (Coperto)</td>
                        <td className="p-2.5">
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Scorta Sufficiente
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span>
                    Il sistema calcola il fabbisogno reale e previene il doppio acquisto per lo stesso lotto.
                  </span>
                  <span className="text-orange-400 font-mono text-[11px] font-bold">ORDINE FORNITORE EMESSO →</span>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 4. ARRIVO FORNITORE & SCARICO DDT                             */}
            {/* ============================================================= */}
            {passoIdx === 3 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-400" />
                      <span>Ricevimento Merci &amp; DDT Fornitori</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Carico a magazzino, tracciabilità colata e assegnazione immediata all&apos;OdP
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                      materialeArrivato
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {materialeArrivato ? 'CARICO EFFETTUATO ✓' : 'VERIFICA DDT IN CORSO...'}
                    </span>
                  </div>
                </div>

                {/* Scheda Ricezione DDT Fornitore */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">FORNITORE</span>
                      <div className="font-bold text-white">MetalAlluminio S.p.A.</div>
                      <div className="text-[10px] text-slate-400">DDT n. 84920 del 10/11/2026</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">MATERIALE SCARICATO</span>
                      <div className="font-bold text-emerald-400">10 Barre Alluminio 6082 Ø60</div>
                      <div className="text-[10px] text-slate-400">Certificato 3.1: Colata #K9942</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block">VINCOLO PRODUZIONE</span>
                      <div className="font-bold text-orange-400 font-mono">Prenotato per OdP-2026-089</div>
                      <div className="text-[10px] text-emerald-400">Fabbisogno coperto al 100%</div>
                    </div>
                  </div>

                  {/* Barra Semaforo OdP */}
                  <div className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    materialeArrivato
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full ${materialeArrivato ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-amber-400'}`} />
                      <span className="text-xs font-bold">
                        {materialeArrivato
                          ? 'SEMAFORO VERDE: Le 12 barre sono a terra. La commessa entra subito nella coda del Centro Tornitura!'
                          : 'Registrazione del lotto di colata...'}
                      </span>
                    </div>

                    {materialeArrivato && (
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        OFFICINA SBLOCCATA →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 5. PAGINA REALE: TERMINALE OFFICINA (/officina)                */}
            {/* ============================================================= */}
            {passoIdx === 4 && (
              <div className="space-y-4 animate-in fade-in duration-300 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-orange-400" />
                      <span>Terminale Officina • Postazione Tornio Doosan Lynx</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Coda di lavoro a bordo macchina con blocco sequenziale e dichiarazione lotti
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>TORNIO 01: PRONTO</span>
                    </span>
                  </div>
                </div>

                {/* VERA E PROPRIA CARD DELLA FASE ODP REALE DI MACHINAROW */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative ${
                  faseCompletata
                    ? 'bg-slate-900/50 border-emerald-500/50'
                    : macchinaInLavoro
                    ? 'bg-slate-900 border-blue-500/60 shadow-xl shadow-blue-500/10'
                    : 'bg-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                }`}>
                  {/* Intestazione della Card Fase */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-500/30">
                          ODP-2026-089
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Seq. 20
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-red-950/60 border-red-800 text-red-300">
                          🔥 URGENTE
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-white leading-tight">
                        Tornitura Sgrossatura e Finitura Esterna
                      </h2>
                    </div>

                    {/* Badge Stato Lavorazione fedele */}
                    <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full whitespace-nowrap transition-all ${
                      faseCompletata
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : macchinaInLavoro
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {faseCompletata
                        ? 'COMPLETATA'
                        : macchinaInLavoro
                        ? 'IN MACCHINA'
                        : 'PRONTA DA AVVIARE'}
                    </span>
                  </div>

                  {/* Dati Articolo, Macchina e Lotto identici alla schermata reale */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400">Articolo:</span>
                      <strong className="text-white text-right truncate">
                        FL-340 — Flangia Pompa Idraulica
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Quantità Lotto:</span>
                      <strong className="text-orange-400 font-bold text-sm">
                        150 PZ
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Centro / Macchina:</span>
                      <span className="font-semibold text-slate-200">
                        T01 - Tornio CNC Doosan Lynx 2100
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tempo Stimato Totale:</span>
                      <span className="font-bold text-slate-200">200 minuti (3h 20m)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-400">Stato Materiale monte:</span>
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pronto al banco (12 barre scaricate con DDT)
                      </span>
                    </div>
                  </div>

                  {/* PULSANTI DI AZIONE TOUCH REALI */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* STATO 1: AVVIA LAVORAZIONE (PRIORITÀ N. 1) */}
                      {!macchinaInLavoro && !faseCompletata && (
                        <div className="col-span-2 py-4 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40 transition-all">
                          <Play className="w-5 h-5 fill-current" />
                          <span>AVVIA LAVORAZIONE (PRIORITÀ N. 1)</span>
                        </div>
                      )}

                      {/* STATO 2: IN CORSO (COMPLETA FASE + SOSPENDI) */}
                      {macchinaInLavoro && !faseCompletata && (
                        <>
                          <div className="py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>COMPLETA FASE</span>
                          </div>

                          <div className="py-3.5 px-4 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5">
                            <Pause className="w-4 h-4" />
                            <span>Sospendi</span>
                          </div>
                        </>
                      )}

                      {/* STATO 3: COMPLETATA */}
                      {faseCompletata && (
                        <div className="col-span-2 py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Fase conclusa alle 16:42 • 150 pz conformi avanzati alla Fase 30 (Centro Mazak)
                          </span>
                          <span className="text-[10px] text-slate-500 underline">
                            Riapri
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* MODALE REALE DI CHIUSURA FASE CHE COMPARE SULLO SCHERMO */}
                {modaleCompletaVisibile && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <h5 className="text-sm font-bold text-white">Registra Chiusura Lavorazione</h5>
                        </div>
                        <span className="text-xs text-slate-400">✕</span>
                      </div>

                      <div className="p-4 space-y-3 text-xs">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ordine / Fase:</span>
                            <span className="font-mono font-bold text-white">ODP-2026-089 • Seq. 20</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Lotto Teorico Previsto:</span>
                            <span className="font-bold text-orange-400 font-mono">150 PZ</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-emerald-400 mb-1 text-[11px]">
                              Pezzi Buoni Conformi *
                            </label>
                            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500 text-sm font-bold text-emerald-400 font-mono">
                              150
                            </div>
                            <span className="text-[9px] text-slate-500 mt-0.5 block">Avanzano al Centro Mazak</span>
                          </div>

                          <div>
                            <label className="block font-semibold text-rose-400 mb-1 text-[11px]">
                              Pezzi Scartati
                            </label>
                            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-slate-400 font-mono">
                              0
                            </div>
                            <span className="text-[9px] text-slate-500 mt-0.5 block">Zero scarti rilevati</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                          <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30">
                            <Check className="w-3.5 h-3.5" />
                            <span>Conferma Chiusura</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Didascalia e navigazione in fondo alla finestra */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                <span>
                  <strong>Cosa accade qui:</strong> {passoCorrente.descrizione}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-slate-500">
                  Step {passoIdx + 1} di {PASSI.length}
                </span>

                {passoIdx < PASSI.length - 1 ? (
                  <button
                    onClick={() => {
                      setPassoIdx((p) => p + 1)
                      setTempo(0)
                    }}
                    className="text-orange-400 hover:text-orange-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Passo Successivo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={riavvia}
                    className="text-orange-400 hover:text-orange-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ricomincia</span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
