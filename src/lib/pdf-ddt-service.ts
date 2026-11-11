import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DocumentoTrasportoCliente, DocumentoTrasportoEsterno, OrdineCliente, Azienda } from '@/types/database'

export function generaDdtPdf(
  ddt: DocumentoTrasportoCliente | DocumentoTrasportoEsterno,
  tipo: 'cliente' | 'terzista',
  ordiniClienti: OrdineCliente[] = [],
  azienda?: Azienda | null,
  logoBase64?: string | null,
  mostraPrezzi: boolean = true
): jsPDF {
  const isCliente = tipo === 'cliente' || 'cliente_nome' in ddt
  const clienteDdt = isCliente ? (ddt as DocumentoTrasportoCliente) : null
  const terzistaDdt = !isCliente ? (ddt as DocumentoTrasportoEsterno) : null

  // Dati azienda dinamici con fallback
  const nomeAzienda = azienda?.nome || 'MACHINAFLOW MECCANICA S.R.L.'
  const indirizzoAzienda = azienda?.indirizzo 
    ? `${azienda.indirizzo}${azienda.citta ? `, ${azienda.cap || ''} ${azienda.citta} (${azienda.provincia || ''})` : ''}`
    : "Via dell'Industria 14, 41012 Carpi (MO)"
  const pivaAzienda = azienda?.partita_iva ? `P.IVA: ${azienda.partita_iva}` : 'P.IVA e C.F.: 03849200361'
  const telAzienda = azienda?.telefono ? ` • Tel: ${azienda.telefono}` : ''

  // Crea documento A4 verticale (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Palette colori istituzionale
  const colorPrimario = isCliente ? [5, 150, 105] : [190, 24, 93] // Smeraldo o Fucsia scuro
  const colorDark = [15, 23, 42] // Slate 900
  const colorMuted = [100, 116, 139] // Slate 500
  const colorLightBg = [248, 250, 252] // Slate 50

  // 1. INTESTAZIONE AZIENDA (STRUTTURA STANDARD A 3 COLONNE INDIPENDENTI)
  // Colonna 1: Area Logo (X: 14 -> 54, maxW: 40mm, maxH: 17mm)
  // Colonna 2: Dati Azienda (X: 58 -> 136)
  // Colonna 3: Box Documento (X: 140 -> 196)

  const hasLogo = Boolean(logoBase64)
  const xOffsetTesto = hasLogo ? 58 : 14

  if (logoBase64) {
    try {
      const imgProps = doc.getImageProperties(logoBase64)
      const ratio = imgProps.width / imgProps.height
      const maxH = 16
      const maxW = 38
      let logoW = maxH * ratio
      let logoH = maxH
      if (logoW > maxW) {
        logoW = maxW
        logoH = logoW / ratio
      }
      // Centra verticalmente il logo nello slot di testata
      const yLogo = 12 + Math.max(0, (18 - logoH) / 2)
      doc.addImage(logoBase64, 'PNG', 14, yLogo, logoW, logoH)
    } catch {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 13, 36, 12)
      } catch {}
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text('DOCUMENTO DI TRASPORTO (D.D.T.)', xOffsetTesto, 13)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(nomeAzienda.toUpperCase(), xOffsetTesto, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(indirizzoAzienda, xOffsetTesto, 24)
  doc.text(`${pivaAzienda}${telAzienda}`, xOffsetTesto, 28)

  // BOX NUMERO E DATA DOCUMENTO (Colonna 3 a Destra: X=140, W=56mm)
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(140, 10, 56, 21, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('NUMERO DOCUMENTO', 192, 14.5, { align: 'right' })

  doc.setFont('courier', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text(ddt.numero_ddt || 'N/D', 192, 21, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  const dataOra = `${new Date(ddt.data_emissione).toLocaleDateString('it-IT')}  ${new Date(ddt.data_emissione).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
  doc.text(`Data: ${dataOra}`, 192, 27, { align: 'right' })

  // Linea divisoria nera
  doc.setDrawColor(colorDark[0], colorDark[1], colorDark[2])
  doc.setLineWidth(0.6)
  doc.line(14, 34, 196, 34)

  // 2. BLOCCO MITTENTE / DESTINATARIO (Subito sotto la testata)
  const yMittente = 39

  // Box Mittente (Sinistra)
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, yMittente, 88, 25, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('LUOGO DI PARTENZA (MITTENTE)', 17, yMittente + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(nomeAzienda, 17, yMittente + 10.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(indirizzoAzienda, 17, yMittente + 15.5)
  doc.text(`P.IVA: ${azienda?.partita_iva || '02453430460'}`, 17, yMittente + 20)

  // Box Destinatario (Destra)
  doc.setFillColor(isCliente ? 240 : 253, isCliente ? 253 : 242, isCliente ? 244 : 248) // Verde chiaro o rosa chiaro
  doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.setLineWidth(0.4)
  doc.roundedRect(106, yMittente, 90, 25, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text(isCliente ? 'DESTINATARIO CLIENTE FINALE' : 'DESTINATARIO FORNITORE / TERZISTA', 109, yMittente + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  const nomeDest = isCliente ? clienteDdt?.cliente_nome : terzistaDdt?.fornitore_nome
  doc.text(nomeDest || 'Destinatario', 109, yMittente + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  const indirizzoDest = isCliente
    ? clienteDdt?.destinazione_diversa || clienteDdt?.cliente_indirizzo || 'Sede legale cliente'
    : terzistaDdt?.fornitore_indirizzo || 'Sede operativa fornitore'
  doc.text(indirizzoDest, 109, yMittente + 16)

  const pivaDest = isCliente
    ? `P.IVA / C.F.: ${clienteDdt?.cliente_piva || 'In anagrafica'}`
    : `P.IVA: ${terzistaDdt?.fornitore_piva || 'Come in anagrafica'}`
  doc.text(pivaDest, 109, yMittente + 21)

  // 3. TABELLA DETTAGLIO MERCI (Inizia subito sotto i box mittente/destinatario a Y = 68)
  const headers = isCliente
    ? [['Pos / OdP', 'Commessa', 'Codice Articolo', 'Descrizione Particolare', 'Note / Saldo', 'Q.tà', 'Prezzo (€)', 'Totale (€)']]
    : [['# OdP / Rif.', 'Codice Particolare', 'Descrizione Tecnica', 'Trattamento Richiesto', 'Q.tà Spedita', 'Peso Stima']]

  const righeDati: any[] = []
  let totaleImponibileDoc = 0

  if (isCliente && clienteDdt) {
    clienteDdt.righe.forEach((r) => {
      let commessa = r.riferimento_ordine_cliente || ''
      let prezzoUnitario = r.prezzo_unitario || 0

      if (ordiniClienti) {
        const ord = ordiniClienti.find((o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente)
        if (ord) {
          if (!commessa && ord.riferimento_ordine_cliente) commessa = ord.riferimento_ordine_cliente
          if (!prezzoUnitario && (ord as any).righe) {
            const rigaOrd = (ord as any).righe.find((ro: any) => ro.id === r.riga_ordine_cliente_id || ro.articolo_id === r.articolo_id)
            if (rigaOrd?.prezzo_unitario) prezzoUnitario = rigaOrd.prezzo_unitario
          }
        }
      }

      const totRiga = r.totale_riga !== undefined ? r.totale_riga : (prezzoUnitario * r.quantita_spedita)
      totaleImponibileDoc += totRiga

      const labelOdp = r.codice_odp ? r.codice_odp.replace(/^[A-Z0-9]+-[A-Z0-9]+-/, '') : (r.codice_ordine_cliente || '-')
      const labelPos = r.pos_riga_cliente ? `#${r.pos_riga_cliente} • ` : ''

      let codArt = r.articolo_codice || ''
      if (!codArt || codArt === 'N/D') {
        try {
          const artSalvati = localStorage.getItem('machinaflow_articoli')
          if (artSalvati) {
            const listArt: any[] = JSON.parse(artSalvati)
            const trovato = listArt.find((a) => a.id === r.articolo_id) || listArt[0]
            if (trovato?.codice_articolo) codArt = trovato.codice_articolo
          }
        } catch {}
      }

      let descArt = r.articolo_descrizione || ''
      if (!descArt || descArt === 'Particolare Meccanico') {
        try {
          const artSalvati = localStorage.getItem('machinaflow_articoli')
          if (artSalvati) {
            const listArt: any[] = JSON.parse(artSalvati)
            const trovato = listArt.find((a) => a.id === r.articolo_id) || listArt[0]
            if (trovato?.descrizione) descArt = trovato.descrizione
          }
        } catch {}
      }

      const prezzoTxt = mostraPrezzi ? (prezzoUnitario > 0 ? `€ ${prezzoUnitario.toFixed(2)}` : '€ 0,00') : '-'
      const totRigaTxt = mostraPrezzi ? (totRiga > 0 ? `€ ${totRiga.toFixed(2)}` : '€ 0,00') : '-'

      righeDati.push([
        `${labelPos}${labelOdp}`,
        commessa || '-',
        codArt || 'pf-100245',
        descArt || 'Particolare Meccanico',
        r.note_riga || (r.quantita_ordinata ? `Saldo (${r.quantita_spedita}/${r.quantita_ordinata})` : 'Consegna'),
        `${r.quantita_spedita} ${r.unita_misura}`,
        prezzoTxt,
        totRigaTxt
      ])
    })
  } else if (terzistaDdt) {
    terzistaDdt.righe.forEach((r) => {
      righeDati.push([
        r.codice_odp || '',
        r.articolo_codice || '',
        r.articolo_descrizione || '',
        r.nome_fase + (r.note_lavorazione ? ` (${r.note_lavorazione})` : ''),
        `${r.quantita_spedita} ${r.unita_misura}`,
        r.peso_kg_riga ? `${r.peso_kg_riga.toFixed(1)} kg` : '-'
      ])
    })
  }

  autoTable(doc, {
    startY: 68,
    head: headers,
    body: righeDati,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: isCliente
      ? {
          0: { fontStyle: 'bold', cellWidth: 26 },
          1: { fontStyle: 'bold', cellWidth: 20 },
          2: { fontStyle: 'bold', cellWidth: 24 },
          3: { cellWidth: 44 },
          4: { cellWidth: 24, fontSize: 7.5 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
          6: { halign: 'right', cellWidth: 14 },
          7: { halign: 'right', fontStyle: 'bold', cellWidth: 14 }
        }
      : {
          0: { fontStyle: 'bold', textColor: [190, 24, 93], cellWidth: 28 },
          1: { fontStyle: 'bold', cellWidth: 32 },
          2: { cellWidth: 50 },
          3: { cellWidth: 38 },
          4: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
          5: { halign: 'right', cellWidth: 16 }
        },
    margin: { left: 14, right: 14 }
  })

  // Calcolo posizione successiva alla tabella
  let currentY = (doc as any).lastAutoTable.finalY + 3

  // Box Riepilogo Totali (Solo per DDT Cliente)
  if (isCliente) {
    const totaleIvaDoc = Number((totaleImponibileDoc * 0.22).toFixed(2))
    const totaleFinaleDoc = Number((totaleImponibileDoc + totaleIvaDoc).toFixed(2))

    const xTot = 120
    const wTot = 76
    doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(xTot, currentY, wTot, 16, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text('Totale Imponibile Merce:', xTot + 3, currentY + 4.5)
    doc.text('IVA Ordinaria (22%):', xTot + 3, currentY + 9)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
    const imponibileTxt = mostraPrezzi ? `€ ${totaleImponibileDoc.toFixed(2)}` : '-'
    const ivaTxt = mostraPrezzi ? `€ ${totaleIvaDoc.toFixed(2)}` : '-'
    const totDocTxt = mostraPrezzi ? `€ ${totaleFinaleDoc.toFixed(2)}` : '-'

    doc.text(imponibileTxt, xTot + wTot - 3, currentY + 4.5, { align: 'right' })
    doc.text(ivaTxt, xTot + wTot - 3, currentY + 9, { align: 'right' })

    doc.setFontSize(8.5)
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
    doc.text('TOTALE DOCUMENTO:', xTot + 3, currentY + 13.5)
    doc.text(totDocTxt, xTot + wTot - 3, currentY + 13.5, { align: 'right' })

    currentY += 19
  }

  // Note di Trasporto (se presenti)
  if (ddt.note_trasporto) {
    doc.setFillColor(254, 243, 199) // Giallo ambra chiaro
    doc.setDrawColor(253, 230, 138)
    doc.roundedRect(14, currentY, 182, 7.5, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(146, 64, 14)
    doc.text(`Note & Istruzioni: ${ddt.note_trasporto}`, 17, currentY + 4.8)
    currentY += 10.5
  }

  // 4. DATI LOGISTICI TRASPORTO & FIRME (LAYOUT SPLIT A FONDO PAGINA)
  // Sinistra: Logistica su 2 righe da 3 colonne (W: 114mm)
  // Destra: 3 Firme impilate (W: 64mm, da X=132 a X=196)
  const hBottom = 38 // Altezza totale del blocco combinato
  // Ancoraggio a fondo pagina: Y = 243 mm così il blocco finisce a 281 mm, lasciando 5 mm prima del footer (286 mm)
  const yBottom = Math.max(currentY + 2, 243)

  // --- BLOCCO LOGISTICA (Sinistra: X=14, W=114, H=38) ---
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(14, yBottom, 114, hBottom, 1.5, 1.5, 'FD')

  // Griglia 2 righe x 3 colonne
  const riga1 = [
    { label: 'CAUSALE TRASPORTO', val: ddt.causale_trasporto || 'Vendita' },
    { label: 'PORTO', val: ddt.porto || 'Franco' },
    { label: 'ASPETTO DEI BENI', val: ddt.aspetto_beni || 'A vista' }
  ]
  const riga2 = [
    { label: 'NUMERO COLLI', val: `${ddt.numero_colli || 1} collo/i` },
    { label: 'PESO TOTALE LORDO', val: ddt.peso_totale_kg ? `${ddt.peso_totale_kg.toFixed(1)} kg` : 'A vista' },
    { label: 'VETTORE INCARICATO', val: ddt.vettore_nome || 'Mittente' }
  ]

  const colW = 37
  riga1.forEach((item, idx) => {
    const x = 16 + idx * colW
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text(item.label, x, yBottom + 5.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
    const lines = doc.splitTextToSize(item.val, colW - 3)
    doc.text(lines.slice(0, 2), x, yBottom + 10.5)
  })

  // Linea orizzontale divisoria interna tra riga 1 e riga 2
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(16, yBottom + 19, 126, yBottom + 19)

  riga2.forEach((item, idx) => {
    const x = 16 + idx * colW
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text(item.label, x, yBottom + 24.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
    const lines = doc.splitTextToSize(item.val, colW - 3)
    doc.text(lines.slice(0, 2), x, yBottom + 29.5)
  })

  // --- BLOCCO 3 FIRME IMPILATE (Destra: X=132, W=64, H=38) ---
  const titoliFirme = [
    'FIRMA MITTENTE / CONDUCENTE',
    'FIRMA VETTORE (RITIRO)',
    isCliente ? 'FIRMA CLIENTE (RICEVUTA)' : 'FIRMA FORNITORE (RICEVUTA)'
  ]
  const hFirma = 11.2

  titoliFirme.forEach((titolo, i) => {
    const yF = yBottom + i * (hFirma + 1.8)
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(132, yF, 64, hFirma, 1.5, 1.5, 'D')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text(titolo, 135, yF + 3.8)

    // Linea tratteggiata per la firma
    doc.setDrawColor(148, 163, 184)
    doc.setLineDashPattern([1.5, 1.5], 0)
    doc.line(135, yF + 9.2, 193, yF + 9.2)
    doc.setLineDashPattern([], 0)
  })

  // 6. FOOTER DOCUMENTO
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(
    'Documento di Trasporto generato elettronicamente tramite MachinaFlow MES • Stampa ad uso logistico e doganale di officina.',
    105,
    286,
    { align: 'center' }
  )

  return doc
}
