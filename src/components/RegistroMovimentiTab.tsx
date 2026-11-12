'use client'

import { useState, useMemo } from 'react'
import {
  History,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Package,
  Layers,
  Truck,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Undo2
} from 'lucide-react'
import { MovimentoMagazzino, TipoMovimentoMagazzino, Articolo, OrdineFornitore } from '@/types/database'
import { preparaCriterioRicerca, calcolaRilevanzaRicerca } from '@/lib/search-helper'
import { syncService } from '@/lib/sync-service'

interface RegistroMovimentiTabProps {
  movimenti: MovimentoMagazzino[]
  articoli: Articolo[]
  onRicarica?: () => void
}

export function RegistroMovimentiTab({
  movimenti,
  articoli,
  onRicarica
}: RegistroMovimentiTabProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('tutto')
  const [filtroRicerca, setFiltroRicerca] = useState<string>('')

  // Paginazione Intelligente
  const [paginaCorrente, setPaginaCorrente] = useState<number>(1)
  const [perPagina, setPerPagina] = useState<number>(25)
  const [inStornoId, setInStornoId] = useState<string | null>(null)
  const [notifica, setNotifica] = useState<string | null>(null)

  // Reset a pagina 1 quando cambiano i filtri
  const impostaFiltroTipo = (tipo: string) => {
    setFiltroTipo(tipo)
    setPaginaCorrente(1)
  }
  const impostaFiltroPeriodo = (periodo: string) => {
    setFiltroPeriodo(periodo)
    setPaginaCorrente(1)
  }
  const impostaFiltroRicerca = (ricerca: string) => {
    setFiltroRicerca(ricerca)
    setPaginaCorrente(1)
  }

  // Mappa articoli per recupero rapido
  const mappaArticoli = useMemo(() => {
    const map = new Map<string, Articolo>()
    articoli.forEach((a) => map.set(a.id, a))
    return map
  }, [articoli])

  // Movimenti arricchiti con articolo e filtrati
  const movimentiFiltrati = useMemo(() => {
    const criterio = preparaCriterioRicerca(filtroRicerca)

    const conScore: { movimento: MovimentoMagazzino & { articolo?: Articolo }; score: number }[] = []

    for (const m of movimenti) {
      // Filtro per Tipo Movimento
      if (filtroTipo !== 'tutti' && m.tipo_movimento !== filtroTipo) {
        continue
      }

      // Filtro Temporale
      if (filtroPeriodo !== 'tutto') {
        const dataMov = new Date(m.creato_il).getTime()
        const ora = Date.now()
        const unGiorno = 24 * 60 * 60 * 1000

        if (filtroPeriodo === 'oggi' && ora - dataMov > unGiorno) continue
        if (filtroPeriodo === '7gg' && ora - dataMov > 7 * unGiorno) continue
        if (filtroPeriodo === '30gg' && ora - dataMov > 30 * unGiorno) continue
      }

      const mArricchito: MovimentoMagazzino & { articolo?: Articolo } = {
        ...m,
        articolo: m.articolo || mappaArticoli.get(m.articolo_id)
      }

      if (!criterio.queryOriginale) {
        conScore.push({ movimento: mArricchito, score: 0 })
      } else {
        const score = calcolaRilevanzaRicerca(
          mArricchito.articolo?.codice_articolo || mArricchito.codice_odp,
          [
            mArricchito.articolo?.descrizione,
            mArricchito.riferimento_documento,
            mArricchito.codice_odp,
            mArricchito.lotto_colata,
            mArricchito.note,
            mArricchito.tipo_movimento
          ],
          criterio
        )

        if (score >= 0) {
          conScore.push({ movimento: mArricchito, score })
        }
      }
    }

    // Se c'è una ricerca attiva, ordina per rilevanza (il match esatto sul codice va per primo assoluto)
    if (criterio.queryOriginale) {
      conScore.sort((a, b) => b.score - a.score)
    }

    return conScore.map((x) => x.movimento)
  }, [movimenti, mappaArticoli, filtroTipo, filtroPeriodo, filtroRicerca])

  // Funzione minimale per esportazione Excel / CSV
  const handleEsportaExcel = () => {
    if (movimentiFiltrati.length === 0) return

    const headers = [
      'Data e Ora',
      'Codice Articolo',
      'Descrizione Articolo',
      'Tipo Articolo',
      'Tipo Movimento',
      'Quantita',
      'Unita Misura',
      'Giacenza Precedente',
      'Giacenza Risultante',
      'Riferimento Documento',
      'Codice OdP',
      'Lotto / Colata',
      'Note'
    ]

    const righe = movimentiFiltrati.map((m) => [
      `"${new Date(m.creato_il).toLocaleString('it-IT')}"`,
      `"${m.articolo?.codice_articolo || m.articolo_id}"`,
      `"${m.articolo?.descrizione || ''}"`,
      `"${m.articolo?.tipo || ''}"`,
      `"${m.tipo_movimento}"`,
      m.quantita,
      `"${m.unita_misura || m.articolo?.unita_misura || 'pz'}"`,
      m.giacenza_precedente,
      m.giacenza_risultante,
      `"${m.riferimento_documento || ''}"`,
      `"${m.codice_odp || ''}"`,
      `"${m.lotto_colata || ''}"`,
      `"${(m.note || '').replace(/"/g, '""')}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...righe.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `registro_movimenti_magazzino_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Storno Carico DDT / Annullamento Ricezione Merce da Fornitore
  const handleStornaCaricoDDT = async (m: MovimentoMagazzino & { articolo?: Articolo }) => {
    const art = m.articolo || mappaArticoli.get(m.articolo_id)
    const codiceArt = art?.codice_articolo || m.articolo_id
    const ddtRif = m.riferimento_documento || 'DDT Fornitore'
    const qtaDaStornare = Math.abs(m.quantita)

    const conferma = window.confirm(
      `Confermi lo STORNO del carico di ${qtaDaStornare} ${m.unita_misura || 'pz'} per l'articolo ${codiceArt}?\n\nRiferimento: ${ddtRif}\n\nEffetti:\n1. La giacenza attuale verrà scalata di ${qtaDaStornare}.\n2. Verrà registrato un movimento di storno a fini di tracciabilità.\n3. Se il carico aveva chiuso un ordine fornitore (OdA), l'ordine verrà riaperto nello stato 'in_ordine'.`
    )
    if (!conferma) return

    setInStornoId(m.id)

    try {
      // 1. Calcola e aggiorna giacenza articolo
      const giacAttuale = art ? art.giacenza_attuale : m.giacenza_risultante
      const nuovaGiacenza = Number(Math.max(0, giacAttuale - qtaDaStornare).toFixed(2))

      if (art) {
        const artAggiornato: Articolo = {
          ...art,
          giacenza_attuale: nuovaGiacenza
        }
        await syncService.salvaArticolo(artAggiornato)

        // Aggiorna cache locale articoli
        try {
          const salvati = localStorage.getItem('machinaflow_articoli')
          if (salvati) {
            const list: Articolo[] = JSON.parse(salvati)
            const idx = list.findIndex((a) => a.id === art.id)
            if (idx >= 0) {
              list[idx] = artAggiornato
              localStorage.setItem('machinaflow_articoli', JSON.stringify(list))
            }
          }
        } catch {}
      }

      // 2. Registra movimento compensatorio di storno nel registro movimenti
      await syncService.registraMovimentoMagazzino({
        articolo_id: m.articolo_id,
        tipo_movimento: 'rettifica_inventario',
        quantita: -qtaDaStornare,
        giacenza_precedente: giacAttuale,
        giacenza_risultante: nuovaGiacenza,
        unita_misura: m.unita_misura || art?.unita_misura || 'pz',
        riferimento_documento: `STORNO ${ddtRif}`,
        lotto_colata: m.lotto_colata,
        note: `Annullamento/Storno del carico errato ID ${m.id.slice(0, 12)} (${m.note || ''})`
      })

      // 3. Verifica se c'era un ordine fornitore collegato da riaprire
      // Cerca in ordini_fornitori sia per OdA citato nelle note, sia per articolo_id arrivato di recente
      try {
        const ordini = await syncService.getOrdiniFornitori()
        // Cerca riferimento OdA nelle note del movimento (es: "Rif. OdA ODA-2026-001" o "Rif. Ordine Fornitore")
        let ordineDaRiaprire: OrdineFornitore | undefined

        // Pattern regex per trovare ODA-YYYY-XXX
        const matchOda = (m.note || '').match(/ODA-\d{4}-\d{3}/i)
        if (matchOda) {
          const numOdaTrovato = matchOda[0].toUpperCase()
          ordineDaRiaprire = ordini.find((o) => o.numero_oda?.toUpperCase() === numOdaTrovato && o.stato === 'ricevuto')
        }

        // Fallback: se non c'è il codice OdA esplicito, cerca l'ultimo ordine ricevuto per questo articolo
        if (!ordineDaRiaprire) {
          ordineDaRiaprire = ordini.find(
            (o) =>
              o.stato === 'ricevuto' &&
              (o.articolo_id === m.articolo_id || (o.righe && o.righe.some((r) => r.articolo_id === m.articolo_id)))
          )
        }

        if (ordineDaRiaprire) {
          const ordineRiaperto: OrdineFornitore = {
            ...ordineDaRiaprire,
            stato: 'in_ordine'
          }
          await syncService.salvaOrdineFornitore(ordineRiaperto)
        }
      } catch (errOrd) {
        console.warn('Avviso recupero/riapertura ordine fornitore:', errOrd)
      }

      setNotifica(`✓ Carico DDT stornato con successo. Giacenza ${codiceArt} aggiornata a ${nuovaGiacenza}.`)
      setTimeout(() => setNotifica(null), 5000)

      // Ricarica la lista chiamando il genitore
      if (onRicarica) {
        onRicarica()
      }
    } catch (e) {
      console.error('Errore durante lo storno carico DDT:', e)
      alert('Si è verificato un errore durante lo storno. Riprova.')
    } finally {
      setInStornoId(null)
    }
  }

  // Paginazione
  const totaleMovimenti = movimentiFiltrati.length
  const totalePagine = Math.max(1, Math.ceil(totaleMovimenti / perPagina))
  const indiceInizio = (paginaCorrente - 1) * perPagina
  const indiceFine = Math.min(indiceInizio + perPagina, totaleMovimenti)
  const movimentiPaginati = useMemo(() => {
    return movimentiFiltrati.slice(indiceInizio, indiceFine)
  }, [movimentiFiltrati, indiceInizio, indiceFine])

  const getBadgeTipo = (tipo: TipoMovimentoMagazzino) => {
    switch (tipo) {
      case 'carico_fornitore':
        return {
          label: 'Carico Fornitore',
          bg: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400',
          icon: ArrowDownLeft,
          segno: '+'
        }
      case 'scarico_produzione':
        return {
          label: 'Prelievo OdP',
          bg: 'bg-orange-950/80 border-orange-500/30 text-orange-400',
          icon: ArrowUpRight,
          segno: ''
        }
      case 'carico_finito':
        return {
          label: 'Versamento Finito',
          bg: 'bg-blue-950/80 border-blue-500/30 text-blue-400',
          icon: CheckCircle2,
          segno: '+'
        }
      case 'scarico_ddt_cliente':
        return {
          label: 'Spedizione Cliente',
          bg: 'bg-purple-950/80 border-purple-500/30 text-purple-400',
          icon: Truck,
          segno: ''
        }
      case 'rettifica_inventario':
        return {
          label: 'Rettifica / Inventario',
          bg: 'bg-amber-950/80 border-amber-500/30 text-amber-400',
          icon: RotateCcw,
          segno: ''
        }
      default:
        return {
          label: tipo,
          bg: 'bg-slate-800 text-slate-300',
          icon: Package,
          segno: ''
        }
    }
  }

  return (
    <div className="space-y-4">
      {notifica && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{notifica}</span>
          <button
            type="button"
            onClick={() => setNotifica(null)}
            className="text-emerald-400 hover:text-white px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Filtri Rapidi & Export Minimal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/70 p-3 sm:p-4 rounded-2xl border border-slate-800">
        
        {/* Filtri Pillola Tipo Movimento */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'tutti', label: 'Tutti' },
            { id: 'carico_fornitore', label: 'Entrate DDT' },
            { id: 'scarico_produzione', label: 'Prelievi OdP' },
            { id: 'carico_produzione', label: 'Versamenti Finiti' },
            { id: 'scarico_ddt_cliente', label: 'Spedizioni' },
            { id: 'rettifica_inventario', label: 'Rettifiche' }
          ].map((pillola) => (
            <button
              key={pillola.id}
              onClick={() => impostaFiltroTipo(pillola.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroTipo === pillola.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {pillola.label}
            </button>
          ))}
        </div>

        {/* Cerca, Periodo ed Export Minimal */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          {/* Selettore Periodo Minimal */}
          <select
            value={filtroPeriodo}
            onChange={(e) => impostaFiltroPeriodo(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none focus:border-orange-500"
          >
            <option value="tutto">Tutto lo storico</option>
            <option value="oggi">Oggi</option>
            <option value="7gg">Ultimi 7 giorni</option>
            <option value="30gg">Ultimi 30 giorni</option>
          </select>

          {/* Campo Cerca */}
          <div className="relative flex-1 lg:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroRicerca}
              onChange={(e) => impostaFiltroRicerca(e.target.value)}
              placeholder="Cerca OdP, DDT, colata..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* PULSANTE EXPORT EXCEL MINIMAL */}
          <button
            onClick={handleEsportaExcel}
            disabled={movimentiFiltrati.length === 0}
            title="Esporta i movimenti filtrati in formato Excel / CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Tabella Movimenti Stile Estratto Conto */}
      {movimentiFiltrati.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">Nessun movimento registrato</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            I carichi merce, i prelievi a bordo macchina degli OdP e le spedizioni con DDT verranno tracciati automaticamente qui.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Data e Ora</th>
                  <th className="p-3">Articolo / Codice</th>
                  <th className="p-3">Tipo Movimento</th>
                  <th className="p-3 text-right">Quantità</th>
                  <th className="p-3 text-right">Giacenza Risultante</th>
                  <th className="p-3">Riferimento / Causale</th>
                  <th className="p-3">Lotto / Colata / Note</th>
                  <th className="p-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movimentiPaginati.map((m) => {
                  const badge = getBadgeTipo(m.tipo_movimento)
                  const Icon = badge.icon
                  const isPositivo = m.quantita > 0

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Data */}
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(m.creato_il).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}{' '}
                        <span className="text-[10px] text-slate-500">
                          {new Date(m.creato_il).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Articolo */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{m.articolo?.codice_articolo || m.articolo_id}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {m.articolo?.descrizione || 'Articolo'}
                        </div>
                      </td>

                      {/* Tipo Movimento */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Quantità Movimentata */}
                      <td className="p-3 text-right font-mono font-black whitespace-nowrap">
                        <span className={isPositivo ? 'text-emerald-400' : 'text-orange-400'}>
                          {isPositivo ? `+${m.quantita}` : m.quantita} {m.unita_misura || m.articolo?.unita_misura || 'pz'}
                        </span>
                      </td>

                      {/* Giacenza Risultante a Scaletta */}
                      <td className="p-3 text-right font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-bold">
                          {m.giacenza_risultante} {m.unita_misura || m.articolo?.unita_misura || 'pz'}
                        </span>
                      </td>

                      {/* Riferimento Documento / OdP */}
                      <td className="p-3">
                        {m.codice_odp && (
                          <div className="font-mono font-bold text-orange-400 text-[11px]">
                            {m.codice_odp}
                          </div>
                        )}
                        {m.riferimento_documento && m.riferimento_documento !== `OdP ${m.codice_odp}` && m.riferimento_documento !== m.codice_odp && (
                          <div className="text-slate-300 font-medium">
                            {m.riferimento_documento}
                          </div>
                        )}
                      </td>

                      {/* Colata / Note */}
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {m.lotto_colata && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-mono text-[10px] mr-1.5">
                            {m.lotto_colata}
                          </span>
                        )}
                        <span>{m.note || '-'}</span>
                      </td>

                      {/* Azioni: Storno Carico DDT per carichi fornitore */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {m.tipo_movimento === 'carico_fornitore' ? (
                          <button
                            type="button"
                            disabled={inStornoId === m.id}
                            onClick={() => handleStornaCaricoDDT(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40"
                            title="Storna questo carico DDT: scala la giacenza e riapre l'eventuale ordine fornitore"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>{inStornoId === m.id ? 'Storno...' : 'Storna DDT'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* BARRA CONTROLLI PAGINAZIONE INTELLIGENTE */}
          <div className="p-3 sm:p-4 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Visualizzati <strong className="text-white">{totaleMovimenti > 0 ? indiceInizio + 1 : 0} - {indiceFine}</strong> di{' '}
                <strong className="text-white">{totaleMovimenti}</strong> movimenti
              </span>
              <span className="text-slate-600">•</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span>Per pagina:</span>
                <select
                  value={perPagina}
                  onChange={(e) => {
                    setPerPagina(Number(e.target.value))
                    setPaginaCorrente(1)
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            {totalePagine > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={paginaCorrente === 1}
                  onClick={() => setPaginaCorrente((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Precedente</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalePagine }, (_, i) => i + 1)
                    .filter((p) => {
                      // Mostra prima, ultima e le 2 vicine alla corrente
                      return p === 1 || p === totalePagine || Math.abs(p - paginaCorrente) <= 1
                    })
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1]
                      const mostraPuntini = prev && p - prev > 1
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {mostraPuntini && <span className="px-1 text-slate-600">...</span>}
                          <button
                            type="button"
                            onClick={() => setPaginaCorrente(p)}
                            className={`min-w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                              paginaCorrente === p
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  type="button"
                  disabled={paginaCorrente === totalePagine}
                  onClick={() => setPaginaCorrente((p) => Math.min(totalePagine, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Successiva</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
