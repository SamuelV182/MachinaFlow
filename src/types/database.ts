export type RuoloUtente = 'super_admin' | 'admin_officina' | 'amministratore' | 'responsabile_produzione' | 'operatore'

export interface Azienda {
  id: string
  nome: string
  email_titolare: string
  telefono?: string
  partita_iva?: string
  citta?: string
  stato: 'attiva' | 'sospesa'
  creato_il: string
}

export interface InvitoAzienda {
  id: string
  token: string
  azienda_id: string
  email_destinatario: string
  nome_contatto?: string
  telefono?: string
  stato: 'in_attesa' | 'accettato' | 'scaduto'
  creato_da?: string
  creato_il: string
  utilizzato_il?: string
  azienda?: Azienda
}

export type TipoArticolo = 'prodotto_finito' | 'semilavorato' | 'materia_prima'

export type StatoOrdineCliente = 'bozza' | 'confermato' | 'in_produzione' | 'evaso' | 'annullato'

export type StatoOdP = 'pianificato' | 'rilasciato' | 'in_lavorazione' | 'completato' | 'sospeso'

export type StatoFase = 'non_iniziata' | 'in_corso' | 'completata' | 'bloccata'

export interface ProfiloUtente {
  id: string
  nome: string
  cognome: string
  ruolo: RuoloUtente
  creato_il: string
}

export interface CentroLavoro {
  id: string
  codice: string
  nome: string
  reparto: string
  capacita_giornaliera_ore: number
  costo_orario: number
  attivo: boolean
  creato_il: string
}

export interface TipoProcesso {
  id: string
  codice: string
  nome: string
  descrizione?: string
  centro_lavoro_predefinito_id?: string
  colore_badge?: string
  attivo: boolean
  creato_il: string
}

export type ModelloTariffaEsterna = 'peso_kg' | 'superficie_dm2' | 'superficie_m2' | 'pezzo_fisso' | 'lotto_forfettario'

export interface Articolo {
  id: string
  codice_articolo: string
  descrizione: string
  tipo: TipoArticolo
  unita_misura: string
  giacenza_attuale: number
  scorta_minima: number
  lead_time_giorni_fornitore?: number
  prezzo_riferimento?: number
  peso_kg_unitario?: number
  superficie_m2_unitaria?: number
  creato_il: string
}

export interface OrdineFornitore {
  id: string
  articolo_id: string
  quantita_ordinata: number
  fornitore_nome: string
  data_ordine: string
  data_arrivo_prevista: string
  stato: 'in_ordine' | 'ricevuto' | 'annullato'
  note?: string
  creato_il: string
}

export interface ComponenteDistintaBase {
  id: string
  articolo_padre_id: string
  articolo_componente_id: string
  quantita_necessaria: number
  note?: string
  componente?: Articolo
}

export interface FaseCicloStandard {
  id: string
  articolo_id: string
  sequenza: number
  nome_fase: string
  tipo_processo_id?: string
  centro_lavoro_id: string
  centri_lavoro_alternativi_ids?: string[] // Macchine compatibili per bilanciamento carico
  tempo_attrezzaggio_min: number
  tempo_ciclo_pezzo_min: number
  note_operative?: string
  // Campi dedicati per Lavorazione Esterna / Conto Terzi (es. Zincatura, Trattamenti termici, Verniciatura)
  is_esterna?: boolean
  fornitore_nome?: string
  giorni_rientro_previsti?: number
  modello_tariffa?: ModelloTariffaEsterna
  costo_tariffa_valore?: number // es. 1.50 per 1.50 €/kg o 12.00 per €/m²
  costo_minimo_fornitura?: number // es. minimo fatturabile 60€
  centro_lavoro?: CentroLavoro
  tipo_processo?: TipoProcesso
}

export interface Cliente {
  id: string
  ragione_sociale: string
  partita_iva?: string
  email?: string
  telefono?: string
  indirizzo?: string
  creato_il: string
}

export interface OrdineCliente {
  id: string
  numero_ordine: string
  cliente_id: string
  data_ordine: string
  data_consegna_concordata: string
  stato: StatoOrdineCliente
  note?: string
  cliente?: Cliente
  righe?: RigaOrdineCliente[]
  creato_il: string
}

export interface RigaOrdineCliente {
  id: string
  ordine_cliente_id: string
  articolo_id: string
  quantita: number
  prezzo_unitario?: number
  articolo?: Articolo
}

export interface OrdineProduzione {
  id: string
  codice_odp: string
  riga_ordine_cliente_id?: string
  articolo_id: string
  quantita_da_produrre: number
  quantita_prodotta: number
  data_inizio_pianificata?: string
  data_fine_pianificata?: string
  stato: StatoOdP
  qr_code_token: string
  priorita: number // 1: Bassa, 2: Media, 3: Alta, 4: Urgente
  note?: string
  articolo?: Articolo
  riga_ordine?: RigaOrdineCliente
  fasi?: FaseOdP[]
  creato_il: string
}

export interface FaseOdP {
  id: string
  odp_id: string
  sequenza: number
  nome_fase: string
  tipo_processo_id?: string
  centro_lavoro_id: string
  centri_lavoro_alternativi_ids?: string[] // Macchine compatibili per spostamento pezzo
  tempo_stimato_totale_min: number
  tempo_effettivo_min: number
  stato: StatoFase
  operatore_id?: string
  data_inizio_reale?: string
  data_fine_reale?: string
  note_officina?: string
  // Campi dedicati per Lavorazione Esterna / Conto Terzi
  is_esterna?: boolean
  fornitore_nome?: string
  giorni_rientro_previsti?: number
  modello_tariffa?: ModelloTariffaEsterna
  costo_tariffa_valore?: number
  costo_minimo_fornitura?: number
  costo_totale_previsto?: number
  costo_totale_effettivo?: number
  stato_esterna?: 'in_attesa_uscita' | 'inviato_al_terzista' | 'rientrato'
  ddt_uscita_numero?: string
  data_uscita_terzista?: string
  data_rientro_terzista?: string
  ddt_rientro_numero?: string
  centro_lavoro?: CentroLavoro
  tipo_processo?: TipoProcesso
  operatore?: ProfiloUtente
}
