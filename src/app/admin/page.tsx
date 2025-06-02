import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types/profile'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const session = await auth()

  // Verifica autenticazione
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Verifica ruolo Sentinel
  if (session.user.role !== UserRole.Sentinel) {
    redirect('/dashboard?error=insufficient-permissions')
  }

  return <AdminDashboard />
}
