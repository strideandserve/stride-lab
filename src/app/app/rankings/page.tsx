import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import RankingsClient from '@/components/pages/RankingsClient'

export default async function RankingsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: shoes }, { data: runs }] = await Promise.all([
    supabase.from('shoes').select('*').eq('user_id', session!.user.id).order('created_at'),
    supabase.from('runs').select('*').eq('user_id', session!.user.id),
  ])

  return <RankingsClient shoes={shoes ?? []} runs={runs ?? []} />
}
