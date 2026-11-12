'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check, Building2, X, Plus } from 'lucide-react'
import { FornitoreTerzista } from '@/types/database'
import { preparaCriterioRicerca, calcolaRilevanzaRicerca } from '@/lib/search-helper'

interface SelettoreFornitoriMultiploProps {
  fornitori: FornitoreTerzista[]
  fornitoriSelezionati: { id?: string; nome: string; email: string }[]
  onChange: (nuovi: { id?: string; nome: string; email: string }[]) => void
  placeholder?: string
}

export default function SelettoreFornitoriMultiplo({
  fornitori,
  fornitoriSelezionati,
  onChange,
  placeholder = 'Cerca fornitori per nome, specialità, città...'
}: SelettoreFornitoriMultiploProps) {
  const [aperto, setAperto] = useState(false)
  const [testoRicerca, setTestoRicerca] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fornitoriFiltrati = useMemo(() => {
    const criterio = preparaCriterioRicerca(testoRicerca)
    if (!criterio.queryOriginale) return fornitori

    const conScore = fornitori
      .map((f) => {
        const score = calcolaRilevanzaRicerca(
          f.ragione_sociale,
          [f.specialita, f.citta, f.email, f.partita_iva],
          criterio
        )
        if (score < 0) return null
        return { fornitore: f, score }
      })
      .filter((elem): elem is { fornitore: FornitoreTerzista; score: number } => elem !== null)

    conScore.sort((a, b) => b.score - a.score)
    return conScore.map((x) => x.fornitore)
  }, [fornitori, testoRicerca])

  const toggleFornitore = (f: FornitoreTerzista) => {
    const esiste = fornitoriSelezionati.some(
      (item) => item.id === f.id || item.nome.toLowerCase() === f.ragione_sociale.toLowerCase()
    )
    if (esiste) {
      onChange(
        fornitoriSelezionati.filter(
          (item) => item.id !== f.id && item.nome.toLowerCase() !== f.ragione_sociale.toLowerCase()
        )
      )
    } else {
      onChange([...fornitoriSelezionati, { id: f.id, nome: f.ragione_sociale, email: f.email || '' }])
    }
  }

  const rimuoviSingolo = (nome: string) => {
    onChange(fornitoriSelezionati.filter((item) => item.nome !== nome))
  }

  const aggiungiManuale = () => {
    if (!testoRicerca.trim()) return
    const nuovoNome = testoRicerca.trim()
    if (!fornitoriSelezionati.some((f) => f.nome.toLowerCase() === nuovoNome.toLowerCase())) {
      onChange([...fornitoriSelezionati, { nome: nuovoNome, email: '' }])
    }
    setTestoRicerca('')
  }

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Badge dei fornitori già selezionati */}
      <div className="flex flex-wrap gap-1.5 min-h-[34px] p-1.5 rounded-xl bg-slate-950 border border-slate-800">
        {fornitoriSelezionati.length === 0 ? (
          <span className="text-xs text-slate-500 py-1 px-2 italic">
            Nessun fornitore selezionato. Clicca sotto per cercarli o aggiungerli.
          </span>
        ) : (
          fornitoriSelezionati.map((f) => (
            <span
              key={f.nome}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-950/80 border border-orange-600/60 text-xs font-semibold text-orange-200"
            >
              <Building2 className="w-3 h-3 text-orange-400 shrink-0" />
              <span>{f.nome}</span>
              {f.email && <span className="text-[10px] text-orange-300/70 font-mono">({f.email})</span>}
              <button
                type="button"
                onClick={() => rimuoviSingolo(f.nome)}
                className="hover:text-white hover:bg-orange-900/60 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Input di Ricerca Intelligente Fornitori */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={testoRicerca}
            onChange={(e) => {
              setTestoRicerca(e.target.value)
              if (!aperto) setAperto(true)
            }}
            onFocus={() => setAperto(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (fornitoriFiltrati.length > 0) {
                  toggleFornitore(fornitoriFiltrati[0])
                  setTestoRicerca('')
                } else if (testoRicerca.trim()) {
                  aggiungiManuale()
                }
              }
            }}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setAperto(!aperto)}
            className="absolute right-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${aperto ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown dei risultati di ricerca */}
        {aperto && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto no-scrollbar rounded-xl bg-slate-900 border border-slate-700 shadow-2xl divide-y divide-slate-800">
            {fornitoriFiltrati.map((f) => {
              const selezionato = fornitoriSelezionati.some(
                (item) => item.id === f.id || item.nome.toLowerCase() === f.ragione_sociale.toLowerCase()
              )
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFornitore(f)}
                  className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    selezionato ? 'bg-orange-950/40 text-orange-200' : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{f.ragione_sociale}</span>
                      {f.citta && <span className="text-[10px] text-slate-400">({f.citta})</span>}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {f.email ? `Email: ${f.email}` : 'Nessuna email registrata'}
                      {f.specialita ? ` • ${f.specialita}` : ''}
                    </span>
                  </div>
                  <div className="shrink-0 ml-2">
                    {selezionato ? (
                      <span className="p-1 rounded-md bg-orange-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded border border-slate-700 text-slate-400 hover:border-slate-500">
                        Seleziona
                      </span>
                    )}
                  </div>
                </button>
              )
            })}

            {testoRicerca.trim() && !fornitori.some((f) => f.ragione_sociale.toLowerCase() === testoRicerca.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={aggiungiManuale}
                className="w-full text-left p-2.5 flex items-center gap-2 text-xs text-orange-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi fornitore manuale: &quot;{testoRicerca.trim()}&quot;</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
