import { CentroLavoro, OrdineProduzione, FaseOdP, FaseCicloStandard } from '@/types/database'

export interface RisultatoBilanciamento {
  odpModificati: (OrdineProduzione & { fasi: FaseOdP[] })[]
  numeroFasiSpostate: number
  dettagliSpostamenti: {
    codiceOdp: string
    nomeFase: string
    macchinaOrigine: string
    macchinaDestinazione: string
    dataTarget: string
    oreFase: number
  }[]
}

/**
 * Calcola la mappa esatta del carico giorno per giorno replicando l'algoritmo visuale della Dashboard.
 * In questo modo il calcolo del carico del Load Balancer coincide al 100% con quello visto nei "Buchi 7 Giorni".
 */
export function calcolaMappaCaricoDettagliata(
  odpList: (OrdineProduzione & { fasi: FaseOdP[] })[],
  centriLavoro: CentroLavoro[],
  dataOggiIso: string = new Date().toISOString().split('T')[0]
): {
  mappaCarico: Map<string, number>
  mappaFaseDate: Map<string, string[]> // faseId -> date target in cui consuma ore
} {
  const mappaCarico = new Map<string, number>()
  const mappaFaseDate = new Map<string, string[]>()

  const isGiornoLavorativo = (centroId: string, d: Date): boolean => {
    const dayOfWeek = d.getDay()
    const centro = centriLavoro.find((c) => c.id === centroId)
    if (dayOfWeek === 6) return !!centro?.lavora_sabato
    if (dayOfWeek === 0) return !!centro?.lavora_domenica
    return true
  }

  const trovaGiornoLavorativoPrecedente = (centroId: string, dataPartenza: Date): Date => {
    const cur = new Date(dataPartenza)
    cur.setDate(cur.getDate() - 1)
    while (!isGiornoLavorativo(centroId, cur)) {
      cur.setDate(cur.getDate() - 1)
    }
    return cur
  }

  const aggiungiCarico = (centroId: string, dataIso: string, ore: number, faseId: string) => {
    const chiave = `${centroId}_${dataIso}`
    mappaCarico.set(chiave, (mappaCarico.get(chiave) || 0) + ore)

    const dateFase = mappaFaseDate.get(faseId) || []
    if (!dateFase.includes(dataIso)) {
      dateFase.push(dataIso)
      mappaFaseDate.set(faseId, dateFase)
    }
  }

  odpList.forEach((odp) => {
    if (odp.stato === 'completato' || odp.stato === 'spedito' || odp.stato === 'scartato') return
    if (!odp.fasi || odp.fasi.length === 0) return
    if (odp.fasi.every((f) => f.stato === 'completata')) return

    const fasiOrdinate = [...odp.fasi].sort((a, b) => (a.sequenza || 0) - (b.sequenza || 0))

    let dataFineOdPStr = odp.data_fine_pianificata || ''
    if (!dataFineOdPStr || dataFineOdPStr < dataOggiIso) {
      dataFineOdPStr = dataOggiIso
    }

    const [y, m, d] = dataFineOdPStr.split('-').map(Number)
    let cursoreData = new Date(y, m - 1, d)

    if (dataFineOdPStr > dataOggiIso) {
      cursoreData.setDate(cursoreData.getDate() - 1)
    }

    let oreConsumateOdpNelGiorno = 0
    const turnoMaxOdp = 8

    for (let i = fasiOrdinate.length - 1; i >= 0; i--) {
      const fase = fasiOrdinate[i]
      if (fase.stato === 'completata') continue

      const oreFase = Math.max(0.1, Number(fase.tempo_stimato_totale_min || 60) / 60)

      if (fase.stato === 'in_corso') {
        aggiungiCarico(fase.centro_lavoro_id, dataOggiIso, oreFase, fase.id)
        continue
      }

      if (fase.is_esterna) {
        const giorniTerzista = Math.max(
          1,
          fase.giorni_rientro_previsti || Math.ceil(Number(fase.tempo_stimato_totale_min || 2400) / 480)
        )

        let giorniSottratti = 0
        while (giorniSottratti < giorniTerzista) {
          while (!isGiornoLavorativo(fase.centro_lavoro_id, cursoreData)) {
            cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          }
          const dataIsoCorrente = cursoreData.toISOString().split('T')[0]
          const targetDataIso = dataIsoCorrente < dataOggiIso ? dataOggiIso : dataIsoCorrente
          const oreGiornoEsterno = Math.min(8, oreFase / giorniTerzista)
          aggiungiCarico(fase.centro_lavoro_id, targetDataIso, oreGiornoEsterno, fase.id)

          giorniSottratti++
          if (giorniSottratti < giorniTerzista) {
            cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          }
        }

        cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
        oreConsumateOdpNelGiorno = 0
        continue
      }

      // Fasi Interne
      let oreRimanentiFase = oreFase
      while (oreRimanentiFase > 0.01) {
        while (!isGiornoLavorativo(fase.centro_lavoro_id, cursoreData)) {
          cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          oreConsumateOdpNelGiorno = 0
        }

        const spazioDisponibileOggi = Math.max(0, turnoMaxOdp - oreConsumateOdpNelGiorno)
        if (spazioDisponibileOggi <= 0.01) {
          cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          oreConsumateOdpNelGiorno = 0
          continue
        }

        const oreDaAssegnareOggi = Math.min(oreRimanentiFase, spazioDisponibileOggi)
        const dataIsoAssegnata = cursoreData.toISOString().split('T')[0]
        const targetDataIso = dataIsoAssegnata < dataOggiIso ? dataOggiIso : dataIsoAssegnata

        aggiungiCarico(fase.centro_lavoro_id, targetDataIso, oreDaAssegnareOggi, fase.id)

        oreConsumateOdpNelGiorno += oreDaAssegnareOggi
        oreRimanentiFase -= oreDaAssegnareOggi

        if (oreRimanentiFase > 0.01) {
          cursoreData = trovaGiornoLavorativoPrecedente(fase.centro_lavoro_id, cursoreData)
          oreConsumateOdpNelGiorno = 0
        }
      }
    }
  })

  return { mappaCarico, mappaFaseDate }
}

