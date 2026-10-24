import {
  CentroLavoro,
  TipoProcesso,
  Articolo,
  ComponenteDistintaBase,
  FaseCicloStandard,
  Cliente,
  OrdineCliente,
  RigaOrdineCliente,
  OrdineProduzione,
  FaseOdP
} from '@/types/database'

// 1. Centri di Lavoro Reali Officina Meccanica di Precisione (10 Macchine)
export const SEED_CENTRI_LAVORO: CentroLavoro[] = [
  {
    id: 'mc-seg-01',
    codice: 'SEG-01',
    nome: 'Segatrice a Nastro Automatica CNC KASTO',
    reparto: 'Taglio',
    capacita_giornaliera_ore: 8,
    costo_orario: 45,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-sal-01',
    codice: 'SAL-01',
    nome: 'Postazione Saldatura Professionale MIG/MAG & TIG Fronius',
    reparto: 'Saldatura',
    capacita_giornaliera_ore: 8,
    costo_orario: 55,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-01',
    codice: 'CNC-01',
    nome: 'Centro di Lavoro Verticale 3 Assi Haas VF-2SS',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 8,
    costo_orario: 65,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-02',
    codice: 'CNC-02',
    nome: 'Centro di Lavoro Verticale 3 Assi Haas VF-4',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 8,
    costo_orario: 68,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-03',
    codice: 'CNC-03',
    nome: 'Centro di Lavoro 4 Assi Orizzontale DMG MORI NHX 4000',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 16,
    costo_orario: 85,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-04',
    codice: 'CNC-04',
    nome: 'Centro di Lavoro 4 Assi Orizzontale Mazak HCN-5000',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 16,
    costo_orario: 85,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-05',
    codice: 'CNC-05',
    nome: 'Centro di Lavoro 5 Assi Continuo Hermle C 42 U',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 16,
    costo_orario: 110,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-06',
    codice: 'CNC-06',
    nome: 'Centro di Lavoro 5 Assi Continuo DMG MORI DMU 50',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 8,
    costo_orario: 95,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cnc-07',
    codice: 'CNC-07',
    nome: 'Centro di Lavoro Pallettizzato Alta Velocità Makino a51nx',
    reparto: 'Fresatura',
    capacita_giornaliera_ore: 16,
    costo_orario: 90,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cam-01',
    codice: 'UFF-CAM',
    nome: 'Stazione CAD/CAM Ufficio Tecnico (HyperMill / Mastercam)',
    reparto: 'Ufficio Tecnico',
    capacita_giornaliera_ore: 8,
    costo_orario: 50,
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mc-cmm-01',
    codice: 'CMM-01',
    nome: 'Macchina di Misura a Coordinate 3D ZEISS PRISMO',
    reparto: 'Controllo Qualità',
    capacita_giornaliera_ore: 8,
    costo_orario: 75,
    attivo: true,
    creato_il: new Date().toISOString()
  }
]

// 2. Tipi di Processo Industriali
export const SEED_TIPI_PROCESSO: TipoProcesso[] = [
  {
    id: 'proc-cam',
    codice: 'PROC-CAD-CAM',
    nome: 'Programmazione CAD/CAM & Setup Utensili',
    descrizione: 'Elaborazione percorsi utensile 3D, simulazione anticollisione e invio programma a bordo macchina',
    centro_lavoro_predefinito_id: 'mc-cam-01',
    colore_badge: '#0ea5e9', // Sky Blue
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'proc-taglio',
    codice: 'PROC-TAGLIO',
    nome: 'Taglio a Nastro da Barra / Profilo',
    descrizione: 'Taglio automatico barre tonde, piatte o tubolari secondo distinta pezzo',
    centro_lavoro_predefinito_id: 'mc-seg-01',
    colore_badge: '#ea580c', // Orange
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'proc-saldatura',
    codice: 'PROC-SALDATURA',
    nome: 'Saldatura MIG / TIG Certificata',
    descrizione: 'Unione e saldatura parti metalliche inox/acciaio con controllo visivo cordoni',
    centro_lavoro_predefinito_id: 'mc-sal-01',
    colore_badge: '#f59e0b', // Amber
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'proc-fresatura-3x',
    codice: 'PROC-FRESATURA-3X',
    nome: 'Fresatura CNC 3 Assi Standard',
    descrizione: 'Spianatura, contornatura, cave e forature verticali',
    centro_lavoro_predefinito_id: 'mc-cnc-01',
    colore_badge: '#3b82f6', // Blue
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'proc-fresatura-4x',
    codice: 'PROC-FRESATURA-4X',
    nome: 'Fresatura Orizzontale 4 Assi Pallet',
    descrizione: 'Lavorazione multisuperficie a 4 facce su cubi tomba per lotti medio-alti',
    centro_lavoro_predefinito_id: 'mc-cnc-03',
    colore_badge: '#6366f1', // Indigo
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'proc-fresatura-5x',
    codice: 'PROC-FRESATURA-5X',
    nome: 'Fresatura 5 Assi Continui Precisione',
    descrizione: 'Lavorazioni complesse sottosquadra, superfici sculturate e tolleranze ristrette',
    centro_lavoro_predefinito_id: 'mc-cnc-05',
    colore_badge: '#8b5cf6', // Violet
    attivo: true,
    creato_il: new Date().toISOString()
  },
  {
    id: 'proc-collaudo-3d',
    codice: 'PROC-COLLAUDO-3D',
    nome: 'Collaudo Dimensionale & Report CMM 3D',
    descrizione: 'Scansione a contatto con sonda sferica, verifica quote e stampa report certificato',
    centro_lavoro_predefinito_id: 'mc-cmm-01',
    colore_badge: '#10b981', // Emerald
    attivo: true,
    creato_il: new Date().toISOString()
  }
]

