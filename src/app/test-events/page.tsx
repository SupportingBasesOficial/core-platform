'use client'

import { useState } from 'react'

export default function TestEventsPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleProcess() {
    setLoading(true)
    setResult('')

    const res = await fetch('/api/events/process', {
      method: 'POST',
    })

    const json = await res.json()

    setResult(JSON.stringify(json, null, 2))
    setLoading(false)
  }

  return (
    <main className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Teste de Eventos</h1>

      <div className="space-y-4">
        <button
          onClick={handleProcess}
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Processar eventos'}
        </button>

        {result && (
          <pre className="rounded border p-4 text-sm whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </div>
    </main>
  )
}