import { getUser } from '@/server/auth/getUser'
import { getCurrentOrg } from '@/server/auth/getCurrentOrg'

export default async function TestTenantPage() {
  const user = await getUser()

  if (!user) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Teste de Tenant</h1>
        <div className="rounded border p-4 text-red-600">
          Nenhum usuário autenticado
        </div>
      </main>
    )
  }

  const membership = await getCurrentOrg(user.id)

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Tenant</h1>

      <div className="rounded border p-4 space-y-2">
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Organization ID:</strong> {membership?.organization_id ?? '—'}</div>
        <div><strong>Role:</strong> {membership?.role ?? '—'}</div>
      </div>
    </main>
  )
}