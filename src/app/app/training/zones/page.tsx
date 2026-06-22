import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import TrainingZonesClient from '@/components/pages/TrainingZonesClient'

export default async function TrainingZonesPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('goal_marathon_pace, max_hr, lt_pace')
    .eq('id', session!.user.id)
    .single()

  return (
    <TrainingZonesClient
      initialGoalPace={profileRow?.goal_marathon_pace ?? ''}
      initialMaxHr={profileRow?.max_hr ?? null}
      initialLtPace={profileRow?.lt_pace ?? ''}
      userId={session!.user.id}
    />
  )
}
