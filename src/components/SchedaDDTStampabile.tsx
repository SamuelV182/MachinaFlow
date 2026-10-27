'use client'

import React from 'react'
import { Printer, Download, Truck, CheckCircle2, QrCode } from 'lucide-react'
import { DocumentoTrasportoEsterno } from '@/types/database'

interface SchedaDDTStampabileProps {
  ddt: DocumentoTrasportoEsterno
  onChiudi: () => void
}

export default function SchedaDDTStampabile({ ddt, onChiudi }: SchedaDDTStampabileProps) {
  const handleStampa = () => {
    window.print()
  }

  const handleDownloadCsv = () => {
    const separatore = ';'
    const intestazioni = [
      'DataDDT',
      'NumeroDDT',
      'DestinatarioFornitore',
      'PartitaIVA',
      'CodiceOdP',
      'CodiceArticolo',
      'DescrizioneArticolo',
      'LavorazioneRichiesta',
      'Quantita',
      'UnitaMisura',
      'PesoKg',
      'CausaleTrasporto',
      'Vettore',
      'Colli'
    ]

    const righeCsv = ddt.righe.map((r) => [
      new Date(ddt.data_emissione).toLocaleDateString('it-IT'),
      `"${ddt.numero_ddt}"`,
      `"${ddt.fornitore_nome}"`,
      `"${ddt.fornitore_piva || ''}"`,
      `"${r.codice_odp}"`,
      `"${r.articolo_codice}"`,
      `"${r.articolo_descrizione.replace(/"/g, '""')}"`,
      `"${r.nome_fase.replace(/"/g, '""')}"`,
      r.quantita_spedita,
      r.unita_misura,
      r.peso_kg_riga || '',
      `"${ddt.causale_trasporto}"`,
      `"${ddt.vettore_nome}"`,
      ddt.numero_colli
    ])

    const contenuto = [intestazioni.join(separatore), ...righeCsv.map((r) => r.join(separatore))].join('\r\n')
    const blob = new Blob(['\uFEFF' + contenuto], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${ddt.numero_ddt}_interscambio_gestionale.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="max-w-4xl w-full my-auto space-y-4">
        {/* Barra Comandi (Non Stampata) */}
        <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Documento di Trasporto Esterno (DDT Conto Lavoro)
                <span className="text-xs px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700 font-mono">
                  {ddt.numero_ddt}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pronto per la stampa cartacea o l&apos;esportazione verso il gestionale contabile aziendale.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title="Scarica file CSV compatibile con Zucchetti, Teamsystem, Passepartout, Danea"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Esporta per Gestionale (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleStampa}
              className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa DDT A4</span>
            </button>

            <button
              type="button"
              onClick={onChiudi}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              ✕ Chiudi
            </button>
          </div>
        </div>

        {/* FOGLIO A4 DDT RIGOROSO E CONFORME */}
        <div className="bg-white text-slate-950 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-xs space-y-6 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Header Azienda & Documento */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
            <div>
              <span className="text-[10px] font-black tracking-widest text-pink-700 uppercase block">
                DOCUMENTO DI TRASPORTO OPERATIVO (D.D.T.)
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                MACHINAFLOW MECCANICA S.R.L.
              </h1>
              <p className="text-[11px] text-slate-600 leading-tight mt-1">
                Lavorazioni Meccaniche di Precisione CNC &bull; Via dell&apos;Industria 14, 41012 Carpi (MO)<br />
                P.IVA e C.F.: 03849200361 &bull; Tel: +39 059 849201 &bull; ordini@machinaflow.it
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-xl min-w-[240px] text-right space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">NUMERO DOCUMENTO</span>
              <span className="text-lg font-black text-pink-700 font-mono block">
                {ddt.numero_ddt}
              </span>
              <div className="text-[11px] text-slate-600">
                Data: <strong>{new Date(ddt.data_emissione).toLocaleDateString('it-IT')}</strong> &bull; Ore: <strong>{new Date(ddt.data_emissione).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>

          {/* Mittente e Destinatario Terzista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">LUOGO DI PARTENZA (MITTENTE)</span>
              <strong className="text-slate-900 block">MachinaFlow Meccanica S.r.l. - Stabilimento 1</strong>
              <span className="text-slate-600 block text-[11px]">Via dell&apos;Industria 14 - 41012 Carpi (MO)</span>
              <span className="text-slate-500 text-[10px] block">Causale: {ddt.causale_trasporto}</span>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-pink-700/60 bg-pink-50/30 space-y-1">
              <span className="text-[10px] font-bold text-pink-800 uppercase block">DESTINATARIO FORNITORE / TERZISTA</span>
              <strong className="text-base text-slate-900 block font-black">{ddt.fornitore_nome}</strong>
              <span className="text-slate-700 block text-[11px]">{ddt.fornitore_indirizzo || 'Sede operativa fornitore'}</span>
              <span className="text-slate-600 text-[10px] block">P.IVA: {ddt.fornitore_piva || 'Come in anagrafica'}</span>
            </div>
          </div>

          {/* Dati Logistici Trasporto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-xl text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Vettore Incaricato:</span>
              <strong className="text-slate-900">{ddt.vettore_nome}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Numero Colli:</span>
              <strong className="text-slate-900">{ddt.numero_colli} cassa/e</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Peso Totale Lordo:</span>
              <strong className="text-slate-900 font-mono">{ddt.peso_totale_kg ? `${ddt.peso_totale_kg.toFixed(1)} kg` : 'A vista'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Aspetto Esteriore Beni:</span>
              <strong className="text-slate-900">{ddt.aspetto_beni}</strong>
            </div>
          </div>

          {/* Tabella Dettaglio Merci & Trattamenti Richiesti */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3"># OdP / Rif.</th>
                  <th className="py-2.5 px-3">Codice Particolare</th>
                  <th className="py-2.5 px-3">Descrizione Tecnica</th>
                  <th className="py-2.5 px-3">Trattamento Richiesto</th>
                  <th className="py-2.5 px-3 text-center">Quantità</th>
                  <th className="py-2.5 px-3 text-right">Peso Stima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ddt.righe.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-pink-700 whitespace-nowrap">
                      {r.codice_odp}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.articolo_codice}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">
                      {r.articolo_descrizione}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {r.nome_fase}
                      {r.note_lavorazione && (
                        <span className="block text-[10px] font-normal text-slate-500 italic">
                          Note: {r.note_lavorazione}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm whitespace-nowrap font-mono">
                      {r.quantita_spedita} {r.unita_misura}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      {r.peso_kg_riga ? `${r.peso_kg_riga.toFixed(1)} kg` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note Speciali / Istruzioni di Lavorazione */}
          {ddt.note_trasporto && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <strong>Istruzioni Speciali & Note al Terzista:</strong> {ddt.note_trasporto}
            </div>
          )}

          {/* Riquadro Firme Conducente e Ricezione */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-[10px]">
            <div className="space-y-10 border border-slate-300 p-3 rounded-lg">
              <span className="font-bold text-slate-500 uppercase block">Firma del Mittente</span>
              <div className="border-b border-dashed border-slate-400"></div>
            </div>

            <div className="space-y-10 border border-slate-300 p-3 rounded-lg">
              <span className="font-bold text-slate-500 uppercase block">Firma del Vettore / Conducente</span>
              <div className="border-b border-dashed border-slate-400"></div>
            </div>

            <div className="space-y-10 border border-slate-300 p-3 rounded-lg">
              <span className="font-bold text-slate-500 uppercase block">Firma per Ricezione Fornitore</span>
              <div className="border-b border-dashed border-slate-400"></div>
            </div>
          </div>

          {/* Footer Documento */}
          <div className="text-[9px] text-slate-400 text-center pt-2">
            Documento di Trasporto generato elettronicamente tramite <strong>MachinaFlow MES</strong> &bull; Stampa ad uso logistico e doganale di officina.
          </div>
        </div>
      </div>
    </div>
  )
}
