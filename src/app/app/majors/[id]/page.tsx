import { notFound } from 'next/navigation'
import { MAJORS, RACE_SERIES } from '@/lib/majors'
import MajorDetailClient from '@/components/pages/MajorDetailClient'

export function generateStaticParams() {
  return MAJORS.map(m => ({ id: m.id }))
}

export default function MajorDetailPage({ params }: { params: { id: string } }) {
  const major = MAJORS.find(m => m.id === params.id)
  if (!major) notFound()
  const series = RACE_SERIES.filter(s => s.majorId === params.id)
  return <MajorDetailClient major={major} series={series} />
}