// 3. Catalogo Articoli Finiti Settore Macchine per Carta (Fresati & Carpenteria Saldata)
export const SEED_ARTICOLI: Articolo[] = [
  {
    id: 'art-01',
    codice_articolo: 'PIA-SPA-01',
    descrizione: 'Spalla di Supporto Gruppo Taglio da Sagoma Pantografata sp.40',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 3,
    scorta_minima: 2,
    prezzo_riferimento: 820.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-02',
    codice_articolo: 'PIA-SUP-02',
    descrizione: 'Piastra Guida Lineare Spianata e Forata per Slitta Portalama',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 6,
    scorta_minima: 4,
    prezzo_riferimento: 340.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-03',
    codice_articolo: 'STR-SAL-03',
    descrizione: 'Traversa Saldata Gruppo Taglio Longitudinale Tubolare+Piatti',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 2,
    scorta_minima: 1,
    prezzo_riferimento: 1650.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-04',
    codice_articolo: 'BLC-COL-04',
    descrizione: 'Blocco Monolitico di Connessione Spalle Cilindro Goffratore',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 4,
    scorta_minima: 2,
    prezzo_riferimento: 680.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-05',
    codice_articolo: 'BRA-SVO-05',
    descrizione: 'Braccio Mobile per Sollevamento Bobina Madre da Sagoma Sp.50',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 2,
    scorta_minima: 1,
    prezzo_riferimento: 1150.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-06',
    codice_articolo: 'COR-POR-06',
    descrizione: 'Corpo Porta-Lama Pneumatico Slitter Unit Fresato 5 Assi',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 10,
    scorta_minima: 5,
    prezzo_riferimento: 420.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-07',
    codice_articolo: 'BAN-SAL-07',
    descrizione: 'Basamento Elettrosaldato Braccio Tendifilm Ribobinatrice',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 2,
    scorta_minima: 1,
    prezzo_riferimento: 1950.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-08',
    codice_articolo: 'SUP-CUS-08',
    descrizione: 'Supporto Quadro Spianato con Sede Alesata H7 per Cuscinetto Rullo',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 8,
    scorta_minima: 4,
    prezzo_riferimento: 390.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-09',
    codice_articolo: 'PIA-ANC-09',
    descrizione: 'Piastra di Ancoraggio Cilindro Pressore con Asolature di Registro',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 5,
    scorta_minima: 3,
    prezzo_riferimento: 290.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-10',
    codice_articolo: 'MON-LAT-10',
    descrizione: 'Montante Laterale a C con Piani Rettificati per Calandra Carta',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 2,
    scorta_minima: 1,
    prezzo_riferimento: 2400.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-11',
    codice_articolo: 'SLI-MIC-11',
    descrizione: 'Slitta a Coda di Rondine Regolazione Registro Velo Carta',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 7,
    scorta_minima: 4,
    prezzo_riferimento: 510.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-12',
    codice_articolo: 'BLC-DIS-12',
    descrizione: 'Blocco Distributore Pneumatico Circuiti Soffiatori Taglierina',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 6,
    scorta_minima: 3,
    prezzo_riferimento: 460.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-13',
    codice_articolo: 'SUP-MOT-13',
    descrizione: 'Cavalletto Saldato per Supporto Motore Traino Ribobinatrice',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 3,
    scorta_minima: 2,
    prezzo_riferimento: 980.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-14',
    codice_articolo: 'SET-REG-14',
    descrizione: 'Settore Sagomato Curvo Scanalato per Angolo Ingresso Carta',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 8,
    scorta_minima: 4,
    prezzo_riferimento: 330.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-15',
    codice_articolo: 'COR-PIN-15',
    descrizione: 'Corpo Pinza Freno Pneumatico Asse Svolgitore Bobina',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 5,
    scorta_minima: 3,
    prezzo_riferimento: 580.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-16',
    codice_articolo: 'SUP-SEN-16',
    descrizione: 'Piastra Fresata Supporto Cella di Carico Misura Tiro Nastro',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 12,
    scorta_minima: 6,
    prezzo_riferimento: 185.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-17',
    codice_articolo: 'TRA-POR-17',
    descrizione: 'Traversa Superiore Portagruppi Perforatori L=2400 Saldata',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 2,
    scorta_minima: 1,
    prezzo_riferimento: 2850.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-18',
    codice_articolo: 'SUP-OSC-18',
    descrizione: 'Supporto Oscillante a Forchetta per Rullo Ballerino',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 4,
    scorta_minima: 2,
    prezzo_riferimento: 720.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-19',
    codice_articolo: 'BLC-COL-19',
    descrizione: 'Cuneo Inclinato Fresato a 5 Assi per Guida Espulsione Rotolo',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 6,
    scorta_minima: 4,
    prezzo_riferimento: 430.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-20',
    codice_articolo: 'PIA-COL-20',
    descrizione: 'Piastra Collettore Vuoto Rullo Aspirante Goffratura Tissue',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 5,
    scorta_minima: 2,
    prezzo_riferimento: 870.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-21',
    codice_articolo: 'STR-CAR-21',
    descrizione: 'Carrello Mobile Elettrosaldato Ribobinatrice per Cambio Formato',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 2,
    scorta_minima: 1,
    prezzo_riferimento: 1780.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-22',
    codice_articolo: 'STA-TIR-22',
    descrizione: 'Staffa di Reazione Rinforzata per Martinetto Idraulico Svolgitore',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 10,
    scorta_minima: 5,
    prezzo_riferimento: 220.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-23',
    codice_articolo: 'COR-DEV-23',
    descrizione: 'Corpo Devia-Nastro Sagomato 3D con Fori Lubrificazione',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 6,
    scorta_minima: 3,
    prezzo_riferimento: 560.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-24',
    codice_articolo: 'PIA-CHI-24',
    descrizione: 'Piastra di Chiusura e Centraggi Frontale Calandra Carta',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 4,
    scorta_minima: 2,
    prezzo_riferimento: 490.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-25',
    codice_articolo: 'TRA-INF-25',
    descrizione: 'Traversa Inferiore di Collegamento Spalle Strutturali L=2000',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 3,
    scorta_minima: 1,
    prezzo_riferimento: 1550.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-26',
    codice_articolo: 'SUP-GUI-26',
    descrizione: 'Blocco di Scorrimento per Slitte Slitter Unit Fresato 4 Assi',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 8,
    scorta_minima: 4,
    prezzo_riferimento: 370.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-27',
    codice_articolo: 'PIA-REG-27',
    descrizione: 'Piastra Spianata di Allineamento Rulli Folli Carta con Cave a T',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 6,
    scorta_minima: 3,
    prezzo_riferimento: 310.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-28',
    codice_articolo: 'COR-ESP-28',
    descrizione: 'Supporto Saldato Bracci Espulsori Rotoli Finiti Linea Tissue',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 3,
    scorta_minima: 2,
    prezzo_riferimento: 1120.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-29',
    codice_articolo: 'FLG-ATT-29',
    descrizione: 'Flangia Rettangolare di Attacco Motoriduttore su Spalla Macchina',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 8,
    scorta_minima: 4,
    prezzo_riferimento: 260.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'art-30',
    codice_articolo: 'CAR-GUI-30',
    descrizione: 'Carter di Protezione Strutturale con Fessura Passaggio Nastro',
    tipo: 'prodotto_finito',
    unita_misura: 'pz',
    giacenza_attuale: 4,
    scorta_minima: 2,
    prezzo_riferimento: 640.00,
    creato_il: new Date().toISOString()
  },

  // --- SEMILAVORATI: SAGOME TAGLIATE ESTERNE (Ordini su commessa JIT: Scorta Minima = 0) ---
  {
    id: 'mat-01',
    codice_articolo: 'SAG-S355-40',
    descrizione: 'Sagoma Pantografata Acciaio S355 sp.40mm per Spalla Gruppo Taglio',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 0, // Nessuna a magazzino, da ordinare al taglio
    scorta_minima: 0,
    lead_time_giorni_fornitore: 5,
    prezzo_riferimento: 280.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-02',
    codice_articolo: 'SAG-S355-50',
    descrizione: 'Sagoma Ossitaglio Acciaio S355J2 sp.50mm per Braccio Mobile Svolgitore',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 0, // Nessuna a magazzino, acquisto solo su fabbisogno
    scorta_minima: 0,
    lead_time_giorni_fornitore: 7,
    prezzo_riferimento: 420.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-03',
    codice_articolo: 'SAG-S355-25',
    descrizione: 'Sagoma Tagliata ad Acqua Acciaio S355 sp.25mm per Piastre Testata',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 2, // Solo 2 pezzi rimasti da vecchia commessa
    scorta_minima: 0,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 95.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-04',
    codice_articolo: 'SAG-S355-30',
    descrizione: 'Sagoma Pantografata Acciaio S355 sp.30mm per Settore Angolare Curvo',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 0, // A zero, acquisto su commessa
    scorta_minima: 0,
    lead_time_giorni_fornitore: 5,
    prezzo_riferimento: 130.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-05',
    codice_articolo: 'SAG-ALU-30',
    descrizione: 'Sagoma Fresabile Alluminio Anticorodal 6082 sp.30mm per Collettore Vuoto',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 0, // A zero, da ordinare a fornitore taglio alluminio
    scorta_minima: 0,
    lead_time_giorni_fornitore: 6,
    prezzo_riferimento: 310.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-06',
    codice_articolo: 'SAG-S355-35',
    descrizione: 'Sagoma Pantografata Acciaio S355 sp.35mm per Piastra Chiusura Calandra',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 1, // 1 pezzo a stock
    scorta_minima: 0,
    lead_time_giorni_fornitore: 5,
    prezzo_riferimento: 160.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-07',
    codice_articolo: 'SAG-S355-60',
    descrizione: 'Sagoma Tagliata Acciaio S355 sp.60mm per Supporto Forchetta',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 0, // A zero
    scorta_minima: 0,
    lead_time_giorni_fornitore: 7,
    prezzo_riferimento: 240.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-08',
    codice_articolo: 'SAG-FE-20',
    descrizione: 'Sagoma Flangia Acciaio sp.20mm con Alleggerimento Centrale',
    tipo: 'semilavorato',
    unita_misura: 'pz',
    giacenza_attuale: 3, // Solo 3 pz a magazzino
    scorta_minima: 0,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 75.00,
    creato_il: new Date().toISOString()
  },

  // --- MATERIE PRIME: PIATTI, TUBOLARI & SCATOLATI ---
  {
    id: 'mat-09',
    codice_articolo: 'LAM-TRA-200X20',
    descrizione: 'Piatto Trafilato Acciaio C45 Sezione 200x20mm',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 18.5,
    scorta_minima: 10.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 65.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-10',
    codice_articolo: 'LAM-TRA-120X15',
    descrizione: 'Piatto Trafilato Acciaio C45 Sezione 120x15mm per Slitte',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 24.0,
    scorta_minima: 12.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 38.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-11',
    codice_articolo: 'LAM-TRA-150X30',
    descrizione: 'Piatto Trafilato Alluminio Anticorodal 6082 Sezione 150x30mm',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 14.0,
    scorta_minima: 8.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 58.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-12',
    codice_articolo: 'LAM-S275-10',
    descrizione: 'Lamiera Spianata Calibrata Acciaio S275JR sp.10mm (Formato 1x2m)',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 6,
    scorta_minima: 3,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 145.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-13',
    codice_articolo: 'TUB-STR-150X100',
    descrizione: 'Tubolare Rettangolare Strutturale Acciaio S355 150x100 sp.6mm',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 22.0,
    scorta_minima: 12.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 48.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-14',
    codice_articolo: 'TUB-STR-200X100',
    descrizione: 'Tubolare Rettangolare Pesante Acciaio S355 200x100 sp.8mm per Traverse',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 18.0,
    scorta_minima: 10.0,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 72.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-15',
    codice_articolo: 'TUB-STR-100X100',
    descrizione: 'Tubolare Quadro Strutturale Acciaio S355 100x100 sp.5mm per Basamenti',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 30.0,
    scorta_minima: 15.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 34.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-16',
    codice_articolo: 'TUB-STR-80X80',
    descrizione: 'Tubolare Quadro Acciaio S275 80x80 sp.4mm per Supporti e Cavalletti',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 26.0,
    scorta_minima: 12.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 24.00,
    creato_il: new Date().toISOString()
  },

  // --- MATERIE PRIME: MASSELLI E BLOCCHI PIENI ---
  {
    id: 'mat-17',
    codice_articolo: 'MAS-ALU-6082',
    descrizione: 'Massello Pieno Alluminio Anticorodal 6082 T6 Dim. 250x150x100mm',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 9,
    scorta_minima: 5,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 175.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-18',
    codice_articolo: 'MAS-ALU-7075',
    descrizione: 'Massello Pieno Alluminio Ergal 7075 T6 Dim. 200x120x80mm',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 14,
    scorta_minima: 6,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 195.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-19',
    codice_articolo: 'MAS-C45-180',
    descrizione: 'Blocco Forgiato Acciaio C45 Bonificato Dim. 180x180x120mm per Supporti H7',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 12,
    scorta_minima: 6,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 110.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-20',
    codice_articolo: 'MAS-39NI-200',
    descrizione: 'Blocco Acciaio Legato 39NiCrMo3 Bonificato Dim. 200x140x90mm',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 8,
    scorta_minima: 4,
    lead_time_giorni_fornitore: 4,
    prezzo_riferimento: 165.00,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-21',
    codice_articolo: 'BAR-TRA-C45-80',
    descrizione: 'Barra Quadra Trafilata Acciaio C45 Sezione 80x80mm',
    tipo: 'materia_prima',
    unita_misura: 'm',
    giacenza_attuale: 16.0,
    scorta_minima: 8.0,
    lead_time_giorni_fornitore: 3,
    prezzo_riferimento: 52.00,
    creato_il: new Date().toISOString()
  },

  // --- COMPONENTI COMMERCIALI & VITERIA ---
  {
    id: 'mat-22',
    codice_articolo: 'VIT-TCEI-M10X40',
    descrizione: 'Vite TCEI M10x40 Brunita Classe 8.8 (Conf. 100 pz)',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 250,
    scorta_minima: 100,
    lead_time_giorni_fornitore: 1,
    prezzo_riferimento: 0.35,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-23',
    codice_articolo: 'VIT-TCEI-M12X50',
    descrizione: 'Vite TCEI M12x50 Brunita Classe 10.9 (Conf. 50 pz)',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 180,
    scorta_minima: 80,
    lead_time_giorni_fornitore: 1,
    prezzo_riferimento: 0.65,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-24',
    codice_articolo: 'VIT-TCEI-M8X25',
    descrizione: 'Vite TCEI M8x25 Inox A2 per Fissaggio Carter (Conf. 100 pz)',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 300,
    scorta_minima: 120,
    lead_time_giorni_fornitore: 1,
    prezzo_riferimento: 0.28,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-25',
    codice_articolo: 'SPI-CIT-10X40',
    descrizione: 'Spina Cilindrica Rettificata Tolleranza m6 Ø10x40mm',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 120,
    scorta_minima: 50,
    lead_time_giorni_fornitore: 2,
    prezzo_riferimento: 1.10,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-26',
    codice_articolo: 'SPI-CIT-12X50',
    descrizione: 'Spina Cilindrica Rettificata Tolleranza m6 Ø12x50mm',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 95,
    scorta_minima: 40,
    lead_time_giorni_fornitore: 2,
    prezzo_riferimento: 1.45,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-27',
    codice_articolo: 'ING-ING-M6',
    descrizione: 'Ingrassatore a Testa Sferica DIN 71412 M6 Dritto',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 80,
    scorta_minima: 30,
    lead_time_giorni_fornitore: 1,
    prezzo_riferimento: 0.85,
    creato_il: new Date().toISOString()
  },
  {
    id: 'mat-28',
    codice_articolo: 'FIL-SAL-SG2',
    descrizione: 'Bobina Filo per Saldatura MIG/MAG SG2 Ø1.2mm (Rocchetto 15 kg)',
    tipo: 'materia_prima',
    unita_misura: 'pz',
    giacenza_attuale: 12,
    scorta_minima: 6,
    lead_time_giorni_fornitore: 2,
    prezzo_riferimento: 42.00,
    creato_il: new Date().toISOString()
  }
]

