'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Printer, Download, Truck, CheckCircle2, QrCode, FileText } from 'lucide-react'
import { DocumentoTrasportoEsterno, DocumentoTrasportoCliente, OrdineCliente } from '@/types/database'
import { generaDdtPdf } from '@/lib/pdf-ddt-service'

interface SchedaDDTStampabileProps {
  ddt: DocumentoTrasportoEsterno | DocumentoTrasportoCliente
  tipo?: 'terzista' | 'cliente'
  ordiniClienti?: OrdineCliente[]
  onChiudi: () => void
}

export default function SchedaDDTStampabile({ ddt, tipo = 'terzista', ordiniClienti = [], onChiudi }: SchedaDDTStampabileProps) {
  const isCliente = tipo === 'cliente' || 'cliente_nome' in ddt
  const clienteDdt = isCliente ? (ddt as DocumentoTrasportoCliente) : null
  const terzistaDdt = !isCliente ? (ddt as DocumentoTrasportoEsterno) : null

  // URL del PDF generato dal template predefinito (< 0.1s)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const ddtId = ddt.id || ddt.numero_ddt
  const ordiniCount = ordiniClienti?.length || 0

  useEffect(() => {
    try {
      const doc = generaDdtPdf(ddt, isCliente ? 'cliente' : 'terzista', ordiniClienti)
      const blobUrl = doc.output('bloburl')
      setPdfUrl(String(blobUrl))

      return () => {
        if (blobUrl) URL.revokeObjectURL(String(blobUrl))
      }
    } catch (e) {
      console.error('Errore generazione PDF DDT:', e)
    }
  }, [ddtId, isCliente, ordiniCount])

  // Scarica direttamente il file PDF già pronto
  const handleScaricaPdf = () => {
    try {
      const doc = generaDdtPdf(ddt, isCliente ? 'cliente' : 'terzista', ordiniClienti)
      doc.save(`${ddt.numero_ddt || 'DDT'}.pdf`)
    } catch {
      window.print()
    }
  }

  const handleDownloadCsv = () => {
    const separatore = ';'

    if (isCliente && clienteDdt) {
      const intestazioni = [
        'DataDDT',
        'NumeroDDT',
        'DestinatarioCliente',
        'PartitaIVA',
        'Destinazione',
        'CommessaCliente',
        'ItemRigaCliente',
        'NsOrdine',
        'CodiceOdP',
        'CodiceArticolo',
        'DescrizioneArticolo',
        'QuantitaSpedita',
        'UnitaMisura',
        'PesoKg',
        'CausaleTrasporto',
        'Vettore',
        'NumeroColli'
      ]

      const righeCsv = clienteDdt.righe.map((r) => {
        let commessa = r.riferimento_ordine_cliente || ''
        if (!commessa && ordiniClienti) {
          const m = ordiniClienti.find((o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente)
          if (m?.riferimento_ordine_cliente) commessa = m.riferimento_ordine_cliente
        }

        return [
          new Date(clienteDdt.data_emissione).toLocaleDateString('it-IT'),
          `"${clienteDdt.numero_ddt}"`,
          `"${clienteDdt.cliente_nome}"`,
          `"${clienteDdt.cliente_piva || ''}"`,
          `"${clienteDdt.destinazione_diversa || clienteDdt.cliente_indirizzo || ''}"`,
          `"${commessa}"`,
          `"${r.pos_riga_cliente || ''}"`,
          `"${r.codice_ordine_cliente || ''}"`,
          `"${r.codice_odp || ''}"`,
          `"${r.articolo_codice}"`,
          `"${r.articolo_descrizione.replace(/"/g, '""')}"`,
          r.quantita_spedita,
          r.unita_misura,
          r.peso_kg_riga || '',
          `"${clienteDdt.causale_trasporto}"`,
          `"${clienteDdt.vettore_nome}"`,
          clienteDdt.numero_colli
        ]
      })

      const contenuto = [intestazioni.join(separatore), ...righeCsv.map((r) => r.join(separatore))].join('\r\n')
      const blob = new Blob(['\uFEFF' + contenuto], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${clienteDdt.numero_ddt}_consegna_cliente.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    if (terzistaDdt) {
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

      const righeCsv = terzistaDdt.righe.map((r) => [
        new Date(terzistaDdt.data_emissione).toLocaleDateString('it-IT'),
        `"${terzistaDdt.numero_ddt}"`,
        `"${terzistaDdt.fornitore_nome}"`,
        `"${terzistaDdt.fornitore_piva || ''}"`,
        `"${r.codice_odp}"`,
        `"${r.articolo_codice}"`,
        `"${r.articolo_descrizione.replace(/"/g, '""')}"`,
        `"${r.nome_fase.replace(/"/g, '""')}"`,
        r.quantita_spedita,
        r.unita_misura,
        r.peso_kg_riga || '',
        `"${terzistaDdt.causale_trasporto}"`,
        `"${terzistaDdt.vettore_nome}"`,
        terzistaDdt.numero_colli
      ])

      const contenuto = [intestazioni.join(separatore), ...righeCsv.map((r) => r.join(separatore))].join('\r\n')
      const blob = new Blob(['\uFEFF' + contenuto], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${terzistaDdt.numero_ddt}_interscambio_gestionale.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="scheda-a4-container fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:z-auto print:overflow-visible">
      <div className="max-w-4xl w-full my-auto space-y-4 print:max-w-full print:w-full print:m-0 print:p-0 print:space-y-0">
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
              onClick={handleScaricaPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              title="Scarica il file PDF A4 ad alta risoluzione"
            >
              <FileText className="w-4 h-4" />
              <span>Scarica PDF A4</span>
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

        {/* ANTEPRIMA VETTORIALE NATIVA IN-APP DEL PDF A4 (< 0.2s) */}
        {pdfUrl ? (
          <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 shadow-2xl h-[78vh] w-full flex flex-col">
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              title="Anteprima DDT PDF"
              className="w-full h-full rounded-xl bg-white border-0"
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Generazione documento PDF in corso...</p>
          </div>
        )}
      </div>
    </div>
  )
}
