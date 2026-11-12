'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check, Building2, X } from 'lucide-react'
import { FornitoreTerzista } from '@/types/database'
import { preparaCriterioRicerca, calcolaRilevanzaRicerca } from '@/lib/search-helper'

interface SelettoreFornitoreRicercaProps {
  fornitori: FornitoreTerzista[]
  fornitoreNomeSelezionato: string
  onSeleziona: (fornitore: FornitoreTerzista | { ragione_sociale: string } | null) => void
  placeholder?: string
}

export default function SelettoreFornitoreRicerca({
  fornitori,
  fornitoreNomeSelezionato,
  onSeleziona,
  placeholder = 'Cerca fornitore per ragione sociale, città, P.IVA...'
}: SelettoreFornitoreRicercaProps) {
  const [aperto, setAperto] = useState(false)
  const [testoRicerca, setTestoRicerca] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fornitoreSelezionato = useMemo(
    () =>
      fornitori.find(
        (f) => f.ragione_sociale.trim().toLowerCase() === (fornitoreNomeSelezionato || '').trim().toLowerCase()
      ) || null,
    [fornitori, fornitoreNomeSelezionato]
  )

  // Chiudi dropdown al click fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtra e ordina con search-helper
  const fornitoriFiltrati = useMemo(() => {
    const criterio = preparaCriterioRicerca(testoRicerca)

    if (!criterio.queryOriginale) {
      return fornitori
    }

    const conScore = fornitori
      .map((f) => {
        const score = calcolaRilevanzaRicerca(
          f.ragione_sociale,
          [f.partita_iva, f.indirizzo, f.citta, f.email, f.specialita],
          criterio
        )
        if (score < 0) return null
        return { fornitore: f, score }
      })
      .filter((elem): elem is { fornitore: FornitoreTerzista; score: number } => elem !== null)

    conScore.sort((a, b) => b.score - a.score)
    return conScore.map((x) => x.fornitore)
  }, [fornitori, testoRicerca])

  const handleApri = () => {
    setAperto(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleScegli = (f: FornitoreTerzista) => {
    onSeleziona(f)
    setAperto(false)
    setTestoRicerca('')
  }

  const handleRimuovi = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSeleziona(null)
    setTestoRicerca('')
  }

  const handleUsaTestoPersonalizzato = () => {
    if (testoRicerca.trim()) {
      onSeleziona({ ragione_sociale: testoRicerca.trim() })
      setAperto(false)
      setTestoRicerca('')
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Visualizzazione Box Selezionato (identico al selettore cliente di Nuovo Ordine) */}
      <div
        onClick={handleApri}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl bg-slate-950 border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
          aperto ? 'border-sky-500 ring-1 ring-sky-500/30' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {fornitoreNomeSelezionato ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-sky-950/80 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white truncate text-xs">
                {fornitoreSelezionato ? fornitoreSelezionato.ragione_sociale : fornitoreNomeSelezionato}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                {fornitoreSelezionato?.citta && <span>{fornitoreSelezionato.citta}</span>}
                {fornitoreSelezionato?.partita_iva && <span>P.IVA: {fornitoreSelezionato.partita_iva}</span>}
                {!fornitoreSelezionato && <span className="text-amber-400 italic">Inserito manualmente</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRimuovi}
              className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
              title="Deseleziona fornitore"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-slate-500 italic select-none">
            {placeholder}
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${
            aperto ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu Ricerca */}
      {aperto && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 sticky top-0 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={testoRicerca}
              onChange={(e) => setTestoRicerca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (fornitoriFiltrati.length > 0) {
                    handleScegli(fornitoriFiltrati[0])
                  } else {
                    handleUsaTestoPersonalizzato()
                  }
                }
              }}
              placeholder="Cerca fornitore o digita nome nuovo..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {testoRicerca && (
              <button
                type="button"
                onClick={() => setTestoRicerca('')}
                className="text-slate-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {fornitoriFiltrati.length === 0 ? (
              <div className="p-3 text-center text-xs space-y-2">
                <p className="text-slate-400">Nessun fornitore in anagrafica corrisponde a &quot;{testoRicerca}&quot;</p>
                {testoRicerca.trim() && (
                  <button
                    type="button"
                    onClick={handleUsaTestoPersonalizzato}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Usa &quot;{testoRicerca.trim()}&quot; come nuovo fornitore
                  </button>
                )}
              </div>
            ) : (
              fornitoriFiltrati.map((f) => {
                const isSelected =
                  f.ragione_sociale.trim().toLowerCase() === (fornitoreNomeSelezionato || '').trim().toLowerCase()
                return (
                  <div
                    key={f.id}
                    onClick={() => handleScegli(f)}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-sky-600/20 text-white font-bold'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">
                        {f.ragione_sociale}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                        {f.citta && <span>{f.citta}</span>}
                        {f.partita_iva && <span>P.IVA: {f.partita_iva}</span>}
                        {f.email && <span className="text-slate-500 truncate max-w-[180px]">{f.email}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
