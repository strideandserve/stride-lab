import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { MAJORS, RACE_SERIES } from '@/lib/majors'
import MajorDetailClient from '@/components/pages/MajorDetailClient'

export function generateStaticParams() {
  return MAJORS.map(m => ({ id: m.id }))
}

export default async function MajorDetailPage({ params }: { params: { id: string } }) {
  const major = MAJORS.find(m => m.id === params.id)
  if (!major) notFound()

  const series = RACE_SERIES.filter(s => s.majorId === params.id)

  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  let seriesProgress: Record<string, { signed_up: boolean; finished: boolean; finish_time: string | null }> = {}

  if (session && series.length > 0) {
    const seriesIds = series.map(s => s.id)
    const { data } = await supabase
      .from('race_series_progress')
      .select('series_id, race_id, signed_up, finished, finish_time')
      .eq('user_id', session.user.id)
      .in('series_id', seriesIds)

    if (data) {
      data.forEach(row => {
        seriesProgress[`${row.series_id}__${row.race_id}`] = {
          signed_up: row.signed_up,
          finished: row.finished,
          finish_time: row.finish_time,
        }
      })
    }
  }

  return (
    <MajorDetailClient
      major={major}
      series={series}
      seriesProgress={seriesProgress}
      userId={session?.user.id ?? null}
    />
  )
}