/**
 * Seleziona il miglior centro di lavoro per una nuova fase durante il lancio dell'OdP
 */
export function selezionaMigliorCentroLavoroPerFase(
  centroPrincipaleId: string,
  centriAlternativiIds: string[] | undefined,
  dataTargetIso: string,
  oreFase: number,
  mappaCarico: Map<string, number>,
  centriLavoro: CentroLavoro[]
): { centroSelezionatoId: string; eraSaturata: boolean } {
  const alternativiValidi = (centriAlternativiIds || []).filter((id) => id && id !== centroPrincipaleId)
  if (alternativiValidi.length === 0) {
    return { centroSelezionatoId: centroPrincipaleId, eraSaturata: false }
  }

  const infoCentroPrincipale = centriLavoro.find((c) => c.id === centroPrincipaleId)
  const capacitaPrincipale = infoCentroPrincipale?.capacita_giornaliera_ore || 8
  const chiavePrincipale = `${centroPrincipaleId}_${dataTargetIso}`
  const caricoAttualePrincipale = mappaCarico.get(chiavePrincipale) || 0

  if (caricoAttualePrincipale + oreFase <= capacitaPrincipale) {
    return { centroSelezionatoId: centroPrincipaleId, eraSaturata: false }
  }

  let migliorCentroId = centroPrincipaleId
  let minorCarico = caricoAttualePrincipale

  for (const altId of alternativiValidi) {
    const infoAlt = centriLavoro.find((c) => c.id === altId)
    if (!infoAlt || !infoAlt.attivo) continue

    const chiaveAlt = `${altId}_${dataTargetIso}`
    const caricoAlt = mappaCarico.get(chiaveAlt) || 0

    if (caricoAlt < minorCarico) {
      migliorCentroId = altId
      minorCarico = caricoAlt
    }
  }

  return { centroSelezionatoId: migliorCentroId, eraSaturata: migliorCentroId !== centroPrincipaleId }
}

export function calcolaMappaCaricoMacchine(
  odpList: (OrdineProduzione & { fasi: FaseOdP[] })[],
  centriLavoro: CentroLavoro[],
  dataOggiIso: string = new Date().toISOString().split('T')[0]
): Map<string, number> {
  return calcolaMappaCaricoDettagliata(odpList, centriLavoro, dataOggiIso).mappaCarico
}

/**
 * Funzione Universale di Auto-Bilanciamento:
 * Scansiona tutti gli OdP attivi, rileva i giorni sovraccarichi (> capacità)
 * e dirotta le lavorazioni su macchine alternative compatibili più libere.
 */
