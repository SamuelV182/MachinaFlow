'use client'

import { useState } from 'react'
import { X, Send, CheckCircle2, MessageCircle, Sparkles, Building2, User, Phone, Mail, HelpCircle } from 'lucide-react'

interface ModaleRichiestaDemoProps {
  aperta: boolean
  onChiudi: () => void
  numeroTelefonoWhatsApp?: string
}

export function ModaleRichiestaDemo({
  aperta,
  onChiudi,
  numeroTelefonoWhatsApp = '393330000000'
}: ModaleRichiestaDemoProps) {
  const [inviato, setInviato] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    officina: '',
    email: '',
    telefono: '',
    numeroMacchine: '1-5 macchine CNC',
    note: ''
  })

  if (!aperta) return null

  const handleInvia = (e: React.FormEvent) => {
    e.preventDefault()
    setInviato(true)

    // Se preferisci inviare direttamente i dati del modulo su WhatsApp all'invio:
    const messaggio = encodeURIComponent(
      `*Nuova Richiesta Demo MachinaFlow*\n` +
      `• *Nome:* ${form.nome}\n` +
      `• *Officina:* ${form.officina}\n` +
      `• *Telefono:* ${form.telefono}\n` +
      `• *Email:* ${form.email}\n` +
      `• *Parco Macchine:* ${form.numeroMacchine}\n` +
      `• *Obiettivo:* ${form.note || 'Nessuna nota aggiuntiva'}`
    )

    // Apri subito la chat WhatsApp con i dati precompilati
    setTimeout(() => {
      window.open(`https://wa.me/${numeroTelefonoWhatsApp}?text=${messaggio}`, '_blank')
    }, 400)
  }

  const apriWhatsAppManuale = () => {
    const messaggio = encodeURIComponent(
      `*Richiesta Demo MachinaFlow*\n` +
      `• *Nome:* ${form.nome}\n` +
      `• *Officina:* ${form.officina}\n` +
      `• *Telefono:* ${form.telefono}\n` +
      `• *Email:* ${form.email}\n` +
      `• *Macchine:* ${form.numeroMacchine}`
    )
    window.open(`https://wa.me/${numeroTelefonoWhatsApp}?text=${messaggio}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Pulsante Chiusura */}
        <button
          onClick={onChiudi}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {inviato ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-black text-white">Richiesta Registrata!</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Grazie <strong>{form.nome}</strong>. Se la finestra WhatsApp non si è aperta automaticamente, tocca il pulsante verde qui sotto per trasmetterci il messaggio con un tocco.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={apriWhatsAppManuale}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Invia su WhatsApp adesso</span>
              </button>
              <button
                onClick={onChiudi}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvia} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Programma Pilota Gratuito</span>
              </div>
              <h3 className="text-2xl font-black text-white">Prenota una Demo di 15 Minuti</h3>
              <p className="text-xs text-slate-400 mt-1">
                Riceverai una dimostrazione su misura per il tuo parco macchine senza alcun impegno d&apos;acquisto.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Il tuo Nome *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Mario Rossi"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Officina / Azienda *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={form.officina}
                    onChange={(e) => setForm({ ...form, officina: e.target.value })}
                    placeholder="Meccanica di Precisione Srl"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Aziendale *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="info@officinameccanica.it"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Telefono / Cellulare *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+39 333 1234567"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 font-semibold mb-1">Parco Macchine</label>
              <select
                value={form.numeroMacchine}
                onChange={(e) => setForm({ ...form, numeroMacchine: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="1-5 macchine CNC">Da 1 a 5 centri di lavoro / torni CNC</option>
                <option value="6-15 macchine CNC">Da 6 a 15 centri di lavoro CNC</option>
                <option value="15+ macchine CNC">Oltre 15 centri di lavoro / Reparti multipli</option>
              </select>
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 font-semibold mb-1">Cosa vorresti risolvere per primo? (Facoltativo)</label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Es. Vogliamo eliminare Excel, monitorare gli scarti, mettere tablet CNC..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Conferma e Richiedi la Demo</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
