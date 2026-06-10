import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import LockerClient from '@/components/pages/LockerClient'

export default async function LockerPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: shoes }, { data: runs }] = await Promise.all([
    supabase.from('shoes').select('*').eq('user_id', session!.user.id).order('created_at'),
    supabase.from('runs').select('*').eq('user_id', session!.user.id).order('date', { ascending: false }),
  ])

  return <LockerClient shoes={shoes ?? []} runs={runs ?? []} />
}
