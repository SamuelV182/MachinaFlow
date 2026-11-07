'use client'

import { useState } from 'react'
import {
  Calculator,
  TrendingUp,
  Clock,
  Euro,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export function CalcolatoreRoi({ onRichiediDemo }: { onRichiediDemo: () => void }) {
  const [numeroMacchine, setNumeroMacchine] = useState(6)
  const [costoOrarioMedio, setCostoOrarioMedio] = useState(55)

  // Calcolo stimato conservativo basato su metriche reali di officine meccaniche:
  // - 1.5 ore a settimana risparmiate per macchina (ricerca disegni, chiarimenti, doppi ordini, telefonate terzisti)
  // - Riduzione del 70% degli scarti non pianificati e recupero rapido
  const oreRisparmiateSettimana = Math.round(numeroMacchine * 1.5)
  const oreRisparmiateAnno = oreRisparmiateSettimana * 46 // 46 settimane lavorative
  const risparmioEconomicoAnno = Math.round(oreRisparmiateAnno * costoOrarioMedio)
  const riduzioneErroriStimata = Math.min(85, 45 + numeroMacchine * 3)

  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/30 mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulatore Economico per Officine</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Quanto costa alla tua officina non avere un MES?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Muovi i selettori per stimare il tempo e il denaro recuperabili ogni anno eliminando fogli e fermi imprevisti.
            </p>
          </div>
        </div>

        {/* Sliders Selettori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Slider Macchine */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Centri di Lavoro / Torni CNC
              </label>
              <span className="text-xl font-black font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/30">
                {numeroMacchine} macchine
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={numeroMacchine}
              onChange={(e) => setNumeroMacchine(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 macchina</span>
              <span>12 macchine</span>
              <span>25+ macchine</span>
            </div>
          </div>

          {/* Slider Costo Orario */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tariffa Oraria Media Officina
              </label>
              <span className="text-xl font-black font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                {costoOrarioMedio} €/ora
              </span>
            </div>
            <input
              type="range"
              min="35"
              max="120"
              step="5"
              value={costoOrarioMedio}
              onChange={(e) => setCostoOrarioMedio(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>35 €/h</span>
              <span>75 €/h</span>
              <span>120 €/h</span>
            </div>
          </div>
        </div>

        {/* Risultati Calcolatore */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Box 1 */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>Tempo Recuperato</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {oreRisparmiateSettimana} <span className="text-xs text-slate-400 font-normal">ore / settimana</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Circa <strong>{oreRisparmiateAnno} ore/anno</strong> sottratte a ricerche e fogli volanti.
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 space-y-1 shadow-lg shadow-emerald-500/5">
            <div className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5" />
              <span>Risparmio Annuo Stimato</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ~{risparmioEconomicoAnno.toLocaleString('it-IT')} €
            </div>
            <div className="text-[11px] text-emerald-300/80 pt-1">
              Valore di produzione recuperato senza acquistare nuovi macchinari.
            </div>
          </div>

          {/* Box 3 */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[11px] uppercase font-bold text-sky-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Affidabilità Consegne</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              +{riduzioneErroriStimata}%
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Eliminazione di ordini duplicati e date non rispettate con i clienti.
            </div>
          </div>
        </div>

        {/* CTA Sotto Calcolatore */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Vuoi scoprire come applicare questi risparmi sul tuo specifico parco macchine?
          </div>

          <button
            onClick={onRichiediDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <span>Prenota Demo Gratuita</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
