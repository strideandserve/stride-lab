import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ToastProvider from '@/components/Toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, name, birth_year, gender, height_in, weight_lb, created_at')
    .eq('id', session.user.id)
    .single()

  const profile = {
    id: session.user.id,
    name: profileRow?.name ?? 'Lucas',
    birth_year: profileRow?.birth_year ?? null,
    gender: profileRow?.gender ?? null,
    height_in: profileRow?.height_in ?? null,
    weight_lb: profileRow?.weight_lb ?? null,
    created_at: profileRow?.created_at ?? '',
  }

  return (
    <AppShell userName={profile.name} profile={profile}>
      {children}
      <ToastProvider />
    </AppShell>
  )
}
