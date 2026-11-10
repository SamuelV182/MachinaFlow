export interface CriterioRicerca {
  queryOriginale: string
  isExact: boolean
  tokens: string[]
}

/**
 * Analizza la stringa di ricerca dell'utente:
 * - Se racchiusa tra virgolette (es: "AA330-001"), attiva il match esatto.
 * - Altrimenti estrae i singoli token/parole per la ricerca multi-chiave (AND).
 */
export function preparaCriterioRicerca(query: string): CriterioRicerca {
  const qTrim = query.trim()
  if (!qTrim) {
    return { queryOriginale: '', isExact: false, tokens: [] }
  }

  // Verifica se è tra virgolette (doppie o singole)
  const matchVirgolette = qTrim.match(/^["'«](.*?)["'»]$/)
  if (matchVirgolette && matchVirgolette[1].trim()) {
    return {
      queryOriginale: matchVirgolette[1].trim().toLowerCase(),
      isExact: true,
      tokens: [matchVirgolette[1].trim().toLowerCase()]
    }
  }

  // Ricerca normale: suddivisione in token (parole separate da spazi)
  const tokens = qTrim
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  return {
    queryOriginale: qTrim.toLowerCase(),
    isExact: false,
    tokens
  }
}

/**
 * Valuta un elemento e restituisce un punteggio di rilevanza (score):
 * - Score < 0: Non corrisponde (da escludere)
 * - Score alto: Corrispondenza perfetta (in cima alla lista)
 * - Score medio: Match di prefisso o token
 * 
 * @param codicePrimario Il codice identificativo principale (es. codice_articolo o codice_odp)
 * @param campiSecondari Altri campi testuali (descrizione, lotto, documento, note)
 * @param criterio Criterio generato da preparaCriterioRicerca
 */
export function calcolaRilevanzaRicerca(
  codicePrimario: string | null | undefined,
  campiSecondari: (string | null | undefined)[],
  criterio: CriterioRicerca
): number {
  if (!criterio.queryOriginale || criterio.tokens.length === 0) return 0

  const codice = (codicePrimario || '').trim().toLowerCase()
  const testiSecondari = campiSecondari
    .filter(Boolean)
    .map((s) => (s as string).toLowerCase())
  const tuttoIlTesto = [codice, ...testiSecondari].join(' ')

  // 1. CASO MATCH ESATTO (tra virgolette "")
  if (criterio.isExact) {
    const target = criterio.queryOriginale
    // Corrispondenza esatta sul codice principale: massima priorità assoluta
    if (codice === target) return 1000
    // Corrispondenza esatta su uno dei campi secondari
    if (testiSecondari.some((t) => t === target)) return 500
    // Altrimenti escludi
    return -1
  }

  // 2. CASO MATCH NATURALE:
  // Se il codice articolo è IDENTICO alla query intera -> Punteggio Massimo
  if (codice === criterio.queryOriginale) {
    return 1000
  }

  // Se il codice INIZIA esattamente con la query (es. AA330-001 vs AA330-001.A) -> Punteggio Molto Alto
  if (codice.startsWith(criterio.queryOriginale)) {
    return 500 - (codice.length - criterio.queryOriginale.length)
  }

  // Se il codice CONTIENE la query per intero
  if (codice.includes(criterio.queryOriginale)) {
    return 250
  }

  // 3. CASO TOKEN MULTIPLI (tutte le parole devono essere presenti in AND)
  const tuttiTokenPresenti = criterio.tokens.every((token) => tuttoIlTesto.includes(token))
  if (!tuttiTokenPresenti) {
    return -1
  }

  // Più token sono presenti nel codice primario, maggiore è la rilevanza
  let score = 50
  for (const token of criterio.tokens) {
    if (codice.includes(token)) score += 20
  }

  return score
}
