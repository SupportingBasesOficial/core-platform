import { getUser } from '@/server/auth/getUser'

export default async function TestAuthPage() {
  const user = await getUser()

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teste de Auth</h1>

      {!user ? (
        <div className="rounded border p-4 text-red-600">
          Nenhum usuário autenticado
        </div>
      ) : (
        <div className="rounded border p-4 space-y-2">
          <div><strong>ID:</strong> {user.id}</div>
          <div><strong>Email:</strong> {user.email}</div>
        </div>
      )}
    </main>
  )
}