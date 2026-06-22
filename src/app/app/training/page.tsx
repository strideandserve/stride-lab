import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import TrainingClient from '@/components/pages/TrainingClient'

export default async function TrainingPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: plans }, { data: plannedRuns }, { data: shoes }, { data: runs }, { data: profileRow }] = await Promise.all([
    supabase.from('training_plans').select('*').eq('user_id', session!.user.id).order('created_at', { ascending: false }),
    supabase.from('planned_runs').select('*').eq('user_id', session!.user.id).order('date'),
    supabase.from('shoes').select('*').eq('user_id', session!.user.id),
    supabase.from('runs').select('*').eq('user_id', session!.user.id),
    supabase.from('profiles').select('goal_marathon_pace, max_hr, lt_pace').eq('id', session!.user.id).single(),
  ])

  return (
    <TrainingClient
      plans={plans ?? []}
      plannedRuns={plannedRuns ?? []}
      shoes={shoes ?? []}
      runs={runs ?? []}
      goalMarathonPace={profileRow?.goal_marathon_pace ?? null}
      maxHr={profileRow?.max_hr ?? null}
      ltPace={profileRow?.lt_pace ?? null}
    />
  )
}