// 4. Distinte Base (BOM) per i 30 Prodotti Finiti
export const SEED_DISTINTA_BASE: ComponenteDistintaBase[] = [
  // 1. PIA-SPA-01: Spalla di Supporto Gruppo Taglio
  {
    id: 'bom-01-1',
    articolo_padre_id: 'art-01',
    articolo_componente_id: 'mat-01', // SAG-S355-40
    quantita_necessaria: 1,
    note: 'Sagoma pantografata sp.40'
  },
  {
    id: 'bom-01-2',
    articolo_padre_id: 'art-01',
    articolo_componente_id: 'mat-26', // SPI-CIT-12X50
    quantita_necessaria: 2,
    note: 'Spine rettificate di centraggio'
  },

  // 2. PIA-SUP-02: Piastra Guida Lineare Spianata
  {
    id: 'bom-02-1',
    articolo_padre_id: 'art-02',
    articolo_componente_id: 'mat-09', // LAM-TRA-200X20
    quantita_necessaria: 0.45,
    note: '450mm di piatto trafilato C45'
  },
  {
    id: 'bom-02-2',
    articolo_padre_id: 'art-02',
    articolo_componente_id: 'mat-22', // VIT-TCEI-M10X40
    quantita_necessaria: 6,
    note: 'Viti di fissaggio guide'
  },

  // 3. STR-SAL-03: Traversa Saldata Gruppo Taglio (Carpenteria Elettrosaldata)
  {
    id: 'bom-03-1',
    articolo_padre_id: 'art-03',
    articolo_componente_id: 'mat-14', // TUB-STR-200X100
    quantita_necessaria: 2.2,
    note: '2200mm tubolare pesante per corpo trave'
  },
  {
    id: 'bom-03-2',
    articolo_padre_id: 'art-03',
    articolo_componente_id: 'mat-03', // SAG-S355-25
    quantita_necessaria: 2,
    note: 'Piastre di testata saldate'
  },
  {
    id: 'bom-03-3',
    articolo_padre_id: 'art-03',
    articolo_componente_id: 'mat-09', // LAM-TRA-200X20
    quantita_necessaria: 1.8,
    note: 'Piatto di guida saldato superiormente e fresato'
  },
  {
    id: 'bom-03-4',
    articolo_padre_id: 'art-03',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.15,
    note: 'Consumo filo saldatura (circa 2.2 kg)'
  },

  // 4. BLC-COL-04: Blocco Monolitico di Connessione Spalle
  {
    id: 'bom-04-1',
    articolo_padre_id: 'art-04',
    articolo_componente_id: 'mat-17', // MAS-ALU-6082
    quantita_necessaria: 1,
    note: 'Massello alluminio pieno 250x150x100'
  },
  {
    id: 'bom-04-2',
    articolo_padre_id: 'art-04',
    articolo_componente_id: 'mat-23', // VIT-TCEI-M12X50
    quantita_necessaria: 4,
    note: 'Tiranti di bloccaggio spalla'
  },

  // 5. BRA-SVO-05: Braccio Mobile Sollevamento Bobina
  {
    id: 'bom-05-1',
    articolo_padre_id: 'art-05',
    articolo_componente_id: 'mat-02', // SAG-S355-50
    quantita_necessaria: 1,
    note: 'Sagoma ossitaglio sp.50mm'
  },
  {
    id: 'bom-05-2',
    articolo_padre_id: 'art-05',
    articolo_componente_id: 'mat-27', // ING-ING-M6
    quantita_necessaria: 2,
    note: 'Ingrassatori per boccola snodo'
  },

  // 6. COR-POR-06: Corpo Porta-Lama Pneumatico 5 Assi
  {
    id: 'bom-06-1',
    articolo_padre_id: 'art-06',
    articolo_componente_id: 'mat-18', // MAS-ALU-7075
    quantita_necessaria: 1,
    note: 'Massello Ergal pieno per finitura ad alta precisione'
  },
  {
    id: 'bom-06-2',
    articolo_padre_id: 'art-06',
    articolo_componente_id: 'mat-25', // SPI-CIT-10X40
    quantita_necessaria: 2,
    note: 'Spine guida slitta'
  },

  // 7. BAN-SAL-07: Basamento Elettrosaldato Braccio Tendifilm
  {
    id: 'bom-07-1',
    articolo_padre_id: 'art-07',
    articolo_componente_id: 'mat-15', // TUB-STR-100X100
    quantita_necessaria: 3.5,
    note: 'Spezzoni scatolato per telaio basamento'
  },
  {
    id: 'bom-07-2',
    articolo_padre_id: 'art-07',
    articolo_componente_id: 'mat-12', // LAM-S275-10
    quantita_necessaria: 0.3,
    note: 'Piastre fazzoletto e basi appoggio'
  },
  {
    id: 'bom-07-3',
    articolo_padre_id: 'art-07',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.2,
    note: 'Filo saldatura MIG'
  },

  // 8. SUP-CUS-08: Supporto Quadro Sede H7
  {
    id: 'bom-08-1',
    articolo_padre_id: 'art-08',
    articolo_componente_id: 'mat-19', // MAS-C45-180
    quantita_necessaria: 1,
    note: 'Blocco C45 bonificato per alesatura'
  },
  {
    id: 'bom-08-2',
    articolo_padre_id: 'art-08',
    articolo_componente_id: 'mat-27', // ING-ING-M6
    quantita_necessaria: 1,
    note: 'Ingrassatore cuscinetto'
  },

  // 9. PIA-ANC-09: Piastra Ancoraggio Cilindro Pressore
  {
    id: 'bom-09-1',
    articolo_padre_id: 'art-09',
    articolo_componente_id: 'mat-03', // SAG-S355-25
    quantita_necessaria: 1,
    note: 'Sagoma sp.25 con asolature'
  },
  {
    id: 'bom-09-2',
    articolo_padre_id: 'art-09',
    articolo_componente_id: 'mat-22', // VIT-TCEI-M10X40
    quantita_necessaria: 4,
    note: 'Fissaggio piastra'
  },

  // 10. MON-LAT-10: Montante Laterale a C Calandra Carta
  {
    id: 'bom-10-1',
    articolo_padre_id: 'art-10',
    articolo_componente_id: 'mat-14', // TUB-STR-200X100
    quantita_necessaria: 2.8,
    note: 'Montanti verticali tubolari pesanti'
  },
  {
    id: 'bom-10-2',
    articolo_padre_id: 'art-10',
    articolo_componente_id: 'mat-01', // SAG-S355-40
    quantita_necessaria: 1,
    note: 'Piede di ancoraggio a terra'
  },
  {
    id: 'bom-10-3',
    articolo_padre_id: 'art-10',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.25,
    note: 'Saldatura multipassata Fronius'
  },

  // 11. SLI-MIC-11: Slitta a Coda di Rondine
  {
    id: 'bom-11-1',
    articolo_padre_id: 'art-11',
    articolo_componente_id: 'mat-10', // LAM-TRA-120X15
    quantita_necessaria: 0.35,
    note: '350mm piatto C45 trafilato per fresatura guide'
  },
  {
    id: 'bom-11-2',
    articolo_padre_id: 'art-11',
    articolo_componente_id: 'mat-24', // VIT-TCEI-M8X25
    quantita_necessaria: 4,
    note: 'Grani e viti di registro lardoletto'
  },

  // 12. BLC-DIS-12: Blocco Distributore Pneumatico Soffiatori
  {
    id: 'bom-12-1',
    articolo_padre_id: 'art-12',
    articolo_componente_id: 'mat-18', // MAS-ALU-7075
    quantita_necessaria: 1,
    note: 'Massello Ergal ad alta tenuta pneumatica'
  },

  // 13. SUP-MOT-13: Cavalletto Saldato per Motore Traino
  {
    id: 'bom-13-1',
    articolo_padre_id: 'art-13',
    articolo_componente_id: 'mat-16', // TUB-STR-80X80
    quantita_necessaria: 1.6,
    note: 'Gambe cavalletto'
  },
  {
    id: 'bom-13-2',
    articolo_padre_id: 'art-13',
    articolo_componente_id: 'mat-08', // SAG-FE-20
    quantita_necessaria: 1,
    note: 'Piastra superiore attacco flangia motore'
  },
  {
    id: 'bom-13-3',
    articolo_padre_id: 'art-13',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.1,
    note: 'Filo saldatura'
  },

  // 14. SET-REG-14: Settore Sagomato Curvo Scanalato
  {
    id: 'bom-14-1',
    articolo_padre_id: 'art-14',
    articolo_componente_id: 'mat-04', // SAG-S355-30
    quantita_necessaria: 1,
    note: 'Sagoma pantografata sp.30mm'
  },
  {
    id: 'bom-14-2',
    articolo_padre_id: 'art-14',
    articolo_componente_id: 'mat-25', // SPI-CIT-10X40
    quantita_necessaria: 2,
    note: 'Spine posizionamento angolare'
  },

  // 15. COR-PIN-15: Corpo Pinza Freno Pneumatico
  {
    id: 'bom-15-1',
    articolo_padre_id: 'art-15',
    articolo_componente_id: 'mat-20', // MAS-39NI-200
    quantita_necessaria: 1,
    note: 'Blocco acciaio legato bonificato 39NiCrMo3'
  },
  {
    id: 'bom-15-2',
    articolo_padre_id: 'art-15',
    articolo_componente_id: 'mat-23', // VIT-TCEI-M12X50
    quantita_necessaria: 4,
    note: 'Viti alta resistenza cl.10.9 per corpo pinza'
  },

  // 16. SUP-SEN-16: Piastra Supporto Cella di Carico
  {
    id: 'bom-16-1',
    articolo_padre_id: 'art-16',
    articolo_componente_id: 'mat-11', // LAM-TRA-150X30
    quantita_necessaria: 0.25,
    note: '250mm piatto trafilato alluminio'
  },
  {
    id: 'bom-16-2',
    articolo_padre_id: 'art-16',
    articolo_componente_id: 'mat-24', // VIT-TCEI-M8X25
    quantita_necessaria: 4,
    note: 'Viti fissaggio cella'
  },

  // 17. TRA-POR-17: Traversa Superiore Portagruppi L=2400 Saldata
  {
    id: 'bom-17-1',
    articolo_padre_id: 'art-17',
    articolo_componente_id: 'mat-14', // TUB-STR-200X100
    quantita_necessaria: 2.6,
    note: 'Tubolare scatolato principale'
  },
  {
    id: 'bom-17-2',
    articolo_padre_id: 'art-17',
    articolo_componente_id: 'mat-09', // LAM-TRA-200X20
    quantita_necessaria: 2.4,
    note: 'Piatto scorrimento superiore'
  },
  {
    id: 'bom-17-3',
    articolo_padre_id: 'art-17',
    articolo_componente_id: 'mat-03', // SAG-S355-25
    quantita_necessaria: 2,
    note: 'Flange laterali montaggio'
  },
  {
    id: 'bom-17-4',
    articolo_padre_id: 'art-17',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.3,
    note: 'Filo saldatura SG2'
  },

  // 18. SUP-OSC-18: Supporto Oscillante Forchetta
  {
    id: 'bom-18-1',
    articolo_padre_id: 'art-18',
    articolo_componente_id: 'mat-07', // SAG-S355-60
    quantita_necessaria: 1,
    note: 'Sagoma sp.60mm per tasca fresata'
  },
  {
    id: 'bom-18-2',
    articolo_padre_id: 'art-18',
    articolo_componente_id: 'mat-27', // ING-ING-M6
    quantita_necessaria: 2,
    note: 'Ingrassatori perno forcella'
  },

  // 19. BLC-COL-19: Cuneo Inclinato 5 Assi
  {
    id: 'bom-19-1',
    articolo_padre_id: 'art-19',
    articolo_componente_id: 'mat-19', // MAS-C45-180
    quantita_necessaria: 1,
    note: 'Massello pieno C45'
  },

  // 20. PIA-COL-20: Piastra Collettore Vuoto Tissue
  {
    id: 'bom-20-1',
    articolo_padre_id: 'art-20',
    articolo_componente_id: 'mat-05', // SAG-ALU-30
    quantita_necessaria: 1,
    note: 'Sagoma alluminio anticorodal sp.30mm'
  },
  {
    id: 'bom-20-2',
    articolo_padre_id: 'art-20',
    articolo_componente_id: 'mat-24', // VIT-TCEI-M8X25
    quantita_necessaria: 8,
    note: 'Viti inox tenuta coperchio aspirazione'
  },

  // 21. STR-CAR-21: Carrello Mobile Elettrosaldato Ribobinatrice
  {
    id: 'bom-21-1',
    articolo_padre_id: 'art-21',
    articolo_componente_id: 'mat-15', // TUB-STR-100X100
    quantita_necessaria: 4.2,
    note: 'Scatolati telaio carrello'
  },
  {
    id: 'bom-21-2',
    articolo_padre_id: 'art-21',
    articolo_componente_id: 'mat-03', // SAG-S355-25
    quantita_necessaria: 4,
    note: 'Piastre sedi pattini a ricircolo di rulli'
  },
  {
    id: 'bom-21-3',
    articolo_padre_id: 'art-21',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.25,
    note: 'Filo saldatura'
  },

  // 22. STA-TIR-22: Staffa di Reazione Rinforzata Martinetto
  {
    id: 'bom-22-1',
    articolo_padre_id: 'art-22',
    articolo_componente_id: 'mat-03', // SAG-S355-25
    quantita_necessaria: 1,
    note: 'Sagoma sp.25mm con fori snodo martinetto'
  },
  {
    id: 'bom-22-2',
    articolo_padre_id: 'art-22',
    articolo_componente_id: 'mat-26', // SPI-CIT-12X50
    quantita_necessaria: 2,
    note: 'Spine reazione coppia'
  },

  // 23. COR-DEV-23: Corpo Devia-Nastro Sagomato 3D
  {
    id: 'bom-23-1',
    articolo_padre_id: 'art-23',
    articolo_componente_id: 'mat-17', // MAS-ALU-6082
    quantita_necessaria: 1,
    note: 'Massello anticorodal per fresatura 3D e forature profonde'
  },

  // 24. PIA-CHI-24: Piastra Chiusura Calandra Carta
  {
    id: 'bom-24-1',
    articolo_padre_id: 'art-24',
    articolo_componente_id: 'mat-06', // SAG-S355-35
    quantita_necessaria: 1,
    note: 'Sagoma sp.35mm'
  },
  {
    id: 'bom-24-2',
    articolo_padre_id: 'art-24',
    articolo_componente_id: 'mat-26', // SPI-CIT-12X50
    quantita_necessaria: 2,
    note: 'Spine di riferimento'
  },

  // 25. TRA-INF-25: Traversa Inferiore di Collegamento L=2000
  {
    id: 'bom-25-1',
    articolo_padre_id: 'art-25',
    articolo_componente_id: 'mat-13', // TUB-STR-150X100
    quantita_necessaria: 2.1,
    note: 'Scatolato strutturale'
  },
  {
    id: 'bom-25-2',
    articolo_padre_id: 'art-25',
    articolo_componente_id: 'mat-08', // SAG-FE-20
    quantita_necessaria: 2,
    note: 'Flange di testata saldate'
  },
  {
    id: 'bom-25-3',
    articolo_padre_id: 'art-25',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.15,
    note: 'Filo saldatura'
  },

  // 26. SUP-GUI-26: Blocco Scorrimento Slitte 4 Assi
  {
    id: 'bom-26-1',
    articolo_padre_id: 'art-26',
    articolo_componente_id: 'mat-21', // BAR-TRA-C45-80
    quantita_necessaria: 0.3,
    note: '300mm barra quadra 80x80 C45'
  },
  {
    id: 'bom-26-2',
    articolo_padre_id: 'art-26',
    articolo_componente_id: 'mat-25', // SPI-CIT-10X40
    quantita_necessaria: 2,
    note: 'Spine di centraggio'
  },

  // 27. PIA-REG-27: Piastra Allineamento Rulli Cave a T
  {
    id: 'bom-27-1',
    articolo_padre_id: 'art-27',
    articolo_componente_id: 'mat-09', // LAM-TRA-200X20
    quantita_necessaria: 0.6,
    note: '600mm piatto C45 trafilato per fresatura cave a T'
  },

  // 28. COR-ESP-28: Supporto Saldato Bracci Espulsori
  {
    id: 'bom-28-1',
    articolo_padre_id: 'art-28',
    articolo_componente_id: 'mat-15', // TUB-STR-100X100
    quantita_necessaria: 1.8,
    note: 'Trave scatolato per bracci'
  },
  {
    id: 'bom-28-2',
    articolo_padre_id: 'art-28',
    articolo_componente_id: 'mat-07', // SAG-S355-60
    quantita_necessaria: 2,
    note: 'Forchette snodo saldate'
  },
  {
    id: 'bom-28-3',
    articolo_padre_id: 'art-28',
    articolo_componente_id: 'mat-28', // FIL-SAL-SG2
    quantita_necessaria: 0.15,
    note: 'Filo saldatura'
  },

  // 29. FLG-ATT-29: Flangia Attacco Motoriduttore
  {
    id: 'bom-29-1',
    articolo_padre_id: 'art-29',
    articolo_componente_id: 'mat-08', // SAG-FE-20
    quantita_necessaria: 1,
    note: 'Sagoma sp.20 per centraggi e foratura flangia B5'
  },
  {
    id: 'bom-29-2',
    articolo_padre_id: 'art-29',
    articolo_componente_id: 'mat-22', // VIT-TCEI-M10X40
    quantita_necessaria: 4,
    note: 'Viti fissaggio motore'
  },

  // 30. CAR-GUI-30: Carter di Protezione Strutturale
  {
    id: 'bom-30-1',
    articolo_padre_id: 'art-30',
    articolo_componente_id: 'mat-12', // LAM-S275-10
    quantita_necessaria: 0.25,
    note: 'Pannello lamiera sagomato'
  },
  {
    id: 'bom-30-2',
    articolo_padre_id: 'art-30',
    articolo_componente_id: 'mat-16', // TUB-STR-80X80
    quantita_necessaria: 0.8,
    note: 'Cornice di rinforzo saldata'
  },
  {
    id: 'bom-30-3',
    articolo_padre_id: 'art-30',
    articolo_componente_id: 'mat-24', // VIT-TCEI-M8X25
    quantita_necessaria: 6,
    note: 'Viti inox di fissaggio carter'
  }
]

