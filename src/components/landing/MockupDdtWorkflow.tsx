'use client'

import { useState } from 'react'
import {
  Truck,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Building,
  Check
} from 'lucide-react'

export function MockupDdtWorkflow() {
  const [tabDdt, setTabDdt] = useState<'terzisti' | 'vendita'>('terzisti')
  const [esportatoExcel, setEsportatoExcel] = useState(false)

  const handleSimulaExportExcel = () => {
    setEsportatoExcel(true)
    setTimeout(() => setEsportatoExcel(false), 3000)
  }

  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 select-none">
        {/* Barra di Navigazione Tab del Mockup */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-violet-400" />
            <div>
              <span className="text-xs font-black text-white">Logistica Documentale &amp; Raccordo con il tuo Gestionale/ERP</span>
              <div className="text-[10px] text-slate-400">Non serve cambiare il tuo gestionale contabile o di fatturazione</div>
            </div>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setTabDdt('terzisti')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tabDdt === 'terzisti'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Invio &amp; Rientro Conto Terzi
            </button>
            <button
              onClick={() => setTabDdt('vendita')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tabDdt === 'vendita'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. DDT Spedizione &amp; Export Excel/ERP
            </button>
          </div>
        </div>

        {/* Contenuto Tab 1: Conto Terzi */}
        {tabDdt === 'terzisti' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 font-mono text-xs flex items-center justify-center font-bold">
                    EXT
                  </span>
                  Tracciabilità Lavorazioni Esterne (Zincatura, Tempra, Verniciatura)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Genera la bolla di trasporto per il terzista; al rientro del materiale basta registrare il DDT fornitore per avanzare il lotto.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold self-start sm:self-auto">
                Bolla Ufficiale A4 Pronta
              </span>
            </div>

            {/* Scheda Documento Terzista */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-violet-400 font-bold">DDT-EXT-2026/041 • Causale: Invio per Conto Lavorazione</div>
                  <div className="text-sm font-bold text-white mt-0.5">Destinatario: Zincatura Veneta Srl (Cadoneghe PD)</div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Colli: <strong>2 su pallet</strong></span> • <span>Peso: <strong>145 kg</strong></span>
                </div>
              </div>

              {/* Righe Lotti Spediti */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-orange-400 font-bold">ODP-2026-015</span>
                    <span className="text-white ml-2">Piastra Supporto Slitta (8 pz)</span>
                  </div>
                  <span className="text-[11px] text-violet-300 font-semibold bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/60">
                    Zincatura Bianca Trivalente 12µm
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-orange-400 font-bold">ODP-2026-016</span>
                    <span className="text-white ml-2">Staffa di Ancoraggio Saldato (14 pz)</span>
                  </div>
                  <span className="text-[11px] text-violet-300 font-semibold bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/60">
                    Zincatura Bianca Elettrolitica
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Al rientro: 1 tocco a bordo macchina o in ufficio per sbloccare la fase successiva
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Bolla PDF Stampa Laser A4</span>
                  <Printer className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenuto Tab 2: Vendita ed Export ERP */}
        {tabDdt === 'vendita' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
                    ERP
                  </span>
                  Generazione DDT di Spedizione ed Esportazione Excel per la Contabilità
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  A fine produzione, genera il DDT con le quantità reali pronte. Puoi stamparlo subito o esportare il file Excel per caricarlo nel tuo gestionale di fatturazione esistente.
                </p>
              </div>
            </div>

            {/* Scheda DDT Cliente con Azioni Rapide */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">DDT-2026/089 • Spedizione a Cliente Finale</div>
                  <div className="text-sm font-bold text-white mt-0.5">Cliente: Brevetti Meccanici Srl • Ordine Rif: OC-2026-088</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulaExportExcel}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{esportatoExcel ? '✓ File Excel Scaricato!' : 'Esporta per tuo Gestionale (Excel)'}</span>
                  </button>

                  <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                    <Printer className="w-3.5 h-3.5 text-orange-400" />
                    <span>Stampa A4</span>
                  </button>
                </div>
              </div>

              {/* Dettaglio Righe Spedite */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-white">Albero di Trasmissione C45 Rettificato</span>
                  <span className="text-emerald-400 font-bold">50 pz (Evasione Completa Ordine)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Colli: 1 cassa pallet • Peso: 180 kg • Vettore: Mittente Mezzo Proprio • Causale: Vendita
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Nessun doppio inserimento contabile:</strong> il file Excel esportato contiene già Codice Articolo, Quantità, Prezzo unitario e Riferimento Ordine per essere importato nel tuo software di fatturazione attuale (es. Zucchetti, TeamSystem, Danea, SAP o qualsiasi altro gestionale contabile).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>MachinaFlow gestisce la fabbrica al 100%: il tuo ufficio contabile continua a usare il proprio programma senza traumi.</span>
          <span className="text-emerald-400 font-bold font-mono">Compatibilità Totale ERP</span>
        </div>
      </div>
    </div>
  )
}
