import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import MajorsClient from '@/components/pages/MajorsClient'

export default async function MajorsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: profileRow }, { data: races }, { data: upcomingRaces }] = await Promise.all([
    supabase.from('profiles').select('id, birth_year, gender, lottery_entries').eq('id', session!.user.id).single(),
    supabase.from('runs').select('finish_time, race_type, race_name, date').eq('user_id', session!.user.id).eq('is_race', true).order('date', { ascending: false }),
    supabase.from('upcoming_races').select('name, date').eq('user_id', session!.user.id),
  ])

  return (
    <MajorsClient
      profile={profileRow ?? null}
      races={races ?? []}
      upcomingRaces={upcomingRaces ?? []}
    />
  )
}
