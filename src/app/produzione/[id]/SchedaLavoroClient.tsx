'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  Printer,
  ArrowLeft,
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Cpu,
  Layers,
  Wrench,
  Check,
  Play
} from 'lucide-react'
import { OrdineProduzione, FaseOdP, Articolo, CentroLavoro } from '@/types/database'
import { SEED_ODP, SEED_ARTICOLI, SEED_CENTRI_LAVORO } from '@/lib/data-service'

export function SchedaLavoroClient({ odpId }: { odpId: string }) {
  const [odp, setOdp] = useState<(OrdineProduzione & { fasi: FaseOdP[] }) | null>(null)
  const [articolo, setArticolo] = useState<Articolo | null>(null)
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    const parseSicuro = <T,>(chiave: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(chiave)
        if (!item || item === 'undefined' || item === 'null') return fallback
        return JSON.parse(item) as T
      } catch {
        return fallback
      }
    }

    const odpCaricati = parseSicuro<(OrdineProduzione & { fasi: FaseOdP[] })[]>('machinaflow_odp', SEED_ODP)
    const trovatoOdp = odpCaricati.find((o) => o.id === odpId)
    setOdp(trovatoOdp || null)

    const articoliList = parseSicuro<Articolo[]>('machinaflow_articoli', SEED_ARTICOLI)
    if (trovatoOdp) {
      const art = articoliList.find((a) => a.id === trovatoOdp.articolo_id)
      setArticolo(art || null)

      // Genera QR Code per la scheda
      const payloadQr = JSON.stringify({
        odp: trovatoOdp.codice_odp,
        token: trovatoOdp.qr_code_token,
        articolo: art?.codice_articolo,
        qta: trovatoOdp.quantita_da_produrre
      })

      QRCode.toDataURL(payloadQr, {
        width: 180,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Errore generazione QR:', err))
    }

    setCentriLavoro(parseSicuro('machinaflow_centri_lavoro', SEED_CENTRI_LAVORO))
  }, [odpId])

  // Funzione avanzamento rapido stato fase (MES a bordo scheda)
  const handleAggiornaStatoFase = (faseId: string, nuovoStato: 'in_corso' | 'completata') => {
    if (!odp) return

    const fasiAggiornate = odp.fasi.map((f) => {
      if (f.id === faseId) {
        return {
          ...f,
          stato: nuovoStato,
          data_inizio_reale: nuovoStato === 'in_corso' ? new Date().toISOString() : f.data_inizio_reale,
          data_fine_reale: nuovoStato === 'completata' ? new Date().toISOString() : f.data_fine_reale
        }
      }
      return f
    })

    const tutteCompletate = fasiAggiornate.every((f) => f.stato === 'completata')
    const almenoUnaInCorso = fasiAggiornate.some((f) => f.stato === 'in_corso')

    const nuovoStatoOdp = tutteCompletate
      ? 'completato'
      : almenoUnaInCorso
      ? 'in_lavorazione'
      : odp.stato

    const odpAggiornato = {
      ...odp,
      fasi: fasiAggiornate,
      stato: nuovoStatoOdp
    }

    setOdp(odpAggiornato)

    // Sincronizza nel localStorage
    const parseSicuro = <T,>(chiave: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(chiave)
        if (!item || item === 'undefined' || item === 'null') return fallback
        return JSON.parse(item) as T
      } catch {
        return fallback
      }
    }
    const tuttiOdp = parseSicuro<(OrdineProduzione & { fasi: FaseOdP[] })[]>('machinaflow_odp', SEED_ODP)
    const salvati = tuttiOdp.map((o) => (o.id === odp.id ? odpAggiornato : o))
    localStorage.setItem('machinaflow_odp', JSON.stringify(salvati))
  }

  const handleStampa = () => {
    window.print()
  }

  if (!odp) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Ordine di Produzione non trovato</h2>
        <Link
          href="/produzione"
          className="inline-flex items-center gap-2 mt-4 text-orange-400 hover:text-orange-300 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Torna agli OdP
        </Link>
      </div>
    )
  }

  const tempoTotaleStimatoMin = odp.fasi.reduce((a, b) => a + b.tempo_stimato_totale_min, 0)

  return (
    <div className="space-y-6">
      {/* Barra Azioni a Schermo (Nascosta in Stampa) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <Link
          href="/produzione"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna all'elenco OdP
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStampa}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Stampa Scheda Lavoro (A4 Print-Ready)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCHEDA DI LAVORAZIONE (LAYOUT DEDICATO SIA A VIDEO CHE ALLA STAMPA A4)    */}
      {/* ========================================================================= */}
      <div className="bg-white text-black p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Header Scheda con Logo e QR Code */}
        <div className="flex items-start justify-between border-b-2 border-black pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight uppercase">
                MACHINA<span className="text-orange-600 print:text-black">FLOW</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 print:text-black border-l-2 border-slate-300 pl-2">
                PCP & MES OFFICINA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase mt-2 tracking-tight">
              Scheda di Lavorazione & Viaggio
            </h1>
            <p className="text-xs text-slate-600 print:text-black mt-0.5">
              Documento di produzione da allegare ai pezzi durante il flusso in officina
            </p>
          </div>

          {/* QR Code Ufficiale */}
          <div className="text-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code OdP"
                className="w-24 h-24 border border-black p-1 mx-auto"
              />
            ) : (
              <div className="w-24 h-24 border border-black flex items-center justify-center text-[10px]">
                QR Code
              </div>
            )}
            <span className="text-[10px] font-mono font-bold block mt-1">
              SCAN TOUCH
            </span>
          </div>
        </div>

        {/* Dati Principali Commessa (Griglia 3 Colonne) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-black text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black block">
              Codice OdP:
            </span>
            <strong className="text-base font-black font-mono">{odp.codice_odp}</strong>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black block">
              Quantità da Produrre:
            </span>
            <strong className="text-base font-black text-orange-600 print:text-black">
              {odp.quantita_da_produrre} {articolo?.unita_misura}
            </strong>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black block">
              Data Consegna Pianificata:
            </span>
            <strong className="text-sm font-bold">
              {odp.data_fine_pianificata || 'Non specificata'}
            </strong>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black block">
              Tempo Totale Stimato:
            </span>
            <strong className="text-sm font-bold">
              {Math.floor(tempoTotaleStimatoMin / 60)}h {tempoTotaleStimatoMin % 60}m
            </strong>
          </div>
        </div>

        {/* Dati Articolo */}
        <div className="py-3 border-b border-black text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black">Articolo: </span>
              <span className="font-mono font-black text-sm">{articolo?.codice_articolo}</span>
              <span className="mx-2">—</span>
              <span className="font-bold text-sm">{articolo?.descrizione}</span>
            </div>
          </div>
          {odp.note && (
            <p className="mt-1 text-slate-700 print:text-black text-[11px] italic">
              Note commessa: {odp.note}
            </p>
          )}
        </div>

        {/* TABELLA SEQUENZA DELLE FASI DI LAVORAZIONE */}
        <div className="mt-6">
          <h2 className="text-xs font-black uppercase tracking-wider mb-2">
            Sequenza Fasi Esecutive di Officina
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 border-b border-black font-black uppercase text-[10px]">
                  <th className="p-2.5 border-r border-black w-12 text-center">Seq</th>
                  <th className="p-2.5 border-r border-black">Fase Operativa</th>
                  <th className="p-2.5 border-r border-black">Centro Lavoro / Macchina</th>
                  <th className="p-2.5 border-r border-black w-24 text-center">Tempo Previsto</th>
                  <th className="p-2.5 border-r border-black w-24 text-center">Data / Ora Inizio</th>
                  <th className="p-2.5 border-r border-black w-24 text-center">Data / Ora Fine</th>
                  <th className="p-2.5 w-24 text-center">Firma Op.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {odp.fasi.map((fase) => {
                  const centro = centriLavoro.find((c) => c.id === fase.centro_lavoro_id)

                  return (
                    <tr key={fase.id} className="border-b border-black">
                      <td className="p-2.5 border-r border-black text-center font-bold font-mono">
                        {fase.sequenza}
                      </td>
                      <td className="p-2.5 border-r border-black">
                        <strong className="block font-bold">{fase.nome_fase}</strong>
                        {fase.note_officina && (
                          <span className="text-[10px] text-slate-600 print:text-black block mt-0.5">
                            {fase.note_officina}
                          </span>
                        )}
                        {/* Status visuale a schermo (Sola Lettura) */}
                        <div className="no-print mt-1.5 flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              fase.stato === 'completata'
                                ? 'bg-emerald-100 text-emerald-800'
                                : fase.stato === 'in_corso'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {fase.stato.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="p-2.5 border-r border-black">
                        <span className="font-semibold">{centro ? centro.nome : 'N/D'}</span>
                        <span className="text-[10px] text-slate-500 print:text-black block">
                          [{centro?.codice}] {centro?.reparto}
                        </span>
                        {fase.centri_lavoro_alternativi_ids && fase.centri_lavoro_alternativi_ids.length > 0 && (
                          <div className="mt-1 text-[9px] text-slate-600 print:text-black font-medium border-t border-slate-200 print:border-black pt-0.5">
                            <strong>Alt: </strong>
                            {fase.centri_lavoro_alternativi_ids
                              .map((id) => centriLavoro.find((c) => c.id === id)?.codice)
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="p-2.5 border-r border-black text-center font-bold">
                        {fase.tempo_stimato_totale_min} min
                      </td>

                      <td className="p-2.5 border-r border-black text-center text-[10px] print:text-transparent">
                        {fase.data_inizio_reale
                          ? new Date(fase.data_inizio_reale).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '____:____'}
                      </td>

                      <td className="p-2.5 border-r border-black text-center text-[10px] print:text-transparent">
                        {fase.data_fine_reale
                          ? new Date(fase.data_fine_reale).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '____:____'}
                      </td>

                      <td className="p-2.5 text-center text-[10px]">
                        <div className="w-16 h-6 border-b border-dashed border-black mx-auto mt-2" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note e Firme Collaudo a fondo pagina */}
        <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="font-bold uppercase text-[10px] block mb-1">
              Note di Controllo Qualità & Non Conformità:
            </span>
            <div className="h-16 border border-black p-2 text-slate-400 print:text-black text-[10px]">
              Verifica quote dimensionali a disegno prima dell'imballaggio.
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="font-bold uppercase text-[10px] block">
                Visto Responsabile di Produzione:
              </span>
              <div className="h-8 border-b border-black mt-4" />
            </div>
            <div className="text-[9px] text-slate-500 print:text-black text-right">
              Stampato dal sistema MachinaFlow • {new Date().toLocaleDateString('it-IT')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
