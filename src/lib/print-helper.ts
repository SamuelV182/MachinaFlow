/**
 * Utility per stampare un elemento HTML o un documento isolato
 * iniettandolo in un iframe temporaneo nascosto.
 * Questo garantisce che l'anteprima di stampa non erediti mai
 * layout complessi (AppShell, sidebar, fixed containers, dark background).
 */
export function stampaElementoIsolato(elemento: HTMLElement | null, titoloDocumento: string = 'Stampa Documento') {
  if (!elemento) return

  // Clona il contenuto HTML
  const contenutoHtml = elemento.innerHTML

  // Crea iframe invisibile
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'

  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    window.print()
    return
  }

  // Costruisci il documento di stampa autonomo con stili esatti
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="it">
      <head>
        <meta charset="utf-8" />
        <title>${titoloDocumento}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background-color: #f8fafc !important;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #475569;
          }
          .border {
            border: 1px solid #e2e8f0;
          }
          .rounded-xl, .rounded-2xl {
            border-radius: 8px;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .text-orange-600 { color: #ea580c !important; }
          .text-slate-900 { color: #0f172a !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-500 { color: #64748b !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-orange-50\\/50 { background-color: #fff7ed !important; }
          .border-orange-200\\/80 { border-color: #fed7aa !important; }
          .border-slate-200 { border-color: #e2e8f0 !important; }
          .border-slate-900 { border-color: #0f172a !important; }
          .grid { display: flex; gap: 12px; }
          .grid > div { flex: 1; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .uppercase { text-transform: uppercase; }
          .mb-3 { margin-bottom: 12px; }
          .mt-0\\.5 { margin-top: 2px; }
          .pb-4 { padding-bottom: 16px; }
          .p-4 { padding: 16px; }
          .p-3\\.5 { padding: 14px; }
          .space-y-6 > * + * { margin-top: 16px; }
          .w-full { width: 100%; }
        </style>
      </head>
      <body>
        <div>${contenutoHtml}</div>
      </body>
    </html>
  `)
  doc.close()

  // Lascia al browser il tempo di fare il render dei font e lancia la stampa
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      window.print()
    } finally {
      // Rimuovi l'iframe dopo la chiusura del dialogo di stampa
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }
  }, 250)
}
