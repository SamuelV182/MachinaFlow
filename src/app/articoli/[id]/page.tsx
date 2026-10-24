import { Suspense } from 'react'
import { ArticoloDettaglioClient } from './ArticoloDettaglioClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ArticoloDettaglioPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Caricamento anagrafica articolo, distinta e ciclo...</p>
        </div>
      }
    >
      <ArticoloDettaglioWrapper params={params} />
    </Suspense>
  )
}

async function ArticoloDettaglioWrapper({ params }: PageProps) {
  const { id } = await params
  return <ArticoloDettaglioClient articoloId={id} />
}
