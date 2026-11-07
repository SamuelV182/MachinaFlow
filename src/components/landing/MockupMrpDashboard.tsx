'use client'

import { useState } from 'react'
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingDown,
  Clock,
  Building2,
  Truck
} from 'lucide-react'

export function MockupMrpDashboard() {
  const [ordinato, setOrdinato] = useState(false)

  return (
    <div className="relative mx-auto max-w-2xl w-full">
      {/* Finestra Browser Desktop Moderna */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-orange-500/10 overflow-hidden text-slate-100 select-none">
        {/* Barra del Browser con controlli finestra */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
              app.machinaflow.com/mrp • Calcolo Fabbisogni & Acquisti
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-orange-400 border border-orange-500/30">
            <span>ANTI-DOPPIO ORDINE ATTIVO</span>
          </div>
        </div>

        {/* Contenuto MRP */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Matrice Fabbisogni & Acquisti Materie Prime
              </h4>
              <p className="text-xs text-slate-400">
                Incrocio automatico tra OdP in officina, scorte minime e ordini fornitori aperti.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                1 Mancante Critico
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
                {ordinato ? '2 In Arrivo' : '1 In Arrivo'}
              </span>
            </div>
          </div>

          {/* Tabella Fabbisogni Simulati */}
          <div className="space-y-2.5 text-xs">
            {/* Riga 1: Critico da Ordinare */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {ordinato ? 'IN ARRIVO' : 'CRITICO - MANCANTE'}
                  </span>
                  <span className="font-bold text-white">Barra Trafilata Tonda Ø40 C45</span>
                </div>
                <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Giacenza a terra: <strong className="text-slate-200">12 m</strong></span>
                  <span>Fabbisogno OdP: <strong className="text-rose-400">65 m</strong></span>
                  <span className="text-orange-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Per Quando: 14 Nov 2026
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {ordinato ? (
                  <div className="px-3 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Ordinato 55 m a Rodacciai</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setOrdinato(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>+ Ordina a Fornitore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Riga 2: Materiale con Conto Terzi In Arrivo */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    IN CONTO TERZI
                  </span>
                  <span className="font-bold text-white">Piastra Supporto Slitta (Zincatura Bianca)</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>DDT-EXT-2026/041</span>
                  <span>Terzista: <strong className="text-slate-200">Zincatura Veneta Srl</strong></span>
                  <span className="text-emerald-400">Rientro: Domani</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/30">
                  <Truck className="w-3.5 h-3.5" /> Spedito 14 pz
                </span>
              </div>
            </div>

            {/* Riga 3: Materiale Sufficiente */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between gap-3 opacity-75">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    COPERTO
                  </span>
                  <span className="font-bold text-slate-300">Lamiera Decapata Fe510 Spessore 8mm</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Giacenza: 34 fogli • Fabbisogno OdP: 18 fogli (Scorta Sicura)
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Footer Barra di Protezione */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-orange-400" />
            Blocco Automatico Ordini Multipli
          </span>
          <span className="text-emerald-400 font-mono">MRP Aggiornato in tempo reale</span>
        </div>
      </div>
    </div>
  )
}
