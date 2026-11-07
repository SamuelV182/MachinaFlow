'use client'

import { useState } from 'react'
import {
  Calendar,
  AlertCircle,
  Clock,
  Cpu,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Hourglass
} from 'lucide-react'

export function MockupMatriceCarico() {
  const [settimana, setSettimana] = useState('Settimana 46 • Novembre 2026')

  const macchine = [
    {
      nome: 'Tornio CNC 1 (Doosan Lynx)',
      reparto: 'Tornitura',
      carico: 92,
      stato: 'ottimale',
      giorni: ['100%', '95%', '90%', '100%', '75%']
    },
    {
      nome: 'Tornio CNC 2 (Biglia B565)',
      reparto: 'Tornitura da Barra',
      carico: 115,
      stato: 'sovraccarico',
      giorni: ['100%', '120%', '130%', '115%', '110%']
    },
    {
      nome: 'Centro di Lavoro 5 Assi (Mori Seiki)',
      reparto: 'Fresatura Alta Precisione',
      carico: 85,
      stato: 'ottimale',
      giorni: ['85%', '90%', '80%', '90%', '85%']
    },
    {
      nome: 'Fresa Verticale 3 Assi (Haas VF2)',
      reparto: 'Fresatura Componenti',
      carico: 45,
      stato: 'scarico',
      giorni: ['50%', '40%', '60%', '35%', '40%']
    },
    {
      nome: 'Rettifica Tangenziale (Jones & Shipman)',
      reparto: 'Finitura / Rettifica',
      carico: 70,
      stato: 'ottimale',
      giorni: ['70%', '75%', '65%', '70%', '70%']
    }
  ]

  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 select-none">
        {/* Header Finestra */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black text-white">
              Matrice Carico &amp; Mappa Buchi Macchina
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">{settimana}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              OEE Medio: 88.4%
            </span>
          </div>
        </div>

        {/* Tabella Matrice */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Macchina Libera (Buco Disponibile)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Carico Ottimale (80-100%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Collo di Bottiglia (&gt;100%)
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {macchine.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="sm:w-1/3">
                  <div className="font-bold text-white text-xs">{m.nome}</div>
                  <div className="text-[10px] text-slate-400">{m.reparto}</div>
                </div>

                {/* 5 Giorni Settimana */}
                <div className="flex items-center gap-1.5 flex-1 justify-start sm:justify-center">
                  {m.giorni.map((g, gIdx) => {
                    const valore = parseInt(g)
                    let colore = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    if (valore >= 80 && valore <= 100) colore = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    if (valore > 100) colore = 'bg-rose-500/20 text-rose-300 border-rose-500/40'

                    return (
                      <div
                        key={gIdx}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold text-center min-w-[42px] ${colore}`}
                      >
                        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven'][gIdx]}
                        <div className="text-[9px] opacity-80">{g}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Badge Carico Complessivo */}
                <div className="sm:w-1/4 text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      m.carico > 100
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : m.carico < 60
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-200 border border-slate-700'
                    }`}
                  >
                    Carico: {m.carico}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Identifica istantaneamente dove puoi inserire un ordine urgente senza far slittare gli altri.</span>
          <span className="text-orange-400 font-bold font-mono">MachinaFlow Scheduler</span>
        </div>
      </div>
    </div>
  )
}
