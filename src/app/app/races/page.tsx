import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import RacesClient from '@/components/pages/RacesClient'

export default async function RacesPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: shoes }, { data: runs }] = await Promise.all([
    supabase.from('shoes').select('*').eq('user_id', session!.user.id),
    supabase.from('runs').select('*').eq('user_id', session!.user.id).eq('is_race', true).order('date', { ascending: false }),
  ])

  return <RacesClient shoes={shoes ?? []} races={runs ?? []} />
}
