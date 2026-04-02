'use client'

import { useState } from 'react'

export default function TestDeadEventsPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreateFailing() {
    setLoading(true)
    setResult('')

    const res = await fetch('/api/events/create-failing', {
      method: 'POST',
    })

    const json = await res.json()
    setResult(JSON.stringify(json, null, 2))
    setLoading(false)
  }

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
      <h1 className="text-2xl font-bold mb-4">Teste Dead Events</h1>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleCreateFailing}
            disabled={loading}
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Criar evento com falha
          </button>

          <button
            onClick={handleProcess}
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            Processar eventos
          </button>
        </div>

        {result && (
          <pre className="rounded border p-4 text-sm whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </div>
    </main>
  )
}