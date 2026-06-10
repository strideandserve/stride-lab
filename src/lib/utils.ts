import type { Run, Category } from './types'

export function paceToSeconds(pace: string | null): number | null {
  if (!pace) return null
  const parts = pace.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export function secondsToPace(secs: number | null): string {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = String(Math.round(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

export function paceToFinishTime(pace: string | null, distanceMi: number): string | null {
  const secs = paceToSeconds(pace)
  if (!secs || !distanceMi) return null
  const total = Math.round(secs * distanceMi)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export function finishTimeToSeconds(t: string): number | null {
  if (!t) return null
  const parts = t.trim().split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export function derivePaceFromFinish(finishStr: string, miles: number): string | null {
  const totalSecs = finishTimeToSeconds(finishStr)
  if (!totalSecs || !miles || miles <= 0) return null
  const paceSecs = totalSecs / miles
  const m = Math.floor(paceSecs / 60)
  const s = String(Math.round(paceSecs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

export function computeCompositeScore(runs: Run[]): number | null {
  const valid = runs.filter(r => r.pace && r.hr && r.comfort)
  if (!valid.length) return null
  const scores = valid.map(r => {
    const ps = paceToSeconds(r.pace)
    if (!ps) return null
    const paceScore    = Math.max(0, Math.min(100, ((720 - ps) / (720 - 300)) * 100))
    const hrScore      = Math.max(0, Math.min(100, ((200 - (r.hr ?? 160)) / (200 - 120)) * 100))
    const comfortScore = ((r.comfort ?? 5) / 10) * 100
    return paceScore * 0.40 + hrScore * 0.35 + comfortScore * 0.25
  }).filter((s): s is number => s !== null)
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
}

export function catLabel(cat: Category | string): string {
  return { daily: 'Daily', speed: 'Speed', race: 'Race Day' }[cat] ?? cat
}

export function raceTypeLabel(type: string | null): string {
  if (!type) return 'Race'
  return { marathon: 'Marathon', half: 'Half Marathon', ten_k: '10K', five_k: '5K', other: 'Race' }[type] ?? 'Race'
}

export const CAT_COLORS: Record<string, string> = {
  daily: '#39ff6a',
  speed: '#ff6b35',
  race:  '#a8ff3e',
}

export const BRAND_LOGOS: Record<string, string> = {
  'nike':         'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
  'adidas':       'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg',
  'asics':        'https://upload.wikimedia.org/wikipedia/commons/b/b1/Asics_Logo.svg',
  'brooks':       'https://upload.wikimedia.org/wikipedia/commons/6/6c/Brooks_Running_logo.svg',
  'new balance':  'https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg',
  'nb':           'https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg',
  'saucony':      'https://upload.wikimedia.org/wikipedia/commons/3/38/Saucony_logo.svg',
  'on':           'https://upload.wikimedia.org/wikipedia/commons/6/6b/On_Running_logo.svg',
  'on running':   'https://upload.wikimedia.org/wikipedia/commons/6/6b/On_Running_logo.svg',
  'mizuno':       'https://upload.wikimedia.org/wikipedia/commons/d/d6/Mizuno_logo.svg',
  'puma':         'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjx0ZXh0IHk9IjQwIiBmb250LWZhbWlseT0iQXJpYWwgQmxhY2ssc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0MiIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0id2hpdGUiIGxldHRlci1zcGFjaW5nPSIyIj5QVU1BPC90ZXh0Pjwvc3ZnPg==',
  'under armour': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Under_armour_logo.svg',
  'ua':           'https://upload.wikimedia.org/wikipedia/commons/4/44/Under_armour_logo.svg',
  'hoka':         'https://upload.wikimedia.org/wikipedia/commons/b/b5/Hoka_One_One_logo.svg',
  'salomon':      'https://upload.wikimedia.org/wikipedia/commons/8/8c/Salomon_logo.svg',
}

export function getBrandLogoUrl(brand: string): string | null {
  return BRAND_LOGOS[(brand || '').toLowerCase().trim()] ?? null
}
