import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types/profile'
import AdminUserDetail from '@/components/admin/AdminUserDetail'

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (session.user.role !== UserRole.Sentinel) {
    redirect('/dashboard?error=insufficient-permissions')
  }

  const { id } = await params

  return <AdminUserDetail userId={id} />
}
