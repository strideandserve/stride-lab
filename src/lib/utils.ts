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

export const RUN_TYPE_LABELS: Record<string,string> = {
  recovery:          'Recovery',
  recovery_strides:  'Recovery + Strides',
  gen_aerobic:       'Gen Aerobic',
  med_long:          'Med-Long Run',
  lt_run:            'LT Run',
  tempo:             'Tempo Run',
  long_run:          'Long Run',
  speed_intervals:   'Speed / Intervals',
}

export const RUN_TYPE_COLORS: Record<string,string> = {
  recovery:          '#527a52',
  recovery_strides:  '#6aaa6a',
  gen_aerobic:       '#39ff6a',
  med_long:          '#a8ff3e',
  lt_run:            '#ffcc00',
  tempo:             '#ff6b35',
  long_run:          '#47c8ff',
  speed_intervals:   '#ff47a0',
}

export const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// Returns the Monday (start of week) for a given YYYY-MM-DD date string
export function getMonday(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  return new Date(d.getTime() + diffToMonday * 864e5)
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
  'new balance':  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgODAiPgogIDx0ZXh0IHk9IjYyIiBmb250LWZhbWlseT0iQXJpYWwgQmxhY2ssc2Fucy1zZXJpZiIgZm9udC1zaXplPSI2OCIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0id2hpdGUiIGxldHRlci1zcGFjaW5nPSItMiI+TkI8L3RleHQ+Cjwvc3ZnPg==',
  'nb':           'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgODAiPgogIDx0ZXh0IHk9IjYyIiBmb250LWZhbWlseT0iQXJpYWwgQmxhY2ssc2Fucy1zZXJpZiIgZm9udC1zaXplPSI2OCIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0id2hpdGUiIGxldHRlci1zcGFjaW5nPSItMiI+TkI8L3RleHQ+Cjwvc3ZnPg==',
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

// ── RACE LOGOS
const RACE_LOGOS: { keywords: string[]; url: string }[] = [
  { keywords: ['chicago'],                    url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Chicago_Marathon_logo.svg' },
  { keywords: ['new york', 'nyc', 'tcs new'], url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgNDAiPgogIDxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iNDAiIHJ4PSI2IiBmaWxsPSIjMDAzMDg3Ii8+CiAgPHRleHQgeD0iODAiIHk9IjE0IiBmb250LWZhbWlseT0iQXJpYWwgQmxhY2ssc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjZmY2OTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMSI+TkVXIFlPUksgQ0lUWTwvdGV4dD4KICA8dGV4dCB4PSI4MCIgeT0iMjciIGZvbnQtZmFtaWx5PSJBcmlhbCBCbGFjayxzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgbGV0dGVyLXNwYWNpbmc9IjAuNSI+TUFSQVRIT048L3RleHQ+CiAgPHRleHQgeD0iODAiIHk9IjM3IiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSI3IiBmaWxsPSIjZmY2OTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMiI+VENTPC90ZXh0Pgo8L3N2Zz4=' },
  { keywords: ['milwaukee'],                  url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgNDAiPgogIDxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iNDAiIHJ4PSI2IiBmaWxsPSIjMGEyNzQ0Ii8+CiAgPHRleHQgeD0iODAiIHk9IjE0IiBmb250LWZhbWlseT0iQXJpYWwgQmxhY2ssc2Fucy1zZXJpZiIgZm9udC1zaXplPSI5IiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjNGRiOGZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMSI+TUlMV0FVS0VFPC90ZXh0PgogIDx0ZXh0IHg9IjgwIiB5PSIyNyIgZm9udC1mYW1pbHk9IkFyaWFsIEJsYWNrLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOSIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIwLjUiPkxBS0VGUk9OVDwvdGV4dD4KICA8dGV4dCB4PSI4MCIgeT0iMzciIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjciIGZpbGw9IiM0ZGI4ZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIxIj5NQVJBVEhPTjwvdGV4dD4KPC9zdmc+' },
  { keywords: ['boston'],                     url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Boston_Marathon_logo_%28updated_2024%29.png/250px-Boston_Marathon_logo_%28updated_2024%29.png' },
  { keywords: ['london'],                     url: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/26/TCS_London_Marathon_logo.svg/250px-TCS_London_Marathon_logo.svg.png' },
  { keywords: ['berlin'],                     url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/BMW_Berlin_Marathon_logo.svg/250px-BMW_Berlin_Marathon_logo.svg.png' },
  { keywords: ['tokyo'],                      url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Tokyo_Marathon_logo.svg/250px-Tokyo_Marathon_logo.svg.png' },
  { keywords: ['los angeles', 'la marathon'], url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/LA_Marathon_logo.svg/250px-LA_Marathon_logo.svg.png' },
  { keywords: ['marine corps'],               url: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Marine_Corps_Marathon_logo.svg/200px-Marine_Corps_Marathon_logo.svg.png' },
]

export function getRaceLogoUrl(raceName: string | null | undefined): string | null {
  if (!raceName) return null
  const lower = raceName.toLowerCase()
  for (const { keywords, url } of RACE_LOGOS) {
    if (keywords.some(k => lower.includes(k))) return url
  }
  return null
}
