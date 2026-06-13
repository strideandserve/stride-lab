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

// ── IMPROVED COMPOSITE SCORING ──
//
// The composite score is a 0-100 "how well did this shoe perform" metric.
// It's condition-adjusted so a hot, hilly run isn't penalized vs a cool flat one,
// and it weighs cardiac efficiency (how economical the effort was) alongside pace.
//
// Components:
//  - Condition-Adjusted Pace Score (base weight 35%)
//  - Cardiac Efficiency Score      (base weight 35%)
//  - Comfort Score                 (base weight 20%)
//  - Run Type Modifier              (base weight 10%, re-weights the above 3
//                                     based on the workout's purpose)
//
// Optional inputs (temp, humidity, elevation, run_type) gracefully degrade —
// if missing, that adjustment is simply skipped so older runs still score.

// Minimal shape needed from planned_runs for scoring — avoids circular import of full type
export interface PlannedRunLike {
  logged_run_id: string | null
  run_type: string
}

// Adjust a raw pace (seconds/mile) for heat, humidity, and elevation gain
// to estimate the "effort-equivalent" pace in ideal conditions.
export function adjustedPaceSeconds(run: Run): number | null {
  const raw = paceToSeconds(run.pace)
  if (raw === null) return null
  let adjusted = raw

  // Temperature: ~2% faster-equivalent per 10°F above 55°F
  if (run.temp != null && run.temp > 55) {
    const tempPenaltyPct = ((run.temp - 55) / 10) * 0.02
    adjusted = adjusted / (1 + tempPenaltyPct)
  }

  // Humidity: additional ~1% per 10% humidity above 60%, compounding with heat
  if (run.humidity != null && run.humidity > 60) {
    const humidityPenaltyPct = ((run.humidity - 60) / 10) * 0.01
    adjusted = adjusted / (1 + humidityPenaltyPct)
  }

  // Elevation: add back ~90 sec/mile for every 1000ft gained over the run
  if (run.elevation != null && run.elevation > 0 && run.miles > 0) {
    const secsPerMile = (run.elevation / 1000) * 90 / run.miles
    adjusted = adjusted - secsPerMile // subtract because adjusted pace should look FASTER once we credit the climbing
  }

  return Math.max(180, adjusted) // floor at 3:00/mi to avoid runaway values
}

// Run-type based weighting for the 3 score components: [pace, efficiency, comfort]
function runTypeWeights(runType?: string | null): [number, number, number] {
  switch (runType) {
    case 'recovery':
    case 'recovery_strides':
      return [0.15, 0.35, 0.50]
    case 'lt_run':
    case 'tempo':
      return [0.50, 0.30, 0.20]
    case 'long_run':
      return [0.30, 0.35, 0.35]
    case 'speed_intervals':
      return [0.60, 0.30, 0.10]
    case 'gen_aerobic':
    case 'med_long':
    default:
      return [0.35, 0.35, 0.30]
  }
}

export function computeCompositeScore(runs: Run[], plannedRuns: PlannedRunLike[] = []): number | null {
  const valid = runs.filter(r => r.pace && r.hr && r.comfort)
  if (!valid.length) return null

  // Map run id -> run_type from any linked planned run
  const runTypeByRunId: Record<string, string> = {}
  for (const pr of plannedRuns) {
    if (pr.logged_run_id) runTypeByRunId[pr.logged_run_id] = pr.run_type
  }

  const scores = valid.map(r => {
    const adjSecs = adjustedPaceSeconds(r)
    if (adjSecs === null) return null

    // Condition-adjusted pace score (5:00 - 12:00 /mi range)
    const paceScore = Math.max(0, Math.min(100, ((720 - adjSecs) / (720 - 300)) * 100))

    // Cardiac efficiency: ratio of adjusted pace seconds to heart rate.
    // Lower ratio (faster pace per beat) = better. Normalize 300 (best) - 900 (worst).
    const hr = r.hr ?? 160
    const efficiencyRatio = adjSecs / hr * 60 // scale so typical ratios land ~3-9
    const efficiencyScore = Math.max(0, Math.min(100, ((9 - efficiencyRatio) / (9 - 3)) * 100))

    // Comfort score
    const comfortScore = ((r.comfort ?? 5) / 10) * 100

    // Run type weighting
    const runType = runTypeByRunId[r.id] ?? null
    const [wPace, wEff, wComfort] = runTypeWeights(runType)

    return paceScore * wPace + efficiencyScore * wEff + comfortScore * wComfort
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