// 5. Cicli di Lavorazione Standard (Routing) per tutti i 30 Prodotti Finiti
// Con Fase 10 SEMPRE impostata a Programmazione CAD/CAM & Setup Utensili
export const SEED_FASI_CICLO: FaseCicloStandard[] = [
  // --- ARTICOLO 1: PIA-SPA-01 (Spalla Gruppo Taglio da Sagoma) ---
  {
    id: 'ciclo-01-1',
    articolo_id: 'art-01',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Importazione step 3D, calcolo percorsi fresa e simulazione anticollisione'
  },
  {
    id: 'ciclo-01-2',
    articolo_id: 'art-01',
    sequenza: 20,
    nome_fase: 'Fresatura CNC Sgrossatura Sagoma sp.40',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 22,
    note_operative: 'Staffaggio su piano magnetico e spianatura facce con fresa a inserti Ø63'
  },
  {
    id: 'ciclo-01-3',
    articolo_id: 'art-01',
    sequenza: 30,
    nome_fase: 'Fresatura 4 Assi Orizzontale Finitura & Forature H7',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-03',
    centri_lavoro_alternativi_ids: ['mc-cnc-04'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 35,
    note_operative: 'Esecuzione sedi per cuscinetti e fori calibrati spine m6'
  },
  {
    id: 'ciclo-01-4',
    articolo_id: 'art-01',
    sequenza: 40,
    nome_fase: 'Collaudo Dimensionale & Report CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Scansione ortogonalità piani e interassi fori H7'
  },

  // --- ARTICOLO 2: PIA-SUP-02 (Piastra Guida Lineare Spianata da Piatto) ---
  {
    id: 'ciclo-02-1',
    articolo_id: 'art-02',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Preparazione percorsi foratura serie M10 passo 60'
  },
  {
    id: 'ciclo-02-2',
    articolo_id: 'art-02',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro da Barra a Misura L=450mm',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 3,
    note_operative: 'Taglio perpendicolare su segatrice KASTO'
  },
  {
    id: 'ciclo-02-3',
    articolo_id: 'art-02',
    sequenza: 30,
    nome_fase: 'Fresatura Verticale 3 Assi Spianatura & Maschiatura',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 15,
    note_operative: 'Spianatura ad alta planarità entro 0.02mm su tutta la lunghezza'
  },
  {
    id: 'ciclo-02-4',
    articolo_id: 'art-02',
    sequenza: 40,
    nome_fase: 'Collaudo Dimensionale & Planarità 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Verifica planarità su piano Zeiss'
  },

  // --- ARTICOLO 3: STR-SAL-03 (Traversa Saldata Gruppo Taglio - Carpenteria) ---
  {
    id: 'ciclo-03-1',
    articolo_id: 'art-03',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 60,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Studio spianatura traversa saldata L=2200 con teste orientabili'
  },
  {
    id: 'ciclo-03-2',
    articolo_id: 'art-03',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Tubolari Pesanti e Piatti a Misura',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Taglio 2200mm tubolare 200x100 e preparazione smussi'
  },
  {
    id: 'ciclo-03-3',
    articolo_id: 'art-03',
    sequenza: 30,
    nome_fase: 'Saldatura MIG/MAG Strutturale su Dima di Allineamento',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 45,
    note_operative: 'Puntatura in dima e cordoni continui a piena penetrazione su Fronius'
  },
  {
    id: 'ciclo-03-4',
    articolo_id: 'art-03',
    sequenza: 40,
    nome_fase: 'Fresatura Orizzontale 4 Assi Spianatura Piani e Foratura',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-04',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 50,
    note_operative: 'Spianatura piano di scorrimento guide a ricircolo su Mazak'
  },
  {
    id: 'ciclo-03-5',
    articolo_id: 'art-03',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale Finale & Allineamento 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 15,
    note_operative: 'Verifica torsione e linearità asse'
  },

  // --- ARTICOLO 4: BLC-COL-04 (Blocco Monolitico Connessione Alluminio) ---
  {
    id: 'ciclo-04-1',
    articolo_id: 'art-04',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 40,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Percorsi fresatura 4 facce su cubo orizzontale'
  },
  {
    id: 'ciclo-04-2',
    articolo_id: 'art-04',
    sequenza: 20,
    nome_fase: 'Fresatura Orizzontale 4 Assi Lavorazione 4 Facce',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-03',
    centri_lavoro_alternativi_ids: ['mc-cnc-04', 'mc-cnc-07'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 28,
    note_operative: 'Sgrossatura e finitura sedi con frese per leghe leggere'
  },
  {
    id: 'ciclo-04-3',
    articolo_id: 'art-04',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Verifica quote interassi viti M12'
  },

  // --- ARTICOLO 5: BRA-SVO-05 (Braccio Mobile Sollevamento Bobina da Sagoma) ---
  {
    id: 'ciclo-05-1',
    articolo_id: 'art-05',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Definizione setup per staffaggio pezzo pesante sagomato'
  },
  {
    id: 'ciclo-05-2',
    articolo_id: 'art-05',
    sequenza: 20,
    nome_fase: 'Fresatura 3 Assi Spianatura & Barenatura Sede Snodo',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 35,
    tempo_ciclo_pezzo_min: 40,
    note_operative: 'Barenatura foro Ø80 H7 con testina d’andrea su Haas VF-4'
  },
  {
    id: 'ciclo-05-3',
    articolo_id: 'art-05',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 10,
    note_operative: 'Certificato di misura diametro snodo e perpendicolarità'
  },

  // --- ARTICOLO 6: COR-POR-06 (Corpo Porta-Lama Pneumatico 5 Assi) ---
  {
    id: 'ciclo-06-1',
    articolo_id: 'art-06',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 50,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Calcolo 5 assi continui su Hermle con strategie di raccordo trocoidale'
  },
  {
    id: 'ciclo-06-2',
    articolo_id: 'art-06',
    sequenza: 20,
    nome_fase: 'Fresatura 5 Assi Continui Precisione su Hermle',
    tipo_processo_id: 'proc-fresatura-5x',
    centro_lavoro_id: 'mc-cnc-05',
    centri_lavoro_alternativi_ids: ['mc-cnc-06'],
    tempo_attrezzaggio_min: 35,
    tempo_ciclo_pezzo_min: 32,
    note_operative: 'Lavorazione in presa unica con staffaggio autocentrante su C 42 U'
  },
  {
    id: 'ciclo-06-3',
    articolo_id: 'art-06',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D con Sonda Sferica Zeiss',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Scansione continua profilo lama e sedi o-ring di tenuta'
  },

  // --- ARTICOLO 7: BAN-SAL-07 (Basamento Elettrosaldato Braccio Tendifilm) ---
  {
    id: 'ciclo-07-1',
    articolo_id: 'art-07',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Quote spianatura basamento saldato'
  },
  {
    id: 'ciclo-07-2',
    articolo_id: 'art-07',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Scatolati Telaio',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 10,
    note_operative: 'Taglio spezzoni 100x100 e piastre'
  },
  {
    id: 'ciclo-07-3',
    articolo_id: 'art-07',
    sequenza: 30,
    nome_fase: 'Saldatura Strutturale Basamento MIG',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 55,
    note_operative: 'Assemblaggio e saldatura completa su postazione Fronius'
  },
  {
    id: 'ciclo-07-4',
    articolo_id: 'art-07',
    sequenza: 40,
    nome_fase: 'Fresatura Spianatura Piani Appoggio Guide',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-04',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 45,
    note_operative: 'Spianatura basi di fissaggio e foratura'
  },
  {
    id: 'ciclo-07-5',
    articolo_id: 'art-07',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 12,
    note_operative: 'Verifica planarità piani appoggio'
  },

  // --- ARTICOLO 8: SUP-CUS-08 (Supporto Quadro Sede H7 da Blocco C45) ---
  {
    id: 'ciclo-08-1',
    articolo_id: 'art-08',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 35,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Programmazione barenatura sede cuscinetto ISO H7'
  },
  {
    id: 'ciclo-08-2',
    articolo_id: 'art-08',
    sequenza: 20,
    nome_fase: 'Fresatura 4 Assi Sgrossatura, Sede H7 e Cave Anelli Seeger',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-03',
    centri_lavoro_alternativi_ids: ['mc-cnc-04', 'mc-cnc-07'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 24,
    note_operative: 'Alesatura con testina di precisione e controllo rugosità Ra 0.8'
  },
  {
    id: 'ciclo-08-3',
    articolo_id: 'art-08',
    sequenza: 30,
    nome_fase: 'Collaudo Sede Cuscinetto su Macchina 3D Zeiss',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Certificato di cilindricità e diametro interno'
  },

  // --- ARTICOLO 9: PIA-ANC-09 (Piastra Ancoraggio da Sagoma sp.25) ---
  {
    id: 'ciclo-09-1',
    articolo_id: 'art-09',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Percorsi fresatura asole e svasature viti'
  },
  {
    id: 'ciclo-09-2',
    articolo_id: 'art-09',
    sequenza: 20,
    nome_fase: 'Fresatura Verticale 3 Assi Asolature & Filettature',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 18,
    note_operative: 'Lavorazione asole di registro corsa cilindro'
  },
  {
    id: 'ciclo-09-3',
    articolo_id: 'art-09',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Verifica quote interasse asole'
  },

  // --- ARTICOLO 10: MON-LAT-10 (Montante Laterale Calandra - Carpenteria) ---
  {
    id: 'ciclo-10-1',
    articolo_id: 'art-10',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 60,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Setup spianature montante a C di grandi dimensioni'
  },
  {
    id: 'ciclo-10-2',
    articolo_id: 'art-10',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Travi e Sagome Piede',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 12,
    note_operative: 'Taglio su KASTO con intestatura di precisione'
  },
  {
    id: 'ciclo-10-3',
    articolo_id: 'art-10',
    sequenza: 30,
    nome_fase: 'Saldatura MIG Strutturale Multipassata',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 60,
    note_operative: 'Saldatura cordoni portanti con preriscaldo leggero'
  },
  {
    id: 'ciclo-10-4',
    articolo_id: 'art-10',
    sequenza: 40,
    nome_fase: 'Fresatura 4 Assi Orizzontale Piani e Forature Calandra',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-04',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 55,
    note_operative: 'Spianatura piani guidati calandra e forature flangiate su Mazak'
  },
  {
    id: 'ciclo-10-5',
    articolo_id: 'art-10',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 15,
    note_operative: 'Report finale parallelismo montanti'
  },

  // --- ARTICOLO 11: SLI-MIC-11 (Slitta Coda di Rondine da Piatto) ---
  {
    id: 'ciclo-11-1',
    articolo_id: 'art-11',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 35,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Percorsi fresa angolare 60° per coda di rondine'
  },
  {
    id: 'ciclo-11-2',
    articolo_id: 'art-11',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Barra Piatta L=350mm',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 3,
    note_operative: 'Taglio a squadra su Kasto'
  },
  {
    id: 'ciclo-11-3',
    articolo_id: 'art-11',
    sequenza: 30,
    nome_fase: 'Fresatura Verticale 3 Assi Profilo Coda Rondine & Lardoletto',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 26,
    note_operative: 'Finitura guide a specchio per scorrimento micrometrico'
  },
  {
    id: 'ciclo-11-4',
    articolo_id: 'art-11',
    sequenza: 40,
    nome_fase: 'Collaudo Dimensionale 3D Angoli & Rettilineità',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Verifica angolo 60° e scorrimento'
  },

  // --- ARTICOLO 12: BLC-DIS-12 (Blocco Distributore Pneumatico Ergal) ---
  {
    id: 'ciclo-12-1',
    articolo_id: 'art-12',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 40,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Forature incrociate profonde e filettature gas 1/4 e 3/8'
  },
  {
    id: 'ciclo-12-2',
    articolo_id: 'art-12',
    sequenza: 20,
    nome_fase: 'Fresatura 4 Assi Pallet Alta Velocità',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-07',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 22,
    note_operative: 'Foratura rapida con punte metallo duro a passaggio interno'
  },
  {
    id: 'ciclo-12-3',
    articolo_id: 'art-12',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D & Tenuta Fori',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Controllo profondità fori e concentricità'
  },

  // --- ARTICOLO 13: SUP-MOT-13 (Cavalletto Saldato per Motore) ---
  {
    id: 'ciclo-13-1',
    articolo_id: 'art-13',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Preparazione programma foratura flangia B5'
  },
  {
    id: 'ciclo-13-2',
    articolo_id: 'art-13',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Tubolari Scatolati',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Taglio tubolare 80x80'
  },
  {
    id: 'ciclo-13-3',
    articolo_id: 'art-13',
    sequenza: 30,
    nome_fase: 'Saldatura MIG Telaio Cavalletto',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 35,
    note_operative: 'Saldatura piastra a scatolati'
  },
  {
    id: 'ciclo-13-4',
    articolo_id: 'art-13',
    sequenza: 40,
    nome_fase: 'Fresatura 3 Assi Spianatura Flangia Attacco Motore',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 20,
    note_operative: 'Spianatura e foratura flangia su centro verticale'
  },
  {
    id: 'ciclo-13-5',
    articolo_id: 'art-13',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Controllo ortogonalità piano motore'
  },

  // --- ARTICOLO 14: SET-REG-14 (Settore Sagomato Curvo da Sagoma) ---
  {
    id: 'ciclo-14-1',
    articolo_id: 'art-14',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 35,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Interpolazione circolare raggio curvatura carta'
  },
  {
    id: 'ciclo-14-2',
    articolo_id: 'art-14',
    sequenza: 20,
    nome_fase: 'Fresatura 3 Assi Profilatura Raggio Curvo & Asolatura',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 22,
    note_operative: 'Finitura raggio continuo senza sfaccettature'
  },
  {
    id: 'ciclo-14-3',
    articolo_id: 'art-14',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Verifica raggio curvatura'
  },

  // --- ARTICOLO 15: COR-PIN-15 (Corpo Pinza Freno da 39NiCrMo3) ---
  {
    id: 'ciclo-15-1',
    articolo_id: 'art-15',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Fresatura tasche pistoni freno con tolleranza stretta'
  },
  {
    id: 'ciclo-15-2',
    articolo_id: 'art-15',
    sequenza: 20,
    nome_fase: 'Fresatura 5 Assi Continui Precisione',
    tipo_processo_id: 'proc-fresatura-5x',
    centro_lavoro_id: 'mc-cnc-05',
    centri_lavoro_alternativi_ids: ['mc-cnc-06'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 38,
    note_operative: 'Lavorazione acciaio bonificato con parametri dedicati'
  },
  {
    id: 'ciclo-15-3',
    articolo_id: 'art-15',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale CMM 3D Sedi Pistoni Freno',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Verifica alesaggio sedi pistoni H7'
  },

  // --- ARTICOLO 16: SUP-SEN-16 (Supporto Cella di Carico da Piatto Alluminio) ---
  {
    id: 'ciclo-16-1',
    articolo_id: 'art-16',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Forature centesimali per cella di carico nastro'
  },
  {
    id: 'ciclo-16-2',
    articolo_id: 'art-16',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Spezzone L=250mm',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 2,
    note_operative: 'Taglio su KASTO'
  },
  {
    id: 'ciclo-16-3',
    articolo_id: 'art-16',
    sequenza: 30,
    nome_fase: 'Fresatura Verticale 3 Assi Haas VF-2SS',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 12,
    note_operative: 'Spianatura e lamature vite M8'
  },
  {
    id: 'ciclo-16-4',
    articolo_id: 'art-16',
    sequenza: 40,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 4,
    note_operative: 'Controllo ortogonalità asse di spinta'
  },

  // --- ARTICOLO 17: TRA-POR-17 (Traversa Superiore L=2400 Saldata e Fresata) ---
  {
    id: 'ciclo-17-1',
    articolo_id: 'art-17',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 60,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Setup spianatura traversa lunga su Mazak 5000'
  },
  {
    id: 'ciclo-17-2',
    articolo_id: 'art-17',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Tubolari Pesanti e Piastre',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 12,
    note_operative: 'Taglio 2600mm tubolare e 2400mm piatto'
  },
  {
    id: 'ciclo-17-3',
    articolo_id: 'art-17',
    sequenza: 30,
    nome_fase: 'Saldatura MIG Strutturale ad Alto Deposito',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 75,
    note_operative: 'Saldatura con tiranti per contrastare imbarcamento termico'
  },
  {
    id: 'ciclo-17-4',
    articolo_id: 'art-17',
    sequenza: 40,
    nome_fase: 'Fresatura 4 Assi Orizzontale Spianatura Lunga L=2400',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-04',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 65,
    note_operative: 'Fresatura piano rettificato per guide taglierina'
  },
  {
    id: 'ciclo-17-5',
    articolo_id: 'art-17',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale CMM 3D Linearità',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 18,
    note_operative: 'Verifica rettilineità entro 0.03mm su 2400mm'
  },

  // --- ARTICOLO 18: SUP-OSC-18 (Supporto Forchetta da Sagoma sp.60) ---
  {
    id: 'ciclo-18-1',
    articolo_id: 'art-18',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 40,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Percorsi fresatura profonda tasca forcella'
  },
  {
    id: 'ciclo-18-2',
    articolo_id: 'art-18',
    sequenza: 20,
    nome_fase: 'Fresatura 4 Assi Sgrossatura Forchetta & Alesatura Fori Snodo',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-03',
    centri_lavoro_alternativi_ids: ['mc-cnc-04', 'mc-cnc-07'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 34,
    note_operative: 'Alesatura fori in linea su facce opposte'
  },
  {
    id: 'ciclo-18-3',
    articolo_id: 'art-18',
    sequenza: 30,
    nome_fase: 'Collaudo Coassialità Fori su CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Verifica coassialità fori snodo ballerino'
  },

  // --- ARTICOLO 19: BLC-COL-19 (Cuneo Inclinato 5 Assi da Blocco C45) ---
  {
    id: 'ciclo-19-1',
    articolo_id: 'art-19',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Interpolazione angolare 5 assi piano inclinato'
  },
  {
    id: 'ciclo-19-2',
    articolo_id: 'art-19',
    sequenza: 20,
    nome_fase: 'Fresatura 5 Assi Continui Precisione Hermle',
    tipo_processo_id: 'proc-fresatura-5x',
    centro_lavoro_id: 'mc-cnc-05',
    centri_lavoro_alternativi_ids: ['mc-cnc-06'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 30,
    note_operative: 'Finitura piano inclinato a 15° con rugosità Ra 0.4'
  },
  {
    id: 'ciclo-19-3',
    articolo_id: 'art-19',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale CMM 3D Angolo e Planarità',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Certificato inclinazione angolo'
  },

  // --- ARTICOLO 20: PIA-COL-20 (Piastra Collettore Vuoto da Sagoma Alluminio) ---
  {
    id: 'ciclo-20-1',
    articolo_id: 'art-20',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 40,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Matrice fori aspirazione carta e cave di tenuta o-ring'
  },
  {
    id: 'ciclo-20-2',
    articolo_id: 'art-20',
    sequenza: 20,
    nome_fase: 'Fresatura Verticale 3 Assi Haas VF-4',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 38,
    note_operative: 'Fresatura cava o-ring perimetrale e 48 fori aspirazione'
  },
  {
    id: 'ciclo-20-3',
    articolo_id: 'art-20',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Controllo profondità cava guarnizione'
  },

  // --- ARTICOLO 21: STR-CAR-21 (Carrello Mobile Ribobinatrice - Carpenteria) ---
  {
    id: 'ciclo-21-1',
    articolo_id: 'art-21',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 50,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Ciclo di ripresa carrello su Mazak orizzontale'
  },
  {
    id: 'ciclo-21-2',
    articolo_id: 'art-21',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Scatolati Telaio Carrello',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 12,
    note_operative: 'Taglio scatolati telaio'
  },
  {
    id: 'ciclo-21-3',
    articolo_id: 'art-21',
    sequenza: 30,
    nome_fase: 'Saldatura MIG Strutturale Telaio Carrello',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 60,
    note_operative: 'Saldatura cordoni completi e piastre di scorrimento'
  },
  {
    id: 'ciclo-21-4',
    articolo_id: 'art-21',
    sequenza: 40,
    nome_fase: 'Fresatura 4 Assi Spianatura Sedi Pattini di Scorrimento',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-04',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 35,
    tempo_ciclo_pezzo_min: 42,
    note_operative: 'Lavorazione simultanea 4 sedi pattini per planarità perfetta'
  },
  {
    id: 'ciclo-21-5',
    articolo_id: 'art-21',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 10,
    note_operative: 'Controllo coplanarità pattini'
  },

  // --- ARTICOLO 22: STA-TIR-22 (Staffa Martinetto da Sagoma sp.25) ---
  {
    id: 'ciclo-22-1',
    articolo_id: 'art-22',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Setup fresatura foro snodo martinetto e spine'
  },
  {
    id: 'ciclo-22-2',
    articolo_id: 'art-22',
    sequenza: 20,
    nome_fase: 'Fresatura Verticale 3 Assi Haas VF-2SS',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 16,
    note_operative: 'Barenatura foro snodo martinetto Ø35 H7'
  },
  {
    id: 'ciclo-22-3',
    articolo_id: 'art-22',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 4,
    note_operative: 'Verifica diametro H7 e posizione fori spine'
  },

  // --- ARTICOLO 23: COR-DEV-23 (Corpo Devia-Nastro da Massello Anticorodal) ---
  {
    id: 'ciclo-23-1',
    articolo_id: 'art-23',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Percorsi fresatura 3D superficie arrotondata scorrimento carta'
  },
  {
    id: 'ciclo-23-2',
    articolo_id: 'art-23',
    sequenza: 20,
    nome_fase: 'Fresatura 5 Assi Continui Precisione Hermle C 42 U',
    tipo_processo_id: 'proc-fresatura-5x',
    centro_lavoro_id: 'mc-cnc-05',
    centri_lavoro_alternativi_ids: ['mc-cnc-06'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 35,
    note_operative: 'Lavorazione con fresa a testa semisferica per finitura liscia anti-graffio velo'
  },
  {
    id: 'ciclo-23-3',
    articolo_id: 'art-23',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Scansione profilo 3D di deviazione'
  },

  // --- ARTICOLO 24: PIA-CHI-24 (Piastra Chiusura Calandra da Sagoma sp.35) ---
  {
    id: 'ciclo-24-1',
    articolo_id: 'art-24',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Centraggi circolari e foratura perimetrale'
  },
  {
    id: 'ciclo-24-2',
    articolo_id: 'art-24',
    sequenza: 20,
    nome_fase: 'Fresatura 3 Assi Spianatura & Centraggi Frontali',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 25,
    note_operative: 'Tasca di centraggio calandra Ø180 H7'
  },
  {
    id: 'ciclo-24-3',
    articolo_id: 'art-24',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 6,
    note_operative: 'Verifica tolleranza centraggio'
  },

  // --- ARTICOLO 25: TRA-INF-25 (Traversa Inferiore L=2000 - Carpenteria) ---
  {
    id: 'ciclo-25-1',
    articolo_id: 'art-25',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 40,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Setup foratura flange di testata'
  },
  {
    id: 'ciclo-25-2',
    articolo_id: 'art-25',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Tubolare e Flange',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 10,
    note_operative: 'Taglio tubolare 150x100 L=2100'
  },
  {
    id: 'ciclo-25-3',
    articolo_id: 'art-25',
    sequenza: 30,
    nome_fase: 'Saldatura Strutturale Flange su Postazione Fronius',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 45,
    note_operative: 'Saldatura a tenuta strutturale'
  },
  {
    id: 'ciclo-25-4',
    articolo_id: 'art-25',
    sequenza: 40,
    nome_fase: 'Fresatura 4 Assi Orizzontale Intestatura e Foratura Flange',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-03',
    centri_lavoro_alternativi_ids: ['mc-cnc-04'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 36,
    note_operative: 'Intestatura e foratura flange contrapposte a passo costante'
  },
  {
    id: 'ciclo-25-5',
    articolo_id: 'art-25',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 10,
    note_operative: 'Controllo lunghezza totale e interasse fori'
  },

  // --- ARTICOLO 26: SUP-GUI-26 (Blocco Scorrimento da Barra Quadra C45) ---
  {
    id: 'ciclo-26-1',
    articolo_id: 'art-26',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Percorsi fresatura 4 facce su centro orizzontale'
  },
  {
    id: 'ciclo-26-2',
    articolo_id: 'art-26',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Barra Quadra L=300mm',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 4,
    note_operative: 'Taglio su KASTO'
  },
  {
    id: 'ciclo-26-3',
    articolo_id: 'art-26',
    sequenza: 30,
    nome_fase: 'Fresatura 4 Assi Pallet Makino Alta Velocità',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-07',
    centri_lavoro_alternativi_ids: ['mc-cnc-03'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 22,
    note_operative: 'Fresatura cave di scorrimento e fori filettati M10'
  },
  {
    id: 'ciclo-26-4',
    articolo_id: 'art-26',
    sequenza: 40,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Verifica ortogonalità cave'
  },

  // --- ARTICOLO 27: PIA-REG-27 (Piastra Rulli Cave a T da Piatto C45) ---
  {
    id: 'ciclo-27-1',
    articolo_id: 'art-27',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Fresatura con fresa a T per cave unificate DIN 650'
  },
  {
    id: 'ciclo-27-2',
    articolo_id: 'art-27',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Piatto L=600mm',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 4,
    note_operative: 'Taglio su KASTO'
  },
  {
    id: 'ciclo-27-3',
    articolo_id: 'art-27',
    sequenza: 30,
    nome_fase: 'Fresatura 3 Assi Spianatura & Esecuzione Cave a T',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 24,
    note_operative: 'Passata di sgrossatura cava diritta e finitura con fresa a T'
  },
  {
    id: 'ciclo-27-4',
    articolo_id: 'art-27',
    sequenza: 40,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Controllo passo e parallelismo cave a T'
  },

  // --- ARTICOLO 28: COR-ESP-28 (Supporto Bracci Espulsori - Carpenteria) ---
  {
    id: 'ciclo-28-1',
    articolo_id: 'art-28',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 45,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Allineamento fori snodi saldati'
  },
  {
    id: 'ciclo-28-2',
    articolo_id: 'art-28',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Trave e Forchette',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 8,
    note_operative: 'Taglio su KASTO'
  },
  {
    id: 'ciclo-28-3',
    articolo_id: 'art-28',
    sequenza: 30,
    nome_fase: 'Saldatura TIG/MIG Bracci e Forchette',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 50,
    note_operative: 'Puntatura in dima e saldatura completa'
  },
  {
    id: 'ciclo-28-4',
    articolo_id: 'art-28',
    sequenza: 40,
    nome_fase: 'Fresatura 4 Assi Barenatura Fori Snodi in Linea',
    tipo_processo_id: 'proc-fresatura-4x',
    centro_lavoro_id: 'mc-cnc-03',
    centri_lavoro_alternativi_ids: ['mc-cnc-04'],
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 38,
    note_operative: 'Barenatura simultanea con mandrino orizzontale'
  },
  {
    id: 'ciclo-28-5',
    articolo_id: 'art-28',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale CMM 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 10,
    note_operative: 'Verifica asse di rotazione espulsore'
  },

  // --- ARTICOLO 29: FLG-ATT-29 (Flangia Attacco Motoriduttore da Sagoma) ---
  {
    id: 'ciclo-29-1',
    articolo_id: 'art-29',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 25,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Centraggio flangia B5 e forature'
  },
  {
    id: 'ciclo-29-2',
    articolo_id: 'art-29',
    sequenza: 20,
    nome_fase: 'Fresatura Verticale 3 Assi Spianatura & Centraggio Motore',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-01',
    centri_lavoro_alternativi_ids: ['mc-cnc-02'],
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 16,
    note_operative: 'Tornitura/fresatura centraggio maschio con fresa a candela'
  },
  {
    id: 'ciclo-29-3',
    articolo_id: 'art-29',
    sequenza: 30,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Verifica diametro centraggio e fori'
  },

  // --- ARTICOLO 30: CAR-GUI-30 (Carter di Protezione - Carpenteria) ---
  {
    id: 'ciclo-30-1',
    articolo_id: 'art-30',
    sequenza: 10,
    nome_fase: 'Programmazione CAD/CAM & Setup Utensili',
    tipo_processo_id: 'proc-cam',
    centro_lavoro_id: 'mc-cam-01',
    tempo_attrezzaggio_min: 30,
    tempo_ciclo_pezzo_min: 0,
    note_operative: 'Setup fresatura asola passaggio velo carta'
  },
  {
    id: 'ciclo-30-2',
    articolo_id: 'art-30',
    sequenza: 20,
    nome_fase: 'Taglio a Nastro Cornice Scatolato',
    tipo_processo_id: 'proc-taglio',
    centro_lavoro_id: 'mc-seg-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Taglio angolare a 45° su Kasto'
  },
  {
    id: 'ciclo-30-3',
    articolo_id: 'art-30',
    sequenza: 30,
    nome_fase: 'Saldatura TIG Lamiera su Cornice',
    tipo_processo_id: 'proc-saldatura',
    centro_lavoro_id: 'mc-sal-01',
    tempo_attrezzaggio_min: 20,
    tempo_ciclo_pezzo_min: 35,
    note_operative: 'Saldatura estetica con cordoni finiti lisci'
  },
  {
    id: 'ciclo-30-4',
    articolo_id: 'art-30',
    sequenza: 40,
    nome_fase: 'Fresatura 3 Assi Asola Passaggio Nastro',
    tipo_processo_id: 'proc-fresatura-3x',
    centro_lavoro_id: 'mc-cnc-02',
    centri_lavoro_alternativi_ids: ['mc-cnc-01'],
    tempo_attrezzaggio_min: 15,
    tempo_ciclo_pezzo_min: 18,
    note_operative: 'Smussatura bordi asola per evitare strappi carta'
  },
  {
    id: 'ciclo-30-5',
    articolo_id: 'art-30',
    sequenza: 50,
    nome_fase: 'Collaudo Dimensionale 3D',
    tipo_processo_id: 'proc-collaudo-3d',
    centro_lavoro_id: 'mc-cmm-01',
    tempo_attrezzaggio_min: 10,
    tempo_ciclo_pezzo_min: 5,
    note_operative: 'Verifica dimensioni di montaggio'
  }
]

// 6. Anagrafica Clienti (Polo Cartario di Lucca)
export const SEED_CLIENTI: Cliente[] = [
  {
    id: 'cli-01',
    ragione_sociale: 'Valmet Tissue Converting S.p.A. (ex Körber / Fabio Perini)',
    partita_iva: 'IT01234560461',
    email: 'procurement.lucca@valmet.com',
    telefono: '+39 0583 4601',
    indirizzo: 'Via Giovanni Diodati 50, 55100 Lucca (LU)',
    creato_il: '2026-01-15T08:00:00Z'
  },
  {
    id: 'cli-02',
    ragione_sociale: 'Toscotec S.p.A. (Voith Group)',
    partita_iva: 'IT01987650462',
    email: 'acquisti.meccanica@toscotec.com',
    telefono: '+39 0583 4001',
    indirizzo: 'Viale Europa 40, 55014 Marlia, Lucca (LU)',
    creato_il: '2026-01-18T09:00:00Z'
  },
  {
    id: 'cli-03',
    ragione_sociale: 'Futura S.p.A.',
    partita_iva: 'IT02456780463',
    email: 'supplychain@futuraconverting.com',
    telefono: '+39 0583 24701',
    indirizzo: 'Via di Sottomonte 101, 55060 Guamo, Capannori (LU)',
    creato_il: '2026-01-20T10:30:00Z'
  },
  {
    id: 'cli-04',
    ragione_sociale: 'Fosber S.p.A.',
    partita_iva: 'IT01543210464',
    email: 'ordini.officina@fosber.it',
    telefono: '+39 0583 3891',
    indirizzo: 'Via Provinciale per Camaiore 27, 55064 Monsagrati (LU)',
    creato_il: '2026-01-22T11:00:00Z'
  }
]

// 7. Ordini Clienti (Arco temporale di 6 mesi per simulazione realistica di officina)
// Ciascuna commessa è Multi-Articolo e rispecchia veri pacchetti di componenti per macchine cartarie
export const SEED_ORDINI_CLIENTI: (OrdineCliente & { cliente?: Cliente; righe: (RigaOrdineCliente & { articolo?: Articolo })[] })[] = [
  {
    id: 'ord-01',
    numero_ordine: 'ORD-VAL-2026-041',
    cliente_id: 'cli-01', // Valmet
    data_ordine: '2026-10-15T08:30:00Z',
    data_consegna_concordata: '2026-11-06T17:00:00Z', // Urgente (~2 settimane)
    stato: 'confermato',
    note: 'Commessa urgente gruppo ribobinatrice Constellation. Tolleranze centraggi H7.',
    creato_il: '2026-10-15T08:30:00Z',
    righe: [
      {
        id: 'riga-01-1',
        ordine_cliente_id: 'ord-01',
        articolo_id: 'art-01', // PIA-SPA-01 - Piastra Spalla
        quantita: 2,
        prezzo_unitario: 1150
      },
      {
        id: 'riga-01-2',
        ordine_cliente_id: 'ord-01',
        articolo_id: 'art-03', // SUP-CUS-03 - Supporto Cuscinetto Cilindro
        quantita: 4,
        prezzo_unitario: 480
      },
      {
        id: 'riga-01-3',
        ordine_cliente_id: 'ord-01',
        articolo_id: 'art-10', // COL-VUO-10 - Collettore Vuoto
        quantita: 6,
        prezzo_unitario: 640
      }
    ]
  },
  {
    id: 'ord-02',
    numero_ordine: 'ORD-TOS-2026-118',
    cliente_id: 'cli-02', // Toscotec
    data_ordine: '2026-10-18T10:00:00Z',
    data_consegna_concordata: '2026-11-20T17:00:00Z', // ~4 settimane
    stato: 'confermato',
    note: 'Fornitura telaio e supporti per sezione calandra macchina continua tissue.',
    creato_il: '2026-10-18T10:00:00Z',
    righe: [
      {
        id: 'riga-02-1',
        ordine_cliente_id: 'ord-02',
        articolo_id: 'art-11', // BAS-SAL-11 - Basamento Saldato Riduttore
        quantita: 2,
        prezzo_unitario: 1350
      },
      {
        id: 'riga-02-2',
        ordine_cliente_id: 'ord-02',
        articolo_id: 'art-08', // SUP-OSC-08 - Supporto Oscillante Spingitore
        quantita: 8,
        prezzo_unitario: 390
      },
      {
        id: 'riga-02-3',
        ordine_cliente_id: 'ord-02',
        articolo_id: 'art-27', // STA-ANC-27 - Staffa Ancoraggio Tubi Vapore
        quantita: 16,
        prezzo_unitario: 220
      }
    ]
  },
  {
    id: 'ord-03',
    numero_ordine: 'ORD-FUT-2026-092',
    cliente_id: 'cli-03', // Futura
    data_ordine: '2026-10-20T14:15:00Z',
    data_consegna_concordata: '2026-12-04T17:00:00Z', // ~6 settimane
    stato: 'confermato',
    note: 'Lotto componenti per gruppo svolgitore automatico e goffratura rotoli.',
    creato_il: '2026-10-20T14:15:00Z',
    righe: [
      {
        id: 'riga-03-1',
        ordine_cliente_id: 'ord-03',
        articolo_id: 'art-05', // BRA-OSC-05 - Braccio Oscillante
        quantita: 6,
        prezzo_unitario: 520
      },
      {
        id: 'riga-03-2',
        ordine_cliente_id: 'ord-03',
        articolo_id: 'art-21', // TAM-SCA-21 - Tamburo Scanalato Goffratore
        quantita: 3,
        prezzo_unitario: 890
      },
      {
        id: 'riga-03-3',
        ordine_cliente_id: 'ord-03',
        articolo_id: 'art-14', // PET-DIS-14 - Pettine Distanziatore Confezionatrice
        quantita: 12,
        prezzo_unitario: 195
      }
    ]
  },
  {
    id: 'ord-04',
    numero_ordine: 'ORD-FOS-2026-155',
    cliente_id: 'cli-04', // Fosber
    data_ordine: '2026-10-22T09:00:00Z',
    data_consegna_concordata: '2026-12-18T17:00:00Z', // ~8 settimane
    stato: 'confermato',
    note: 'Kit movimentazione e taglio ad alta velocità per ondulatori cartone.',
    creato_il: '2026-10-22T09:00:00Z',
    righe: [
      {
        id: 'riga-04-1',
        ordine_cliente_id: 'ord-04',
        articolo_id: 'art-07', // CAM-SCA-07 - Corpo Camma Scanalata
        quantita: 4,
        prezzo_unitario: 780
      },
      {
        id: 'riga-04-2',
        ordine_cliente_id: 'ord-04',
        articolo_id: 'art-09', // POR-COL-09 - Portalama Rotante Taglierina
        quantita: 8,
        prezzo_unitario: 440
      },
      {
        id: 'riga-04-3',
        ordine_cliente_id: 'ord-04',
        articolo_id: 'art-12', // GUI-LIN-12 - Guida Lineare Registrabile
        quantita: 4,
        prezzo_unitario: 620
      }
    ]
  },
  {
    id: 'ord-05',
    numero_ordine: 'ORD-VAL-2026-068',
    cliente_id: 'cli-01', // Valmet
    data_ordine: '2026-10-23T08:00:00Z',
    data_consegna_concordata: '2027-01-15T17:00:00Z', // ~2.5 mesi
    stato: 'confermato',
    note: 'Gruppo carterature e protezioni insonorizzate per troncatore log.',
    creato_il: '2026-10-23T08:00:00Z',
    righe: [
      {
        id: 'riga-05-1',
        ordine_cliente_id: 'ord-05',
        articolo_id: 'art-06', // CAR-PRO-06 - Carter Protezione Ingranaggi
        quantita: 4,
        prezzo_unitario: 410
      },
      {
        id: 'riga-05-2',
        ordine_cliente_id: 'ord-05',
        articolo_id: 'art-30', // CAR-GUI-30 - Carter Scatolato Passaggio Carta
        quantita: 4,
        prezzo_unitario: 560
      },
      {
        id: 'riga-05-3',
        ordine_cliente_id: 'ord-05',
        articolo_id: 'art-16', // COL-DIS-16 - Collettore Distribuzione Olio
        quantita: 6,
        prezzo_unitario: 370
      }
    ]
  },
  {
    id: 'ord-06',
    numero_ordine: 'ORD-TOS-2026-140',
    cliente_id: 'cli-02', // Toscotec
    data_ordine: '2026-10-23T08:30:00Z',
    data_consegna_concordata: '2027-02-05T17:00:00Z', // ~3.5 mesi
    stato: 'confermato',
    note: 'Flange e raccordi alta pressione per circuito idraulico pressa feltro.',
    creato_il: '2026-10-23T08:30:00Z',
    righe: [
      {
        id: 'riga-06-1',
        ordine_cliente_id: 'ord-06',
        articolo_id: 'art-02', // FLG-ATT-02 - Flangia Attacco Motore
        quantita: 8,
        prezzo_unitario: 310
      },
      {
        id: 'riga-06-2',
        ordine_cliente_id: 'ord-06',
        articolo_id: 'art-17', // COR-DIS-17 - Corpo Distributore Oleodinamico
        quantita: 3,
        prezzo_unitario: 980
      },
      {
        id: 'riga-06-3',
        ordine_cliente_id: 'ord-06',
        articolo_id: 'art-20', // SUP-SEN-20 - Supporto Sensore Spessimetro Laser
        quantita: 6,
        prezzo_unitario: 240
      }
    ]
  },
  {
    id: 'ord-07',
    numero_ordine: 'ORD-FUT-2026-115',
    cliente_id: 'cli-03', // Futura
    data_ordine: '2026-10-23T09:00:00Z',
    data_consegna_concordata: '2027-02-26T17:00:00Z', // ~4 mesi
    stato: 'confermato',
    note: 'Slitte, blocchetti regolatori e guide centraggi per insacchettatrice.',
    creato_il: '2026-10-23T09:00:00Z',
    righe: [
      {
        id: 'riga-07-1',
        ordine_cliente_id: 'ord-07',
        articolo_id: 'art-23', // SLI-REG-23 - Slitta Regolazione Coltello
        quantita: 10,
        prezzo_unitario: 340
      },
      {
        id: 'riga-07-2',
        ordine_cliente_id: 'ord-07',
        articolo_id: 'art-18', // BLO-BLO-18 - Blocchetto Bloccaggio Rapido
        quantita: 20,
        prezzo_unitario: 160
      },
      {
        id: 'riga-07-3',
        ordine_cliente_id: 'ord-07',
        articolo_id: 'art-26', // DIS-FRE-26 - Disco Freno Svolgitore Bobina
        quantita: 4,
        prezzo_unitario: 490
      }
    ]
  },
  {
    id: 'ord-08',
    numero_ordine: 'ORD-VAL-2026-089',
    cliente_id: 'cli-01', // Valmet
    data_ordine: '2026-10-23T09:30:00Z',
    data_consegna_concordata: '2027-03-19T17:00:00Z', // ~5 mesi
    stato: 'confermato',
    note: 'Componenti di precisione 5 assi per gruppo perforatore carta a passo variabile.',
    creato_il: '2026-10-23T09:30:00Z',
    righe: [
      {
        id: 'riga-08-1',
        ordine_cliente_id: 'ord-08',
        articolo_id: 'art-25', // SUP-PER-25 - Supporto Barra Perforatrice
        quantita: 4,
        prezzo_unitario: 720
      },
      {
        id: 'riga-08-2',
        ordine_cliente_id: 'ord-08',
        articolo_id: 'art-28', // BIE-CON-28 - Biella Comando Taglio Log
        quantita: 6,
        prezzo_unitario: 430
      },
      {
        id: 'riga-08-3',
        ordine_cliente_id: 'ord-08',
        articolo_id: 'art-22', // PIA-ANC-22 - Piastra Ancoraggio Motore Brushless
        quantita: 8,
        prezzo_unitario: 380
      }
    ]
  },
  {
    id: 'ord-09',
    numero_ordine: 'ORD-FOS-2026-180',
    cliente_id: 'cli-04', // Fosber
    data_ordine: '2026-10-23T10:00:00Z',
    data_consegna_concordata: '2027-04-09T17:00:00Z', // ~5.5 mesi
    stato: 'confermato',
    note: 'Fornitura rulli tensionatori e mozzi scanalati per incollatore amido.',
    creato_il: '2026-10-23T10:00:00Z',
    righe: [
      {
        id: 'riga-09-1',
        ordine_cliente_id: 'ord-09',
        articolo_id: 'art-13', // RUL-TEN-13 - Rullo Tensionatore Nastro
        quantita: 6,
        prezzo_unitario: 450
      },
      {
        id: 'riga-09-2',
        ordine_cliente_id: 'ord-09',
        articolo_id: 'art-19', // MOZ-SCA-19 - Mozzo Scanalato Trasmissione
        quantita: 6,
        prezzo_unitario: 360
      },
      {
        id: 'riga-09-3',
        ordine_cliente_id: 'ord-09',
        articolo_id: 'art-15', // SUP-CEL-15 - Supporto Cella di Carico Tensionamento
        quantita: 10,
        prezzo_unitario: 290
      }
    ]
  },
  {
    id: 'ord-10',
    numero_ordine: 'ORD-TOS-2026-192',
    cliente_id: 'cli-02', // Toscotec
    data_ordine: '2026-10-23T10:30:00Z',
    data_consegna_concordata: '2027-04-30T17:00:00Z', // ~6 mesi
    stato: 'confermato',
    note: 'Staffe, collettori e protezioni per testata cilindro essiccatore Yankee.',
    creato_il: '2026-10-23T10:30:00Z',
    righe: [
      {
        id: 'riga-10-1',
        ordine_cliente_id: 'ord-10',
        articolo_id: 'art-27', // STA-ANC-27 - Staffa Ancoraggio Tubi Vapore
        quantita: 14,
        prezzo_unitario: 220
      },
      {
        id: 'riga-10-2',
        ordine_cliente_id: 'ord-10',
        articolo_id: 'art-24', // CAR-ASP-24 - Carter Aspirazione Polveri Carta
        quantita: 4,
        prezzo_unitario: 510
      },
      {
        id: 'riga-10-3',
        ordine_cliente_id: 'ord-10',
        articolo_id: 'art-29', // TAP-CHI-29 - Tappo Chiusura Cuscinetto Cilindro
        quantita: 8,
        prezzo_unitario: 180
      }
    ]
  }
]

// 8. Ordini di Produzione (OdP)
export const SEED_ODP: (OrdineProduzione & { fasi: FaseOdP[] })[] = []