export function eseguiAutoBilanciamentoGlobale(
  odpList: (OrdineProduzione & { fasi: FaseOdP[] })[],
  centriLavoro: CentroLavoro[],
  cicliStandard: FaseCicloStandard[] = [],
  dataOggiIso: string = new Date().toISOString().split('T')[0]
): RisultatoBilanciamento {
  // Mappa O(1) di tutte le alternative dai cicli base
  const mappaCicliArticolo = new Map<string, string[]>()
  cicliStandard.forEach((c) => {
    if (c.centri_lavoro_alternativi_ids && c.centri_lavoro_alternativi_ids.length > 0) {
      mappaCicliArticolo.set(`${c.articolo_id}_${c.sequenza}`, c.centri_lavoro_alternativi_ids)
      // Fallback anche per nome fase se sequenza variata
      mappaCicliArticolo.set(`${c.articolo_id}_${c.nome_fase.toLowerCase()}`, c.centri_lavoro_alternativi_ids)
    }
  })

  // Copia profonda
  const odpModificati: (OrdineProduzione & { fasi: FaseOdP[] })[] = JSON.parse(JSON.stringify(odpList))
  const { mappaCarico, mappaFaseDate } = calcolaMappaCaricoDettagliata(odpModificati, centriLavoro, dataOggiIso)

  let numeroFasiSpostate = 0
  const dettagliSpostamenti: RisultatoBilanciamento['dettagliSpostamenti'] = []

  odpModificati.forEach((odp) => {
    if (odp.stato === 'completato' || odp.stato === 'scartato' || odp.stato === 'spedito') return
    if (!odp.fasi) return

    odp.fasi.forEach((fase) => {
      if (fase.stato === 'completata' || fase.stato === 'in_corso') return

      let alternativeIds = fase.centri_lavoro_alternativi_ids || []
      if (alternativeIds.length === 0 && odp.articolo_id) {
        const altDaCiclo =
          mappaCicliArticolo.get(`${odp.articolo_id}_${fase.sequenza}`) ||
          mappaCicliArticolo.get(`${odp.articolo_id}_${fase.nome_fase.toLowerCase()}`)
        if (altDaCiclo && altDaCiclo.length > 0) {
          alternativeIds = altDaCiclo
          fase.centri_lavoro_alternativi_ids = altDaCiclo
        }
      }

      if (alternativeIds.length === 0) return

      const dateImpegnate = mappaFaseDate.get(fase.id) || []
      const oreFase = Math.max(0.1, Number(fase.tempo_stimato_totale_min || 60) / 60)

      const centroAttuale = centriLavoro.find((c) => c.id === fase.centro_lavoro_id)
      const capAttuale = centroAttuale?.capacita_giornaliera_ore || 8

      // Controlla se in una qualsiasi delle sue date la macchina attuale è sovraccarica (> capacità)
      const dataSovraccarica = dateImpegnate.find((dIso) => {
        const carico = mappaCarico.get(`${fase.centro_lavoro_id}_${dIso}`) || 0
        return carico > capAttuale
      })

      if (dataSovraccarica) {
        // Trovata macchina sovraccarica in quella data: cerca tra le alternative compatibili
        let miglioreAltId: string | null = null
        let minorCaricoAlt = 999999

        for (const altId of alternativeIds) {
          if (altId === fase.centro_lavoro_id) continue
          const centroAlt = centriLavoro.find((c) => c.id === altId)
          if (!centroAlt || !centroAlt.attivo) continue

          const caricoAltInGiorno = mappaCarico.get(`${altId}_${dataSovraccarica}`) || 0
          const capAlt = centroAlt.capacita_giornaliera_ore || 8

          if (caricoAltInGiorno + oreFase <= capAlt || caricoAltInGiorno < minorCaricoAlt) {
            miglioreAltId = altId
            minorCaricoAlt = caricoAltInGiorno
          }
        }

        if (miglioreAltId && miglioreAltId !== fase.centro_lavoro_id) {
          const macchinaOrigineNome = centroAttuale?.nome || centroAttuale?.codice || fase.centro_lavoro_id
          const centroDest = centriLavoro.find((c) => c.id === miglioreAltId)
          const macchinaDestNome = centroDest?.nome || centroDest?.codice || miglioreAltId

          // Sottrai dalle date della macchina origine e aggiungi a quella destinazione
          dateImpegnate.forEach((dIso) => {
            const chOrig = `${fase.centro_lavoro_id}_${dIso}`
            mappaCarico.set(chOrig, Math.max(0, (mappaCarico.get(chOrig) || 0) - oreFase))

            const chDest = `${miglioreAltId}_${dIso}`
            mappaCarico.set(chDest, (mappaCarico.get(chDest) || 0) + oreFase)
          })

          const vecchieAlt = fase.centri_lavoro_alternativi_ids || []
          fase.centri_lavoro_alternativi_ids = [fase.centro_lavoro_id, ...vecchieAlt.filter((id) => id !== miglioreAltId)]
          fase.centro_lavoro_id = miglioreAltId
          fase.note_officina = `${fase.note_officina ? fase.note_officina + ' • ' : ''}[Auto-Bilanciamento]`

          numeroFasiSpostate++
          dettagliSpostamenti.push({
            codiceOdp: odp.codice_odp,
            nomeFase: fase.nome_fase,
            macchinaOrigine: macchinaOrigineNome,
            macchinaDestinazione: macchinaDestNome,
            dataTarget: dataSovraccarica,
            oreFase: Number(oreFase.toFixed(1))
          })
        }
      }
    })
  })

  return { odpModificati, numeroFasiSpostate, dettagliSpostamenti }
}
