import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DocumentoTrasportoCliente, DocumentoTrasportoEsterno, OrdineCliente, Azienda } from '@/types/database'

export function generaDdtPdf(
  ddt: DocumentoTrasportoCliente | DocumentoTrasportoEsterno,
  tipo: 'cliente' | 'terzista',
  ordiniClienti: OrdineCliente[] = [],
  azienda?: Azienda | null,
  logoBase64?: string | null
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

  // 1. INTESTAZIONE AZIENDA E LOGO
  let xOffsetTesto = 14
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, 11, 24, 20)
      xOffsetTesto = 42
    } catch {}
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text('DOCUMENTO DI TRASPORTO OPERATIVO (D.D.T.)', xOffsetTesto, 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(nomeAzienda.toUpperCase(), xOffsetTesto, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(indirizzoAzienda, xOffsetTesto, 25)
  doc.text(`${pivaAzienda}${telAzienda}`, xOffsetTesto, 29)

  // BOX NUMERO E DATA DOCUMENTO (A Destra)
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(132, 10, 64, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('NUMERO DOCUMENTO', 192, 15, { align: 'right' })

  doc.setFont('courier', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text(ddt.numero_ddt || 'N/D', 192, 22, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  const dataOra = `${new Date(ddt.data_emissione).toLocaleDateString('it-IT')}  ore ${new Date(ddt.data_emissione).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
  doc.text(`Data: ${dataOra}`, 192, 28, { align: 'right' })

  // Linea divisoria nera
  doc.setDrawColor(colorDark[0], colorDark[1], colorDark[2])
  doc.setLineWidth(0.6)
  doc.line(14, 35, 196, 35)

  // 2. BLOCCO MITTENTE / DESTINATARIO (2 Colonne affiancate)
  const yMittente = 39

  // Box Mittente (Sinistra)
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, yMittente, 88, 26, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('LUOGO DI PARTENZA (MITTENTE)', 17, yMittente + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(nomeAzienda, 17, yMittente + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(indirizzoAzienda, 17, yMittente + 15)
  doc.text(`Causale: ${ddt.causale_trasporto} • Porto: ${ddt.porto}`, 17, yMittente + 20)

  // Box Destinatario (Destra)
  doc.setFillColor(isCliente ? 240 : 253, isCliente ? 253 : 242, isCliente ? 244 : 248) // Verde chiaro o rosa chiaro
  doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.setLineWidth(0.4)
  doc.roundedRect(106, yMittente, 90, 26, 2, 2, 'FD')

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

  // 3. DATI LOGISTICI TRASPORTO (Fascia a 4 sezioni)
  const yLog = 69
  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, yLog, 182, 13, 2, 2, 'FD')

  const sezioniLog = [
    { label: 'VETTORE INCARICATO:', val: ddt.vettore_nome || 'Vettore' },
    { label: 'NUMERO COLLI:', val: `${ddt.numero_colli || 1} cassa/e` },
    { label: 'PESO TOTALE LORDO:', val: ddt.peso_totale_kg ? `${ddt.peso_totale_kg.toFixed(1)} kg` : 'A vista' },
    { label: 'ASPETTO DEI BENI:', val: ddt.aspetto_beni || 'A vista' }
  ]

  sezioniLog.forEach((s, idx) => {
    const xPos = 17 + idx * 45
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text(s.label, xPos, yLog + 4.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
    doc.text(s.val, xPos, yLog + 9.5)
  })

  // 4. TABELLA DETTAGLIO MERCI
  const headers = isCliente
    ? [['Ns. Ordine', 'Item', 'Commessa Cliente', 'Codice Particolare', 'Descrizione Tecnica', 'Note Consegna', 'Q.tà', 'Peso']]
    : [['# OdP / Rif.', 'Codice Particolare', 'Descrizione Tecnica', 'Trattamento Richiesto', 'Q.tà Spedita', 'Peso Stima']]

  const righeDati: any[] = []

  if (isCliente && clienteDdt) {
    clienteDdt.righe.forEach((r) => {
      let commessa = r.riferimento_ordine_cliente || ''
      if (!commessa && ordiniClienti) {
        const m = ordiniClienti.find((o) => o.id === r.ordine_cliente_id || o.numero_ordine === r.codice_ordine_cliente)
        if (m?.riferimento_ordine_cliente) commessa = m.riferimento_ordine_cliente
      }

      righeDati.push([
        r.codice_ordine_cliente || 'N/D',
        r.pos_riga_cliente ? `#${r.pos_riga_cliente}` : '-',
        commessa || '-',
        r.articolo_codice || '',
        r.articolo_descrizione || '',
        r.note_riga || (r.quantita_ordinata ? `Parziale (Tot: ${r.quantita_ordinata})` : 'Consegna'),
        `${r.quantita_spedita} ${r.unita_misura}`,
        r.peso_kg_riga ? `${r.peso_kg_riga.toFixed(1)} kg` : '-'
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
    startY: 86,
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
          0: { fontStyle: 'bold', cellWidth: 22 },
          1: { halign: 'center', cellWidth: 12 },
          2: { fontStyle: 'bold', cellWidth: 26 },
          3: { fontStyle: 'bold', cellWidth: 26 },
          4: { cellWidth: 40 },
          5: { cellWidth: 26 },
          6: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
          7: { halign: 'right', cellWidth: 14 }
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
  const finalY = (doc as any).lastAutoTable.finalY + 6

  // Note di Trasporto (se presenti)
  let yFirme = finalY
  if (ddt.note_trasporto) {
    doc.setFillColor(254, 243, 199) // Giallo ambra chiaro
    doc.setDrawColor(253, 230, 138)
    doc.roundedRect(14, finalY, 182, 9, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(146, 64, 14)
    doc.text(`Note & Istruzioni: ${ddt.note_trasporto}`, 17, finalY + 5.5)
    yFirme += 14
  }

  // 5. RIQUADRO FIRME (3 Colonne)
  // Assicura che le firme non sforino a fondo pagina
  const yBoxFirme = Math.min(Math.max(yFirme, 235), 255)
  const boxWidth = 58
  const titoliFirme = ['FIRMA DEL MITTENTE', 'FIRMA DEL VETTORE', isCliente ? 'FIRMA CLIENTE RICEZIONE' : 'FIRMA FORNITORE RICEZIONE']

  titoliFirme.forEach((titolo, i) => {
    const xBox = 14 + i * 62
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(xBox, yBoxFirme, boxWidth, 24, 2, 2, 'D')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text(titolo, xBox + 4, yBoxFirme + 5.5)

    // Linea tratteggiata per la firma
    doc.setDrawColor(148, 163, 184)
    doc.setLineDashPattern([1.5, 1.5], 0)
    doc.line(xBox + 4, yBoxFirme + 19, xBox + boxWidth - 4, yBoxFirme + 19)
    doc.setLineDashPattern([], 0) // Ripristina linea continua
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
