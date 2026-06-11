import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import HomeClient from '@/components/pages/HomeClient'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: shoes }, { data: runs }, { data: profile }, { data: upcomingRaces }, { data: activePlan }, { data: plannedRuns }] = await Promise.all([
    supabase.from('shoes').select('*').eq('user_id', session!.user.id).order('created_at'),
    supabase.from('runs').select('*').eq('user_id', session!.user.id).order('date'),
    supabase.from('profiles').select('name').eq('id', session!.user.id).single(),
    supabase.from('upcoming_races').select('*').eq('user_id', session!.user.id).gte('date', new Date().toISOString().split('T')[0]).order('date'),
    supabase.from('training_plans').select('*').eq('user_id', session!.user.id).eq('active', true).single(),
    supabase.from('planned_runs').select('*').eq('user_id', session!.user.id).order('date'),
  ])

  return (
    <HomeClient
      shoes={shoes ?? []}
      runs={runs ?? []}
      userName={profile?.name ?? 'Lucas'}
      upcomingRaces={upcomingRaces ?? []}
      activePlan={activePlan ?? null}
      plannedRuns={plannedRuns ?? []}
    />
  )
}
