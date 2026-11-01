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

  // Crea iframe invisibile ma con dimensioni fisiche per evitare rallentamenti del render engine di Chromium
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '0'
  iframe.style.left = '0'
  iframe.style.width = '100vw'
  iframe.style.height = '100vh'
  iframe.style.border = '0'
  iframe.style.zIndex = '-9999'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'

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
            margin: 8mm;
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
            font-size: 11px;
            line-height: 1.35;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 5px 7px;
            border-bottom: 1px solid #cbd5e1;
          }
          th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .border {
            border: 1px solid #cbd5e1;
          }
          .border-b-2 {
            border-bottom: 2px solid #0f172a;
          }
          .border-2 {
            border-width: 2px;
          }
          .rounded-xl, .rounded-2xl {
            border-radius: 8px;
          }
          .rounded-lg {
            border-radius: 6px;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .font-extrabold { font-weight: 800; }
          .font-medium { font-weight: 500; }
          .text-pink-700 { color: #be185d !important; }
          .text-pink-800 { color: #9d174d !important; }
          .text-orange-600 { color: #ea580c !important; }
          .text-emerald-800 { color: #065f46 !important; }
          .text-slate-900 { color: #0f172a !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-slate-700 { color: #334155 !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-slate-400 { color: #94a3b8 !important; }
          .text-amber-900 { color: #78350f !important; }
          .text-white { color: #ffffff !important; }
          .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-emerald-50\\/30 { background-color: #ecfdf5 !important; }
          .bg-pink-50\\/30 { background-color: #fdf2f8 !important; }
          .bg-amber-50 { background-color: #fffbeb !important; }
          .border-slate-900 { border-color: #0f172a !important; }
          .border-slate-400 { border-color: #94a3b8 !important; }
          .border-slate-300 { border-color: #cbd5e1 !important; }
          .border-slate-200 { border-color: #e2e8f0 !important; }
          .border-emerald-600\\/70 { border-color: #059669 !important; }
          .border-pink-700\\/60 { border-color: #be185d !important; }
          .border-amber-200 { border-color: #fde68a !important; }
          .grid { display: flex; gap: 10px; }
          .grid-cols-2 > div { flex: 1; }
          .grid-cols-3 > div { flex: 1; }
          .grid-cols-4 > div { flex: 1; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .uppercase { text-transform: uppercase; }
          .whitespace-nowrap { white-space: nowrap; }
          .tracking-widest { letter-spacing: 0.1em; }
          .tracking-tight { letter-spacing: -0.025em; }
          .leading-tight { line-height: 1.25; }
          .block { display: block; }
          .gap-1 { gap: 4px; }
          .gap-3 { gap: 10px; }
          .gap-4 { gap: 12px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-4 > * + * { margin-top: 12px; }
          .space-y-6 > * + * { margin-top: 14px; }
          .space-y-10 > * + * { margin-top: 24px; }
          .p-3 { padding: 10px; }
          .p-3\\.5 { padding: 12px; }
          .p-8 { padding: 16px; }
          .pt-2 { padding-top: 8px; }
          .pt-6 { padding-top: 14px; }
          .pb-5 { padding-bottom: 12px; }
          .mt-0\\.5 { margin-top: 2px; }
          .mt-1 { margin-top: 4px; }
          .w-full { width: 100%; }
          .min-w-\\[240px\\] { min-width: 220px; }
          .text-\\[9px\\] { font-size: 9px; }
          .text-\\[10px\\] { font-size: 10px; }
          .text-\\[11px\\] { font-size: 11px; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 12px; }
          .text-base { font-size: 14px; }
          .text-lg { font-size: 16px; }
          .text-2xl { font-size: 18px; }
        </style>
      </head>
      <body>
        <div>${contenutoHtml}</div>
      </body>
    </html>
  `)
  doc.close()

  // Esegui la stampa non appena l'iframe è caricato, senza ritardi artificiali
  const avviaStampa = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      window.print()
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 500)
    }
  }

  // Verifica se il document dell'iframe è già pronto
  if (doc.readyState === 'complete') {
    avviaStampa()
  } else {
    iframe.onload = avviaStampa
  }
}
