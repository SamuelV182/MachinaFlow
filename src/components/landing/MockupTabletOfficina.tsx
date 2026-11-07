'use client'

import { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Clock,
  Flame,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react'

export function MockupTabletOfficina() {
  const [faseStato, setFaseStato] = useState<'non_iniziata' | 'in_corso' | 'completata'>('in_corso')
  const [minutiTrascorsi, setMinutiTrascorsi] = useState(24)
  const [pezziBuoni, setPezziBuoni] = useState(48)
  const [scarti, setScarti] = useState(1)
  const [mostraNotifica, setMostraNotifica] = useState(false)

  // Piccolo timer interattivo per dare vita al tablet
  useEffect(() => {
    if (faseStato !== 'in_corso') return
    const timer = setInterval(() => {
      setMinutiTrascorsi((prev) => prev + 1)
    }, 6000)
    return () => clearInterval(timer)
  }, [faseStato])

  const handleAvvia = () => {
    setFaseStato('in_corso')
    setMostraNotifica(true)
    setTimeout(() => setMostraNotifica(false), 2500)
  }

  const handleSospendi = () => {
    setFaseStato('non_iniziata')
  }

  const handleCompleta = () => {
    setFaseStato('completata')
    setPezziBuoni(50)
    setMostraNotifica(true)
    setTimeout(() => setMostraNotifica(false), 2500)
  }

  return (
    <div className="relative mx-auto max-w-xl w-full">
      {/* Cornice Tablet Industriale con scocca rugged e finto bordo metallo */}
      <div className="rounded-[2.5rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-3 sm:p-4 shadow-2xl shadow-orange-500/10 border border-slate-600/60 relative">
        {/* Fotocamera tablet / sensore superiore */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
        </div>

        {/* Schermo Tablet Touch (16:10 ratio feel) */}
        <div className="rounded-[2rem] bg-slate-950 border border-slate-800 overflow-hidden text-slate-100 flex flex-col select-none">
          {/* Header Bordo Macchina */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-mono font-bold text-sm">
                T01
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm sm:text-base tracking-wide">Tornio CNC Doosan Lynx</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    ONLINE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Postazione Kiosk Attiva • PIN: 123456</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-300">10:42</div>
              <div className="text-[10px] text-orange-400 font-semibold">Turno Mattina</div>
            </div>
          </div>

          {/* Scheda Lavoro Attiva */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Banner OdP & Articolo */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-orange-500 text-slate-950 font-black text-xs font-mono">
                    ODP-2026-088
                  </span>
                  <span className="text-xs text-slate-400">Priorità 1 (Alta)</span>
                </div>
                <div className="font-bold text-white text-sm mt-1">Albero di Trasmissione C45 Rettificato</div>
                <div className="text-xs text-slate-400 font-mono">Cod. ALB-TRA-45-Z28 • Lotto 50 pz</div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80 shrink-0">
                <QrCode className="w-8 h-8 text-orange-400" />
                <div className="text-[11px]">
                  <div className="text-slate-400">Scheda A4</div>
                  <div className="text-white font-mono font-bold">Lotto Verificato</div>
                </div>
              </div>
            </div>

            {/* Fase Attuale in Esecuzione */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center font-mono">
                    20
                  </span>
                  <span className="font-bold text-white text-sm">Tornitura Esterna & Filettatura M24</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                  <span>{minutiTrascorsi} min reali</span>
                </div>
              </div>

              {/* Contatori Pezzi & Scarti */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Obiettivo</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">50 pz</div>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Pezzi Buoni</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">{pezziBuoni}</div>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-rose-900/40">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Scarti</div>
                  <div className="text-lg font-black text-rose-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {scarti}
                  </div>
                </div>
              </div>

              {/* Bottoni Touch Giganti Bordo Macchina */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={handleAvvia}
                  className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    faseStato === 'in_corso'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Avvia</span>
                </button>

                <button
                  onClick={handleSospendi}
                  className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    faseStato === 'non_iniziata'
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Pause className="w-4 h-4" />
                  <span>Pausa</span>
                </button>

                <button
                  onClick={handleCompleta}
                  className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                    faseStato === 'completata'
                      ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                      : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fine</span>
                </button>
              </div>
            </div>

            {/* Feedback interattivo */}
            {mostraNotifica && (
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold text-center animate-in fade-in zoom-in-95">
                ✓ Aggiornamento sincronizzato sul Cloud e nel gestionale!
              </div>
            )}
          </div>

          {/* Footer Kiosk */}
          <div className="bg-slate-900/60 border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Modalità Touch con Guanti
            </span>
            <span className="font-mono text-slate-500">ID: DOOSAN-01</span>
          </div>
        </div>
      </div>
    </div>
  )
}
