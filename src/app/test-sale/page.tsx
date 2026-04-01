'use client'

import { useState } from 'react'

export default function TestSalePage() {
  const [total, setTotal] = useState('100')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    setResult('')

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        total: Number(total),
        organization_id: 'fbd2f827-0c5d-47f7-ac17-903370f52210',
      }),
    })

    const json = await res.json()

    setResult(JSON.stringify(json, null, 2))
    setLoading(false)
  }

  return (
    <main className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Teste de Venda</h1>

      <div className="space-y-4">
        <input
          type="number"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar venda'}
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