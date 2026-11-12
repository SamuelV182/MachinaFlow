import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { OrdineFornitore, FornitoreTerzista, Azienda } from '@/types/database'

/**
 * Generatore PDF in memoria A4 per Ordine d'Acquisto Fornitore (OdA)
 * Impaginazione istituzionale ad alta risoluzione conforme ai DDT aziendali (0 KB su server).
 */
export function generaOdaPdf(
  ordine: OrdineFornitore,
  fornitore?: FornitoreTerzista | null,
  azienda?: Azienda | null,
  logoBase64?: string | null
): jsPDF {
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

  // Palette colori istituzionale per OdA (Blu Zaffiro Industriale)
  const colorPrimario = [14, 116, 144] // Cyan/Blu 700
  const colorDark = [15, 23, 42] // Slate 900
  const colorMuted = [100, 116, 139] // Slate 500
  const colorLightBg = [248, 250, 252] // Slate 50

  const hasLogo = Boolean(logoBase64)
  const xOffsetTesto = hasLogo ? 58 : 14

  // 1. LOGO AZIENDALE
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
      const yLogo = 12 + Math.max(0, (18 - logoH) / 2)
      doc.addImage(logoBase64, 'PNG', 14, yLogo, logoW, logoH)
    } catch {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 13, 36, 12)
      } catch {}
    }
  }

  // 2. INTESTAZIONE COMMITTENTE (LA NOSTRA AZIENDA)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text("ORDINE D'ACQUISTO A FORNITORE (O.d.A.)", xOffsetTesto, 13)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(nomeAzienda.toUpperCase(), xOffsetTesto, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(`${indirizzoAzienda}${telAzienda}`, xOffsetTesto, 24)
  doc.text(pivaAzienda, xOffsetTesto, 28)

  // 3. BOX DOCUMENTO (NUMERO ODA E DATA EMISSIONE)
  const xBoxDoc = 140
  const wBoxDoc = 56
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(xBoxDoc, 11, wBoxDoc, 20, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('ORDINE N°:', xBoxDoc + 3, 16)
  doc.text('DATA EMISSIONE:', xBoxDoc + 3, 21)
  doc.text('CONSEGNA RICHIESTA:', xBoxDoc + 3, 26)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text(ordine.numero_oda || ordine.id, xBoxDoc + wBoxDoc - 3, 16, { align: 'right' })

  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  const dataOrdFormatted = ordine.data_ordine ? ordine.data_ordine.split('-').reverse().join('/') : new Date().toLocaleDateString('it-IT')
  const dataArrFormatted = ordine.data_arrivo_prevista ? ordine.data_arrivo_prevista.split('-').reverse().join('/') : 'Da concordare'
  doc.text(dataOrdFormatted, xBoxDoc + wBoxDoc - 3, 21, { align: 'right' })

  doc.setTextColor(194, 65, 12) // Arancione scuro
  doc.text(dataArrFormatted, xBoxDoc + wBoxDoc - 3, 26, { align: 'right' })

  // 4. BOX DESTINATARIO FORNITORE & DESTINAZIONE MERCE
  doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
  doc.setDrawColor(203, 213, 225)
  // Box Fornitore (Sinistra)
  doc.roundedRect(14, 34, 88, 25, 1.5, 1.5, 'FD')
  // Box Destinazione Merce (Destra)
  doc.roundedRect(108, 34, 88, 25, 1.5, 1.5, 'FD')

  // Contenuto Box Fornitore
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('SPETT.LE FORNITORE:', 17, 38.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(ordine.fornitore_nome.toUpperCase(), 17, 43.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  const indForn = fornitore?.indirizzo ? `${fornitore.indirizzo}, ${fornitore.cap || ''} ${fornitore.citta || ''} (${fornitore.provincia || ''})` : 'Indirizzo fornitore in anagrafica'
  const pivaForn = fornitore?.partita_iva ? `P.IVA: ${fornitore.partita_iva}` : ''
  const emailForn = fornitore?.email ? `Email: ${fornitore.email}` : ''
  doc.text(indForn, 17, 48)
  doc.text([pivaForn, emailForn].filter(Boolean).join(' • '), 17, 52.5)

  // Contenuto Box Destinazione Merce
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('LUOGO DI CONSEGNA / SCARICO:', 111, 38.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
  doc.text(nomeAzienda.toUpperCase(), 111, 43.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text(indirizzoAzienda, 111, 48)
  doc.text('Orario ricevimento merci: Lun-Ven 08:00-12:00 / 13:30-17:30', 111, 52.5)

  // 5. TABELLA RIGHE ARTICOLO DELL'ORDINE D'ACQUISTO
  const headers = [['Pos.', 'Codice Articolo', 'Descrizione Materiale / Specifiche', 'Quantità', 'Prezzo Unit.', 'Totale Netto']]
  const righeDati: any[] = []
  let totaleImponibile = 0

  if (ordine.righe && ordine.righe.length > 0) {
    ordine.righe.forEach((r, idx) => {
      const qta = Number(r.quantita_ordinata) || 0
      const pz = Number(r.prezzo_unitario) || 0
      const tot = Number(r.totale_riga) || (qta * pz)
      totaleImponibile += tot

      righeDati.push([
        `#${idx + 1}`,
        r.codice_articolo || 'MAT-RAW',
        r.descrizione || 'Materia prima / Semilavorato metallico',
        `${qta} ${r.unita_misura || 'm'}`,
        pz > 0 ? `€ ${pz.toFixed(2)}` : '-',
        tot > 0 ? `€ ${tot.toFixed(2)}` : '-'
      ])
    })
  } else {
    // Retro-compatibilità per ordine a riga singola storico
    const qta = Number(ordine.quantita_ordinata) || 0
    righeDati.push([
      '#1',
      ordine.articolo_id || 'MAT-RAW',
      ordine.note || 'Fornitura metallo / barre',
      `${qta} pz`,
      '-',
      '-'
    ])
  }

  autoTable(doc, {
    startY: 63,
    head: headers,
    body: righeDati,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.4,
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
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 14 },
      1: { fontStyle: 'bold', cellWidth: 36 },
      2: { cellWidth: 70 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 20 }
    },
    margin: { left: 14, right: 14 }
  })

  let currentY = (doc as any).lastAutoTable.finalY + 4

  // 6. BOX TOTALI ECONOMICI (SE PRESENTI PREZZI)
  if (totaleImponibile > 0) {
    const xTot = 120
    const wTot = 76
    const iva = Number((totaleImponibile * 0.22).toFixed(2))
    const totaleDoc = Number((totaleImponibile + iva).toFixed(2))

    doc.setFillColor(colorLightBg[0], colorLightBg[1], colorLightBg[2])
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(xTot, currentY, wTot, 16, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
    doc.text('Totale Netto Fornitura:', xTot + 3, currentY + 4.5)
    doc.text('IVA Ordinaria (22%):', xTot + 3, currentY + 9)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2])
    doc.text(`€ ${totaleImponibile.toFixed(2)}`, xTot + wTot - 3, currentY + 4.5, { align: 'right' })
    doc.text(`€ ${iva.toFixed(2)}`, xTot + wTot - 3, currentY + 9, { align: 'right' })

    doc.setFontSize(8.5)
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
    doc.text('TOTALE ORDINE:', xTot + 3, currentY + 13.5)
    doc.text(`€ ${totaleDoc.toFixed(2)}`, xTot + wTot - 3, currentY + 13.5, { align: 'right' })

    currentY += 19
  }

  // 7. NOTE DI FORNITURA / CONDIZIONI GENERALI
  const noteDoc = ordine.note || 'Richiesto certificato di collaudo e conformità 3.1 EN 10204 allegato al documento di trasporto DDT.'
  doc.setFillColor(254, 243, 199) // Ambra chiaro
  doc.setDrawColor(253, 230, 138)
  doc.roundedRect(14, currentY, 182, 9, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(146, 64, 14)
  doc.text('NOTE E PRESCRIZIONI DI FORNITURA:', 17, currentY + 3.8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 53, 15)
  doc.text(doc.splitTextToSize(noteDoc, 176), 17, currentY + 7.2)

  currentY += 13

  // 8. PIÈ DI PAGINA FIRME E TRASMISSIONE
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(14, currentY, 88, 16, 1.5, 1.5)
  doc.roundedRect(108, currentY, 88, 16, 1.5, 1.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2])
  doc.text('EMESSO DA (UFFICIO ACQUISTI):', 17, currentY + 4)
  doc.text('CONFERMA D\'ORDINE PER ACCETTAZIONE FORNITORE:', 111, currentY + 4)

  doc.setFont('helvetica', 'italic')
  doc.text('Documento elaborato elettronicamente da MachinaFlow', 17, currentY + 11)
  doc.text('Timbro e firma per accettazione fornitore', 111, currentY + 11)

  return doc
}
