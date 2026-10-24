'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Boxes,
  ArrowRight,
  TrendingDown,
  Clock,
  Printer,
  Download,
  PlusCircle,
  Truck,
  Plus,
  RotateCcw,
  Search,
  Check
} from 'lucide-react'
import {
  Articolo,
  ComponenteDistintaBase,
  OrdineProduzione,
  FaseOdP
} from '@/types/database'
import {
  SEED_ARTICOLI,
  SEED_DISTINTA_BASE,
  SEED_ODP
} from '@/lib/data-service'

interface RigaMRP {
  componente: Articolo
  fabbisognoLordo: number
  giacenzaAttuale: number
  scortaMinima: number
  fabbisognoNetto: number // Mancante se > 0
  stato: 'critico' | 'attenzione' | 'sufficiente'
  ordiniCoinvolti: string[]
}

export default function MRPPage() {
  const [righeMrp, setRigheMrp] = useState<RigaMRP[]>([])
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [distinte, setDistinte] = useState<ComponenteDistintaBase[]>([])
  const [odpList, setOdpList] = useState<(OrdineProduzione & { fasi: FaseOdP[] })[]>([])

  // Stato Modale Carico Merce Rapido
  const [modaleCaricoAperta, setModaleCaricoAperta] = useState(false)
  const [ricercaMaterialeCarico, setRicercaMaterialeCarico] = useState('')
  const [formCarico, setFormCarico] = useState({
    articolo_id: '',
    quantita_entrata: 10,
    ddt_riferimento: '',
    fornitore_nome: '',
    note: ''
  })
  const [notificaCarico, setNotificaCarico] = useState<string | null>(null)
  const [dataStampa, setDataStampa] = useState('')
  const [codiceDocStampa, setCodiceDocStampa] = useState('MRP-2026')

  useEffect(() => {
    const oggi = new Date()
    setDataStampa(
      oggi.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    )
    setCodiceDocStampa(`MRP-${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}`)
  }, [])

  const ricalcolaMrp = (articoliList: Articolo[], distinteList: ComponenteDistintaBase[], odpCaricati: (OrdineProduzione & { fasi: FaseOdP[] })[]) => {
    // =========================================================================
    // CALCOLO MRP (FABBISOGNO MATERIALI)
    // =========================================================================
    const odpAperti = odpCaricati.filter((o) => o.stato !== 'completato')
    const accumulatoreFabbisogni: Record<string, { qtaLorda: number; odpCodes: Set<string> }> = {}

    odpAperti.forEach((odp) => {
      const componentiBom = distinteList.filter((d) => d.articolo_padre_id === odp.articolo_id)
      componentiBom.forEach((comp) => {
        const fabbisognoOdP = comp.quantita_necessaria * odp.quantita_da_produrre
        if (!accumulatoreFabbisogni[comp.articolo_componente_id]) {
          accumulatoreFabbisogni[comp.articolo_componente_id] = {
            qtaLorda: 0,
            odpCodes: new Set()
          }
        }
        accumulatoreFabbisogni[comp.articolo_componente_id].qtaLorda += fabbisognoOdP
        accumulatoreFabbisogni[comp.articolo_componente_id].odpCodes.add(odp.codice_odp)
      })
    })

    const materiePrime = articoliList.filter((a) => a.tipo !== 'prodotto_finito')
    const risultatiMrp: RigaMRP[] = materiePrime.map((materia) => {
      const infoFabbisogno = accumulatoreFabbisogni[materia.id] || { qtaLorda: 0, odpCodes: new Set() }
      const fabbisognoLordo = Number(infoFabbisogno.qtaLorda.toFixed(3))
      const giacenzaAttuale = materia.giacenza_attuale
      const scortaMinima = materia.scorta_minima

      const nettoCalcolato = Math.max(0, fabbisognoLordo + scortaMinima - giacenzaAttuale)

      let stato: 'critico' | 'attenzione' | 'sufficiente' = 'sufficiente'
      if (giacenzaAttuale < fabbisognoLordo) {
        stato = 'critico'
      } else if (giacenzaAttuale - fabbisognoLordo < scortaMinima) {
        stato = 'attenzione'
      }

      return {
        componente: materia,
        fabbisognoLordo,
        giacenzaAttuale,
        scortaMinima,
        fabbisognoNetto: Number(nettoCalcolato.toFixed(3)),
        stato,
        ordiniCoinvolti: Array.from(infoFabbisogno.odpCodes)
      }
    })

    risultatiMrp.sort((a, b) => {
      const priorita = { critico: 0, attenzione: 1, sufficiente: 2 }
      return priorita[a.stato] - priorita[b.stato]
    })

    setRigheMrp(risultatiMrp)
  }

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

    const articoliList = parseSicuro('machinaflow_articoli', SEED_ARTICOLI)
    setArticoli(articoliList)

    const distinteList = parseSicuro('machinaflow_distinte', SEED_DISTINTA_BASE)
    setDistinte(distinteList)

    const odpCaricati = parseSicuro<(OrdineProduzione & { fasi: FaseOdP[] })[]>('machinaflow_odp', SEED_ODP)
    setOdpList(odpCaricati)

    ricalcolaMrp(articoliList, distinteList, odpCaricati)
  }, [])

  // Funzione di Carico Merce
  const handleRegistraCarico = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCarico.articolo_id || formCarico.quantita_entrata <= 0) return

    const artTarget = articoli.find((a) => a.id === formCarico.articolo_id)
    if (!artTarget) return

    const vecchiaGiacenza = artTarget.giacenza_attuale
    const nuovaGiacenza = Number((vecchiaGiacenza + Number(formCarico.quantita_entrata)).toFixed(2))

    const articoliAggiornati = articoli.map((a) =>
      a.id === artTarget.id ? { ...a, giacenza_attuale: nuovaGiacenza } : a
    )

    setArticoli(articoliAggiornati)
    localStorage.setItem('machinaflow_articoli', JSON.stringify(articoliAggiornati))

    // Ricalcola subito MRP con la nuova giacenza
    ricalcolaMrp(articoliAggiornati, distinte, odpList)

    setModaleCaricoAperta(false)
    setNotificaCarico(
      `✓ Caricati +${formCarico.quantita_entrata} ${artTarget.unita_misura} di ${artTarget.codice_articolo}! Nuova giacenza: ${nuovaGiacenza} ${artTarget.unita_misura}.`
    )
    setTimeout(() => setNotificaCarico(null), 5000)

    // Reset parziale form
    setFormCarico({
      articolo_id: '',
      quantita_entrata: 10,
      ddt_riferimento: '',
      fornitore_nome: '',
      note: ''
    })
  }

  // Apertura rapida per specifico articolo cliccato in tabella
  const apriCaricoPerArticolo = (artId: string) => {
    setFormCarico((prev) => ({
      ...prev,
      articolo_id: artId,
      quantita_entrata: 10
    }))
    setRicercaMaterialeCarico('')
    setModaleCaricoAperta(true)
  }

  // Export Excel / CSV Professionale e Pulito
  const handleDownloadExcel = () => {
    // Esporta prioritariamente i materiali con fabbisogno o deficit per gli OdP attivi
    const materialiDaEsportare = righeMrp.filter((r) => r.fabbisognoLordo > 0 || r.fabbisognoNetto > 0 || r.stato !== 'sufficiente')
    
    // Se non ci sono deficit, esporta comunque tutto l'elenco ordinato
    const elencoFinale = materialiDaEsportare.length > 0 ? materialiDaEsportare : righeMrp

    const intestazioni = [
      'Codice Materiale',
      'Tipologia Materiale',
      'Descrizione Tecnica',
      'U.M.',
      'Lead Time Fornitore (gg)',
      'Giacenza Magazzino',
      'Impegnato OdP',
      'Scorta Minima',
      'QUANTITÀ DA ORDINARE',
      'Stato Approvvigionamento',
      'Prezzo Unitario Stimato (€)',
      'Valore Ordine Stimato (€)',
      'Commesse / OdP Destinazione'
    ]

    const righeCSV = elencoFinale.map((r) => {
      const mat = r.componente
      const importoStimato = Number((r.fabbisognoNetto * (mat.prezzo_riferimento || 0)).toFixed(2))

      // Identifica tipologia chiara
      let tipologia = 'Commerciale / Barra'
      if (mat.codice_articolo.startsWith('SAG-')) {
        tipologia = 'Sagoma Taglio Esterno (JIT)'
      } else if (mat.codice_articolo.startsWith('TON-') || mat.codice_articolo.startsWith('LAM-') || mat.codice_articolo.startsWith('TUB-')) {
        tipologia = 'Materia Prima da Taglio (Barra/Lamiera)'
      } else if (mat.codice_articolo.startsWith('VTE-') || mat.codice_articolo.startsWith('CUS-') || mat.codice_articolo.startsWith('FIL-')) {
        tipologia = 'Componente Commerciale / Bulloneria'
      }

      const statoLabel = r.stato === 'critico' ? 'ORDINA SUBITO' : r.stato === 'attenzione' ? 'SOTTO SCORTA' : 'OK COPERTO'
      const leadTime = mat.lead_time_giorni_fornitore !== undefined ? `${mat.lead_time_giorni_fornitore} gg` : '3 gg'

      // Racchiude sempre tra virgolette doppie ogni campo per evitare rotture di colonna con virgole e punti
      return [
        `"${mat.codice_articolo}"`,
        `"${tipologia}"`,
        `"${mat.descrizione.replace(/"/g, '""')}"`,
        `"${mat.unita_misura}"`,
        `"${leadTime}"`,
        `"${r.giacenzaAttuale}"`,
        `"${r.fabbisognoLordo}"`,
        `"${r.scortaMinima}"`,
        `"${r.fabbisognoNetto}"`,
        `"${statoLabel}"`,
        `"${(mat.prezzo_riferimento || 0).toFixed(2)}"`,
        `"${importoStimato.toFixed(2)}"`,
        `"${r.ordiniCoinvolti.join(', ')}"`
      ].join(';')
    })

    // UTF-8 BOM (\uFEFF) per corretta interpretazione caratteri in Excel
    const csvContent = '\uFEFF' + [
      intestazioni.map((h) => `"${h}"`).join(';'),
      ...righeCSV
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `MachinaFlow_Lista_Riordino_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Materiali filtrabili per la ricerca dinamica nel modale DDT
  const materialiDisponibili = articoli.filter((a) => a.tipo !== 'prodotto_finito')
  const materialiFiltratiPerCarico = materialiDisponibili.filter((m: Articolo) =>
    m.codice_articolo.toLowerCase().includes(ricercaMaterialeCarico.toLowerCase()) ||
    m.descrizione.toLowerCase().includes(ricercaMaterialeCarico.toLowerCase())
  )

  const countCritici = righeMrp.filter((r) => r.stato === 'critico').length
  const countAttenzione = righeMrp.filter((r) => r.stato === 'attenzione').length

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SEZIONE STAMPA MODULO FORMALE A4 (Visibile ESCLUSIVAMENTE in Stampa)
          ========================================================================= */}
      <div className="hidden print:block text-black bg-white font-sans text-xs p-2">
        {/* Intestazione Aziendale Formale */}
        <div className="border-b-2 border-black pb-4 mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              Richiesta Approvvigionamento & Riordino Materiali
            </h1>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              Ufficio Acquisti & Programmazione Produzione (PCP/MES)
            </p>
            <p className="text-xs text-gray-600">
              MachinaFlow Meccanica di Precisione • Stabilimento di Lucca (Tissue Converting)
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-gray-900">
              DOC: {codiceDocStampa}
            </div>
            <div className="text-xs text-gray-700 mt-1">
              Data Emissione: <strong>{dataStampa}</strong>
            </div>
            <div className="text-xs text-gray-600">
              OdP Aperti Analizzati: <strong>{odpList.filter((o) => o.stato !== 'completato').length}</strong>
            </div>
          </div>
        </div>

        {/* Sommario Sintetico */}
        <div className="mb-4 grid grid-cols-3 gap-3 border border-gray-300 p-3 bg-gray-50 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Articoli in Deficit Critico</span>
            <span className="text-base font-bold text-red-700">{countCritici} Materiali</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Articoli Sotto Scorta</span>
            <span className="text-base font-bold text-amber-700">{countAttenzione} Materiali</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Stato Copertura</span>
            <span className="text-base font-bold text-gray-900">
              {righeMrp.filter((r) => r.stato === 'sufficiente').length} su {righeMrp.length} a stock
            </span>
          </div>
        </div>

        {/* Tabella Ufficiale di Riordino per Fornitori / Magazzino */}
        <table className="w-full border-collapse border border-gray-400 text-left text-[11px] mb-6">
          <thead>
            <tr className="bg-gray-200 text-gray-900 font-bold border-b border-gray-400">
              <th className="p-2 border-r border-gray-300">Codice Materiale</th>
              <th className="p-2 border-r border-gray-300">Descrizione Tecnica / Dimensione</th>
              <th className="p-2 border-r border-gray-300 text-center">Lead Time</th>
              <th className="p-2 border-r border-gray-300 text-center">Giacenza</th>
              <th className="p-2 border-r border-gray-300 text-center">Fabbisogno OdP</th>
              <th className="p-2 border-r border-gray-300 text-center">Scorta Min.</th>
              <th className="p-2 border-r border-gray-300 text-center bg-gray-300 font-black">DA ORDINARE</th>
              <th className="p-2 border-r border-gray-300">Destinazione OdP</th>
              <th className="p-2 text-center w-24">Note Fornitore / DDT</th>
            </tr>
          </thead>
          <tbody>
            {righeMrp
              .filter((r) => r.stato !== 'sufficiente' || r.fabbisognoNetto > 0)
              .map((riga) => {
                const mat = riga.componente
                const isCritico = riga.stato === 'critico'
                const leadTime = mat.lead_time_giorni_fornitore !== undefined ? `${mat.lead_time_giorni_fornitore} gg` : '3 gg'

                return (
                  <tr key={`print-${mat.id}`} className="border-b border-gray-300">
                    <td className="p-2 font-mono font-bold text-gray-900 border-r border-gray-300 whitespace-nowrap">
                      {mat.codice_articolo}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-gray-800">
                      {mat.descrizione}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono">
                      {leadTime}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono">
                      {riga.giacenzaAttuale} {mat.unita_misura}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono text-gray-700">
                      {riga.fabbisognoLordo} {mat.unita_misura}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono text-gray-500">
                      {riga.scortaMinima} {mat.unita_misura}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-center font-mono font-black text-xs bg-gray-100">
                      {riga.fabbisognoNetto > 0 ? (
                        <span className={isCritico ? 'text-red-700 font-bold' : 'text-gray-900'}>
                          {riga.fabbisognoNetto} {mat.unita_misura}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="p-2 border-r border-gray-300 text-[10px] font-mono text-gray-700">
                      {riga.ordiniCoinvolti.join(', ') || '-'}
                    </td>
                    <td className="p-2 border-gray-300">
                      <div className="h-5 border-b border-dotted border-gray-400" />
                    </td>
                  </tr>
                )
              })}

            {righeMrp.filter((r) => r.stato !== 'sufficiente' || r.fabbisognoNetto > 0).length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500 italic">
                  Nessun materiale attualmente in deficit. Tutte le scorte coprono i fabbisogni degli OdP pianificati.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Box Firme per Autorizzazione Ufficio */}
        <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-12 text-xs">
          <div>
            <span className="block text-gray-600 font-semibold mb-6">Compilato da (Responsabile PCP / MES):</span>
            <div className="border-b border-gray-500 w-3/4" />
          </div>
          <div>
            <span className="block text-gray-600 font-semibold mb-6">Approvazione Ufficio Acquisti / Fornitori:</span>
            <div className="border-b border-gray-500 w-3/4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEZIONE GESTIONALE A SCHERMO (Nascosta durante la Stampa)
          ========================================================================= */}
      <div className="space-y-6 print:hidden">
        {/* Intestazione */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-orange-500" />
              Fabbisogno Materiali (MRP Semplificato)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Calcolo automatico del fabbisogno netto materie prime in base agli Ordini di Produzione pianificati e alle distinte base (BOM).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModaleCaricoAperta(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Registra Arrivo Merce (DDT)</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              title="Esporta foglio calcolo editabile compatibile con Microsoft Excel"
            >
              <Download className="w-4 h-4" />
              <span>Esporta Excel (.csv)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Stampa Riordino</span>
            </button>
          </div>
        </div>

        {/* Notifica Flash Carico Merce */}
        {notificaCarico && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{notificaCarico}</span>
          </div>
        )}

        {/* Banner Riassuntivo Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-900/60 text-rose-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-300">{countCritici}</div>
              <div className="text-xs font-semibold text-rose-200 uppercase tracking-wider">
                Materiali in Deficit Critico
              </div>
              <div className="text-[11px] text-slate-400">Giacenza insufficiente per gli OdP</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/60 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-900/60 text-amber-300">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-300">{countAttenzione}</div>
              <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                Sotto Scorta di Sicurezza
              </div>
              <div className="text-[11px] text-slate-400">Consigliato riordino preventivo</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-900/60 text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-300">
                {righeMrp.filter((r) => r.stato === 'sufficiente').length}
              </div>
              <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                Materiali a Stock Sufficiente
              </div>
              <div className="text-[11px] text-slate-400">Copertura garantita</div>
            </div>
          </div>
        </div>

        {/* Tabella Fabbisogni Materiali Gestionale */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-500" />
              Matrice di Calcolo Fabbisogni & Suggerimento Acquisti ai Fornitori
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {odpList.filter((o) => o.stato !== 'completato').length} OdP Aperti Analizzati
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Codice Materia Prima</th>
                  <th className="p-3.5">Descrizione</th>
                  <th className="p-3.5 text-center">Lead Time Fornitore</th>
                  <th className="p-3.5 text-center">Giacenza Attuale</th>
                  <th className="p-3.5 text-center">Fabbisogno Lordo OdP</th>
                  <th className="p-3.5 text-center">Scorta Minima</th>
                  <th className="p-3.5 text-center">Fabbisogno Netto da Ordinare</th>
                  <th className="p-3.5 text-center">Stato Approvvigionamento</th>
                  <th className="p-3.5">OdP Coinvolti</th>
                  <th className="p-3.5 text-right">Azione Rapida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {righeMrp.map((riga) => {
                  const mat = riga.componente
                  const isCritico = riga.stato === 'critico'
                  const isAttenzione = riga.stato === 'attenzione'
                  const leadTime = mat.lead_time_giorni_fornitore !== undefined ? mat.lead_time_giorni_fornitore : 3

                  return (
                    <tr
                      key={mat.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCritico ? 'bg-rose-950/20' : isAttenzione ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-orange-400">
                        {mat.codice_articolo}
                      </td>
                      <td className="p-3.5 font-medium text-white max-w-xs">
                        {mat.descrizione}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {leadTime} gg
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-200">
                        {riga.giacenzaAttuale} {mat.unita_misura}
                      </td>
                      <td className="p-3.5 text-center font-bold text-amber-400">
                        {riga.fabbisognoLordo} {mat.unita_misura}
                      </td>
                      <td className="p-3.5 text-center text-slate-400">
                        {riga.scortaMinima} {mat.unita_misura}
                      </td>
                      <td className="p-3.5 text-center">
                        {riga.fabbisognoNetto > 0 ? (
                          <span className="font-mono font-black text-sm text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                            + {riga.fabbisognoNetto} {mat.unita_misura}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">0 (Coperto)</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isCritico
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : isAttenzione
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {isCritico ? 'ORDINA SUBITO' : isAttenzione ? 'SOTTO SCORTA' : 'OK DISPONIBILE'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {riga.ordiniCoinvolti.map((code) => (
                            <span
                              key={code}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                            >
                              {code}
                            </span>
                          ))}
                          {riga.ordiniCoinvolti.length === 0 && (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => apriCaricoPerArticolo(mat.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 hover:border-orange-500 transition-all cursor-pointer group"
                          title={`Registra arrivo ${mat.codice_articolo}`}
                        >
                          <Truck className="w-3.5 h-3.5 text-orange-400 group-hover:text-white" />
                          <span>Carica DDT</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALE REGISTRA ARRIVO MERCE (DDT) */}
      {modaleCaricoAperta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                Registra Entrata Merci da Fornitore (DDT)
              </h2>
              <button
                onClick={() => setModaleCaricoAperta(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegistraCarico} className="p-5 space-y-4">
              {/* Selezione con Ricerca Rapida del Materiale */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Cerca e Seleziona Materia Prima / Componente *
                </label>

                {/* Input di Ricerca Immediata */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ricercaMaterialeCarico}
                    onChange={(e) => setRicercaMaterialeCarico(e.target.value)}
                    placeholder="Digita codice (es: SAG, TON, ALL) o descrizione..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  {ricercaMaterialeCarico && (
                    <button
                      type="button"
                      onClick={() => setRicercaMaterialeCarico('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Lista Risultati Ricerca con Selezione con 1 Click */}
                <div className="max-h-44 overflow-y-auto space-y-1 border border-slate-800/80 rounded-xl bg-slate-950/80 p-1.5 divide-y divide-slate-800/40">
                  {materialiFiltratiPerCarico.map((m) => {
                    const isSelected = formCarico.articolo_id === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setFormCarico({ ...formCarico, articolo_id: m.id })
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white font-semibold shadow-sm'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className={`font-mono font-bold block ${isSelected ? 'text-white' : 'text-orange-400'}`}>
                            {m.codice_articolo}
                          </span>
                          <span className={`text-[11px] truncate block ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                            {m.descrizione}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`block font-mono text-[11px] ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            Giac: {m.giacenza_attuale} {m.unita_misura}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-bold text-white flex items-center gap-1 justify-end">
                              <Check className="w-3 h-3" /> Selezionato
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}

                  {materialiFiltratiPerCarico.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Nessun materiale trovato per &quot;{ricercaMaterialeCarico}&quot;.
                    </div>
                  )}
                </div>

                {/* Badge Materiale Attualmente Selezionato */}
                {formCarico.articolo_id && (
                  <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      Materiale pronto al carico:{' '}
                      <strong className="text-orange-400 font-mono">
                        {articoli.find((a) => a.id === formCarico.articolo_id)?.codice_articolo}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      Giacenza attuale: {articoli.find((a) => a.id === formCarico.articolo_id)?.giacenza_attuale}{' '}
                      {articoli.find((a) => a.id === formCarico.articolo_id)?.unita_misura}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantità Arrivata (+) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formCarico.quantita_entrata}
                    onChange={(e) => setFormCarico({ ...formCarico, quantita_entrata: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-bold text-orange-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numero DDT / Bolla
                  </label>
                  <input
                    type="text"
                    placeholder="es: DDT-2026/894"
                    value={formCarico.ddt_riferimento}
                    onChange={(e) => setFormCarico({ ...formCarico, ddt_riferimento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fornitore / Acciaieria
                </label>
                <input
                  type="text"
                  placeholder="es: Marcegaglia, Cogne Acciai Speciali, Thyssenkrupp..."
                  value={formCarico.fornitore_nome}
                  onChange={(e) => setFormCarico({ ...formCarico, fornitore_nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note di Arrivo / Colata Acciaio / Certificato 3.1
                </label>
                <textarea
                  rows={2}
                  placeholder="Note colata, certificato di conformità, collocazione scaffale..."
                  value={formCarico.note}
                  onChange={(e) => setFormCarico({ ...formCarico, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {formCarico.articolo_id && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Riepilogo Giacenza Post-Carico:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {articoli.find((a) => a.id === formCarico.articolo_id)?.giacenza_attuale || 0} + {formCarico.quantita_entrata} ={' '}
                    {((articoli.find((a) => a.id === formCarico.articolo_id)?.giacenza_attuale || 0) + Number(formCarico.quantita_entrata)).toFixed(2)}{' '}
                    {articoli.find((a) => a.id === formCarico.articolo_id)?.unita_misura}
                  </span>
                </div>
              )}

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 -mx-5 -mb-5 bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setModaleCaricoAperta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Conferma Carico a Magazzino</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
