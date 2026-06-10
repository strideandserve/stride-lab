import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ToastProvider from '@/components/Toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', session.user.id)
    .single()

  return (
    <AppShell userName={profile?.name ?? 'Lucas'}>
      {children}
      <ToastProvider />
    </AppShell>
  )
}
