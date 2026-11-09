'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Download, AlertCircle } from 'lucide-react'
import { DocumentoTrasportoCliente, DocumentoTrasportoEsterno, OrdineCliente } from '@/types/database'
import { SEED_DDT_CLIENTI } from '@/lib/data-service'

function DdtStampaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const tipo = searchParams.get('tipo') || 'cliente'

  const [ddt, setDdt] = useState<DocumentoTrasportoCliente | DocumentoTrasportoEsterno | null>(null)
  const [ordiniClienti, setOrdiniClienti] = useState<OrdineCliente[]>([])
  const [articoli, setArticoli] = useState<any[]>([])
  const [azienda, setAzienda] = useState<any>(null)
  const [caricato, setCaricato] = useState(false)

  useEffect(() => {
    try {
      const azCache = localStorage.getItem('machinaflow_session_azienda_dati')
      if (azCache) {
        setAzienda(JSON.parse(azCache))
      }
    } catch {}

    try {
      const ordiniSalvati = localStorage.getItem('machinaflow_ordini_clienti')
      if (ordiniSalvati) {
        setOrdiniClienti(JSON.parse(ordiniSalvati))
      }
    } catch {}

    try {
      const artSalvati = localStorage.getItem('machinaflow_articoli')
      if (artSalvati) {
        setArticoli(JSON.parse(artSalvati))
      }
    } catch {}

    if (id) {
      if (tipo === 'cliente') {
        try {
          const salvati = localStorage.getItem('machinaflow_ddt_clienti')
          const lista: DocumentoTrasportoCliente[] = salvati ? JSON.parse(salvati) : SEED_DDT_CLIENTI
          const trovato = lista.find((d) => d.id === id || d.numero_ddt === id)
          if (trovato) setDdt(trovato)
        } catch {}
      } else {
        try {
          const salvati = localStorage.getItem('machinaflow_ddt_esterni')
          if (salvati) {
            const lista: DocumentoTrasportoEsterno[] = JSON.parse(salvati)
            const trovato = lista.find((d) => d.id === id || d.numero_ddt === id)
            if (trovato) setDdt(trovato)
          }
        } catch {}
      }
    }
    setCaricato(true)
  }, [id, tipo])

  // Apertura automatica del dialogo di stampa appena il DDT è pronto a video
  useEffect(() => {
    if (caricato && ddt) {
      const timer = setTimeout(() => {
        window.print()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [caricato, ddt])

  const isCliente = tipo === 'cliente' || (ddt && 'cliente_nome' in ddt)
  const clienteDdt = isCliente ? (ddt as DocumentoTrasportoCliente) : null
  const terzistaDdt = !isCliente ? (ddt as DocumentoTrasportoEsterno) : null

  const getCommessaCliente = (r: any) => {
    if (r.riferimento_ordine_cliente && r.riferimento_ordine_cliente.trim() !== '') {
      return r.riferimento_ordine_cliente
    }
    if (ordiniClienti && ordiniClienti.length > 0) {
      const match = ordiniClienti.find(
        (o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente
      )
      if (match && match.riferimento_ordine_cliente) {
        return match.riferimento_ordine_cliente
      }
    }
    return '-'
  }

  const getItemRigaCliente = (r: any) => {
    if (r.pos_riga_cliente) return r.pos_riga_cliente
    if (ordiniClienti && ordiniClienti.length > 0) {
      const match = ordiniClienti.find(
        (o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente
      )
      if (match && match.righe) {
        const rigaMatch = match.righe.find((rig: any) => rig.id === r.riga_ordine_cliente_id || rig.articolo_id === r.articolo_id)
        if (rigaMatch && rigaMatch.pos_riga_cliente) {
          return rigaMatch.pos_riga_cliente
        }
      }
    }
    return null
  }

  if (!caricato) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Caricamento documento di trasporto in corso...</p>
      </div>
    )
  }

  if (!ddt) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl my-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Documento di Trasporto non trovato</h2>
        <p className="text-xs text-slate-400 mt-1">L'identificativo richiesto non corrisponde a nessun DDT memorizzato.</p>
        <button
          onClick={() => router.push('/spedizioni')}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Torna a Spedizioni
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra Comandi a Schermo (Nascosta durante la Stampa) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/spedizioni')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alle Spedizioni
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Stampa DDT A4
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOGLIO A4 DDT RIGOROSO E IDENTICO A VIDEO                                 */}
      {/* ========================================================================= */}
      <div className="scheda-a4-container bg-white text-slate-950 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 text-xs max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none min-h-[297mm] flex flex-col justify-between">
        <div className="scheda-a4-foglio space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
          {/* Header Azienda & Documento (Layout Standard a 3 Blocchi) */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-900 pb-5 gap-6">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {azienda?.logo_url && (
                <div className="w-[120px] max-w-[120px] flex-shrink-0 flex items-center justify-start">
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(azienda.logo_url)}`}
                    alt={azienda.nome || 'Logo'}
                    className="max-h-14 w-auto max-w-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black tracking-widest text-pink-700 uppercase block">
                  DOCUMENTO DI TRASPORTO (D.D.T.)
                </span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
                  {azienda?.nome || 'BRB MECCANICA SRL'}
                </h1>
                <p className="text-[11px] text-slate-600 leading-tight mt-1 truncate">
                  {azienda?.indirizzo ? `${azienda.indirizzo}, ${azienda.cap || ''} ${azienda.citta || ''} (${azienda.provincia || ''})` : 'Via Ciarpi 6, 55016 Porcari (LU)'}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  P.IVA: {azienda?.partita_iva || '02453430460'} {azienda?.telefono ? `• Tel: ${azienda.telefono}` : ''}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-3 rounded-xl w-[210px] flex-shrink-0 text-right space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">NUMERO DOCUMENTO</span>
              <span className="text-base font-black text-pink-700 font-mono block">
                {ddt.numero_ddt}
              </span>
              <div className="text-[10px] text-slate-600">
                Data: <strong>{new Date(ddt.data_emissione).toLocaleDateString('it-IT')}</strong> &bull; Ore: <strong>{new Date(ddt.data_emissione).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>

          {/* Mittente e Destinatario Terzista o Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">LUOGO DI PARTENZA (MITTENTE)</span>
              <strong className="text-slate-900 block">{azienda?.nome || 'BRB Meccanica SRL'}</strong>
              <span className="text-slate-600 block text-[11px]">{azienda?.indirizzo ? `${azienda.indirizzo} - ${azienda.cap || ''} ${azienda.citta || ''} (${azienda.provincia || ''})` : 'Via Ciarpi 6 - 55016 Porcari (LU)'}</span>
              <span className="text-slate-500 text-[10px] block">P.IVA: {azienda?.partita_iva || '02453430460'}</span>
            </div>

            {isCliente && clienteDdt ? (
              <div className="p-3.5 rounded-xl border-2 border-emerald-600/70 bg-emerald-50/30 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">DESTINATARIO CLIENTE FINALE</span>
                <strong className="text-base text-slate-900 block font-black">{clienteDdt.cliente_nome}</strong>
                <span className="text-slate-700 block text-[11px]">
                  {clienteDdt.destinazione_diversa || clienteDdt.cliente_indirizzo || 'Sede legale cliente'}
                </span>
                <span className="text-slate-600 text-[10px] block">P.IVA / C.F.: {clienteDdt.cliente_piva || 'In anagrafica'}</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border-2 border-pink-700/60 bg-pink-50/30 space-y-1">
                <span className="text-[10px] font-bold text-pink-800 uppercase block">DESTINATARIO FORNITORE / TERZISTA</span>
                <strong className="text-base text-slate-900 block font-black">{terzistaDdt?.fornitore_nome}</strong>
                <span className="text-slate-700 block text-[11px]">{terzistaDdt?.fornitore_indirizzo || 'Sede operativa fornitore'}</span>
                <span className="text-slate-600 text-[10px] block">P.IVA: {terzistaDdt?.fornitore_piva || 'Come in anagrafica'}</span>
              </div>
            )}
          </div>

          {/* Tabella Dettaglio Merci */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  {isCliente ? (
                    <>
                      <th className="py-2.5 px-3">Pos / OdP</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Commessa</th>
                    </>
                  ) : (
                    <th className="py-2.5 px-3"># OdP / Rif.</th>
                  )}
                  <th className="py-2.5 px-3">Codice Articolo</th>
                  <th className="py-2.5 px-3">Descrizione Particolare</th>
                  <th className="py-2.5 px-3">{isCliente ? 'Note / Saldo' : 'Trattamento Richiesto'}</th>
                  <th className="py-2.5 px-3 text-center">Quantità</th>
                  {isCliente ? (
                    <>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Prezzo Unit.</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Totale Riga</th>
                    </>
                  ) : (
                    <th className="py-2.5 px-3 text-right">Peso Stima</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isCliente && clienteDdt
                  ? clienteDdt.righe.map((r, i) => {
                      let commessa = r.riferimento_ordine_cliente || ''
                      let prezzoUnit = r.prezzo_unitario || 0
                      if (ordiniClienti) {
                        const ord = ordiniClienti.find((o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente)
                        if (ord) {
                          if (!commessa && ord.riferimento_ordine_cliente) commessa = ord.riferimento_ordine_cliente
                          if (!prezzoUnit && (ord as any).righe) {
                            const rigaOrd = (ord as any).righe.find((ro: any) => ro.id === r.riga_ordine_cliente_id || ro.articolo_id === r.articolo_id)
                            if (rigaOrd?.prezzo_unitario) prezzoUnit = rigaOrd.prezzo_unitario
                          }
                        }
                      }
                      const totRiga = r.totale_riga !== undefined ? r.totale_riga : (prezzoUnit * r.quantita_spedita)
                      const labelOdp = r.codice_odp ? r.codice_odp.replace(/^[A-Z0-9]+-[A-Z0-9]+-/, '') : (r.codice_ordine_cliente || '-')
                      const labelPos = r.pos_riga_cliente ? `#${r.pos_riga_cliente} • ` : ''

                      const codiceVisualizzato = (!r.articolo_codice || r.articolo_codice === 'N/D')
                        ? (articoli.find(a => a.id === r.articolo_id)?.codice_articolo || (articoli.length > 0 ? articoli[0].codice_articolo : r.articolo_codice))
                        : r.articolo_codice
                      const descVisualizzata = (!r.articolo_descrizione || r.articolo_descrizione === 'Particolare Meccanico')
                        ? (articoli.find(a => a.id === r.articolo_id)?.descrizione || r.articolo_descrizione)
                        : r.articolo_descrizione

                      return (
                        <tr key={r.id || i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-mono font-black text-slate-900 text-xs block">
                              {labelPos}{labelOdp}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                            {commessa || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {codiceVisualizzato}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium">
                            {descVisualizzata}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {r.note_riga || (r.quantita_ordinata ? `Saldo (${r.quantita_spedita}/${r.quantita_ordinata})` : 'Consegna')}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm whitespace-nowrap font-mono">
                            {r.quantita_spedita} {r.unita_misura}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                            {prezzoUnit > 0 ? `€ ${prezzoUnit.toFixed(2)}` : '€ 0,00'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {totRiga > 0 ? `€ ${totRiga.toFixed(2)}` : '€ 0,00'}
                          </td>
                        </tr>
                      )
                    })
                  : terzistaDdt?.righe.map((r, i) => (
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

          {/* Box Riepilogo Totali Imponibile e IVA (Solo per DDT Cliente) */}
          {isCliente && clienteDdt && (() => {
            let imponibile = 0
            clienteDdt.righe.forEach((r) => {
              let p = r.prezzo_unitario || 0
              if (!p && ordiniClienti) {
                const ord = ordiniClienti.find((o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente)
                const ro = (ord as any)?.righe?.find((row: any) => row.id === r.riga_ordine_cliente_id || row.articolo_id === r.articolo_id)
                if (ro?.prezzo_unitario) p = ro.prezzo_unitario
              }
              imponibile += r.totale_riga !== undefined ? r.totale_riga : (p * r.quantita_spedita)
            })
            const iva = Number((imponibile * 0.22).toFixed(2))
            const totale = Number((imponibile + iva).toFixed(2))

            return (
              <div className="flex justify-end">
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Totale Imponibile:</span>
                    <span className="font-mono font-bold text-slate-900">€ {imponibile.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA Ordinaria (22%):</span>
                    <span className="font-mono font-bold text-slate-900">€ {iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-black text-emerald-800">
                    <span>TOTALE DOCUMENTO:</span>
                    <span className="font-mono text-base">€ {totale.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )
          })()}

              {/* Note Speciali / Istruzioni di Spedizione */}
              {ddt.note_trasporto && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <strong>Istruzioni Speciali & Note di Consegna:</strong> {ddt.note_trasporto}
                </div>
              )}
            </div>

            {/* Sezione Basso Pagina ancorata in fondo (mt-auto) */}
            <div className="mt-auto pt-6 space-y-4">
              {/* Dati Logistici (Sinistra, 2 righe x 3 col) e Firme Impilate (Destra) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                {/* Box Logistica Sinistra (8 colonne) */}
                <div className="md:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block border-b border-slate-200 pb-1">
                    Dati Logistici e di Trasporto
                  </span>
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    {/* Riga 1 */}
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Causale:</span>
                      <strong className="text-slate-900 text-xs block leading-tight">{ddt.causale_trasporto || 'Vendita'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Porto:</span>
                      <strong className="text-slate-900 text-xs block leading-tight">{ddt.porto || 'Franco'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Aspetto Beni:</span>
                      <strong className="text-slate-900 text-xs block leading-tight">{ddt.aspetto_beni || 'A vista'}</strong>
                    </div>

                    {/* Riga 2 */}
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Colli:</span>
                      <strong className="text-slate-900 text-xs block leading-tight">{ddt.numero_colli} collo/i</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Peso Totale:</span>
                      <strong className="text-slate-900 font-mono text-xs block leading-tight">{ddt.peso_totale_kg ? `${ddt.peso_totale_kg.toFixed(1)} kg` : 'A vista'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Vettore:</span>
                      <strong className="text-slate-900 text-xs block leading-tight">{ddt.vettore_nome || 'Mittente'}</strong>
                    </div>
                  </div>
                </div>

                {/* Box Firme Destra Impilate (4 colonne) */}
                <div className="md:col-span-4 flex flex-col justify-between gap-2 text-[10px]">
                  <div className="border border-slate-300 px-3 py-2 rounded-lg bg-white">
                    <span className="font-bold text-slate-500 uppercase block text-[9px] mb-4">Firma del Mittente</span>
                    <div className="border-b border-dashed border-slate-400"></div>
                  </div>

                  <div className="border border-slate-300 px-3 py-2 rounded-lg bg-white">
                    <span className="font-bold text-slate-500 uppercase block text-[9px] mb-4">Firma del Vettore / Conducente</span>
                    <div className="border-b border-dashed border-slate-400"></div>
                  </div>

                  <div className="border border-slate-300 px-3 py-2 rounded-lg bg-white">
                    <span className="font-bold text-slate-500 uppercase block text-[9px] mb-4">
                      {isCliente ? 'Firma Ricezione Cliente' : 'Firma Ricezione Fornitore'}
                    </span>
                    <div className="border-b border-dashed border-slate-400"></div>
                  </div>
                </div>
              </div>

              {/* Footer Documento */}
              <div className="text-[9px] text-slate-400 text-center pt-2">
                Documento di Trasporto generato elettronicamente tramite <strong>MachinaFlow MES</strong> &bull; Stampa ad uso logistico e doganale di officina.
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default function DdtStampaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Caricamento scheda di stampa in corso...</p>
        </div>
      }
    >
      <DdtStampaContent />
    </Suspense>
  )
}
