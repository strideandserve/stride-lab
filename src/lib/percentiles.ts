// ── RACE PERFORMANCE PERCENTILES ──
//
// Estimated finish-time benchmarks by distance, gender, and age group, derived from
// aggregate recreational race-finish datasets (RunRepeat global finish statistics,
// USATF road race data, and major U.S. marathon results — Chicago, NYC, Boston, LA,
// Houston). These are directional estimates for motivation and goal-setting, not
// precise rankings — actual results vary by race, course, weather, and field size.
//
// Each row gives 5 finish-time benchmarks (in seconds):
//   p90 = time that beats ~90% of your age/gender group (fast)
//   p75 = beats ~75%
//   p50 = median — beats ~50%
//   p25 = beats ~25%
//   p10 = beats ~10% (back of pack)
//
// A faster (lower) time than p90 puts you above the 90th percentile for your group.

export type RaceDistance = 'marathon' | 'half' | 'ten_k' | 'five_k'
export type Gender = 'male' | 'female'

export interface PercentileRow {
  p90: number
  p75: number
  p50: number
  p25: number
  p10: number
}

export const DISTANCE_LABELS: Record<RaceDistance, string> = {
  marathon: 'Marathon',
  half: 'Half Marathon',
  ten_k: '10K',
  five_k: '5K',
}

interface AgeGroupDef { label: string; min: number; max: number }

export const AGE_GROUPS: AgeGroupDef[] = [
  { label: '18-29', min: 18, max: 29 },
  { label: '30-39', min: 30, max: 39 },
  { label: '40-49', min: 40, max: 49 },
  { label: '50-59', min: 50, max: 59 },
  { label: '60-69', min: 60, max: 69 },
  { label: '70+',   min: 70, max: 130 },
]

export function getAgeGroup(age: number): string {
  for (const g of AGE_GROUPS) {
    if (age >= g.min && age <= g.max) return g.label
  }
  return age < 18 ? '18-29' : '70+'
}

// Convert minutes -> seconds for table readability below
const m = (min: number) => Math.round(min * 60)

type DistanceTable = Record<Gender, Record<string, PercentileRow>>

export const PERCENTILE_TABLE: Record<RaceDistance, DistanceTable> = {
  marathon: {
    male: {
      '18-29': { p90: m(195), p75: m(215), p50: m(245), p25: m(290), p10: m(340) },
      '30-39': { p90: m(190), p75: m(210), p50: m(240), p25: m(285), p10: m(335) },
      '40-49': { p90: m(200), p75: m(220), p50: m(250), p25: m(295), p10: m(345) },
      '50-59': { p90: m(215), p75: m(235), p50: m(265), p25: m(310), p10: m(360) },
      '60-69': { p90: m(235), p75: m(260), p50: m(290), p25: m(335), p10: m(385) },
      '70+':   { p90: m(265), p75: m(295), p50: m(325), p25: m(370), p10: m(420) },
    },
    female: {
      '18-29': { p90: m(215), p75: m(240), p50: m(275), p25: m(325), p10: m(380) },
      '30-39': { p90: m(212), p75: m(235), p50: m(270), p25: m(320), p10: m(375) },
      '40-49': { p90: m(222), p75: m(245), p50: m(280), p25: m(330), p10: m(385) },
      '50-59': { p90: m(238), p75: m(262), p50: m(297), p25: m(347), p10: m(400) },
      '60-69': { p90: m(260), p75: m(288), p50: m(323), p25: m(370), p10: m(425) },
      '70+':   { p90: m(292), p75: m(325), p50: m(360), p25: m(410), p10: m(465) },
    },
  },
  half: {
    male: {
      '18-29': { p90: m(85),  p75: m(95),  p50: m(112), p25: m(132), p10: m(155) },
      '30-39': { p90: m(83),  p75: m(93),  p50: m(110), p25: m(130), p10: m(153) },
      '40-49': { p90: m(87),  p75: m(97),  p50: m(115), p25: m(136), p10: m(158) },
      '50-59': { p90: m(93),  p75: m(104), p50: m(123), p25: m(145), p10: m(168) },
      '60-69': { p90: m(102), p75: m(114), p50: m(134), p25: m(158), p10: m(183) },
      '70+':   { p90: m(115), p75: m(128), p50: m(150), p25: m(176), p10: m(204) },
    },
    female: {
      '18-29': { p90: m(98),  p75: m(110), p50: m(130), p25: m(154), p10: m(180) },
      '30-39': { p90: m(96),  p75: m(108), p50: m(128), p25: m(151), p10: m(178) },
      '40-49': { p90: m(101), p75: m(113), p50: m(134), p25: m(158), p10: m(184) },
      '50-59': { p90: m(108), p75: m(121), p50: m(143), p25: m(169), p10: m(196) },
      '60-69': { p90: m(118), p75: m(132), p50: m(156), p25: m(184), p10: m(214) },
      '70+':   { p90: m(134), p75: m(149), p50: m(175), p25: m(206), p10: m(240) },
    },
  },
  ten_k: {
    male: {
      '18-29': { p90: m(42), p75: m(47), p50: m(55), p25: m(66), p10: m(78) },
      '30-39': { p90: m(41), p75: m(46), p50: m(54), p25: m(65), p10: m(77) },
      '40-49': { p90: m(43), p75: m(48), p50: m(57), p25: m(68), p10: m(80) },
      '50-59': { p90: m(46), p75: m(52), p50: m(61), p25: m(73), p10: m(86) },
      '60-69': { p90: m(51), p75: m(57), p50: m(67), p25: m(80), p10: m(94) },
      '70+':   { p90: m(58), p75: m(65), p50: m(76), p25: m(91), p10: m(107) },
    },
    female: {
      '18-29': { p90: m(49), p75: m(55), p50: m(65), p25: m(78), p10: m(92) },
      '30-39': { p90: m(48), p75: m(54), p50: m(64), p25: m(77), p10: m(91) },
      '40-49': { p90: m(51), p75: m(57), p50: m(67), p25: m(80), p10: m(94) },
      '50-59': { p90: m(54), p75: m(61), p50: m(72), p25: m(86), p10: m(101) },
      '60-69': { p90: m(60), p75: m(67), p50: m(79), p25: m(94), p10: m(111) },
      '70+':   { p90: m(68), p75: m(77), p50: m(90), p25: m(107), p10: m(126) },
    },
  },
  five_k: {
    male: {
      '18-29': { p90: m(20),   p75: m(23),   p50: m(27),   p25: m(33), p10: m(39) },
      '30-39': { p90: m(20),   p75: m(22.5), p50: m(26.5), p25: m(32), p10: m(38) },
      '40-49': { p90: m(21),   p75: m(24),   p50: m(28),   p25: m(34), p10: m(40) },
      '50-59': { p90: m(22.5), p75: m(25.5), p50: m(30),   p25: m(36), p10: m(43) },
      '60-69': { p90: m(25),   p75: m(28.5), p50: m(33.5), p25: m(40), p10: m(47) },
      '70+':   { p90: m(29),   p75: m(33),   p50: m(38.5), p25: m(46), p10: m(55) },
    },
    female: {
      '18-29': { p90: m(23.5), p75: m(27),   p50: m(32),   p25: m(39),   p10: m(46) },
      '30-39': { p90: m(23.5), p75: m(26.5), p50: m(31),   p25: m(38),   p10: m(45) },
      '40-49': { p90: m(24.5), p75: m(28.5), p50: m(33),   p25: m(40),   p10: m(47) },
      '50-59': { p90: m(26.5), p75: m(30),   p50: m(35),   p25: m(42.5), p10: m(51) },
      '60-69': { p90: m(29.5), p75: m(33.5), p50: m(39.5), p25: m(47),   p10: m(55.5) },
      '70+':   { p90: m(34),   p75: m(39),   p50: m(45.5), p25: m(54),   p10: m(65) },
    },
  },
}

export function raceTypeToDistance(raceType: string | null | undefined): RaceDistance | null {
  if (raceType === 'marathon') return 'marathon'
  if (raceType === 'half') return 'half'
  if (raceType === 'ten_k') return 'ten_k'
  if (raceType === 'five_k') return 'five_k'
  return null
}

export function getPercentileRow(distance: RaceDistance, gender: Gender, age: number): PercentileRow {
  const ageGroup = getAgeGroup(age)
  return PERCENTILE_TABLE[distance][gender][ageGroup]
}

// Derive an estimated "Top 5%" benchmark by extending the p75->p90 trend
// half as far again — p90 to p95 covers 5 percentile points vs p75 to p90's 15.
export function getP95(row: PercentileRow): number {
  return Math.round(row.p90 + (row.p90 - row.p75) / 3)
}

// Estimate where a finish time falls (1-99), where higher = faster relative to peers.
// Interpolates between the 5 benchmark points; extrapolates gently beyond the ends.
export function estimatePercentile(timeSecs: number, row: PercentileRow): number {
  const points: [number, number][] = [
    [getP95(row), 95],
    [row.p90, 90],
    [row.p75, 75],
    [row.p50, 50],
    [row.p25, 25],
    [row.p10, 10],
  ]

  if (timeSecs <= points[0][0]) {
    const [t1, v1] = points[0]
    const [t2, v2] = points[1]
    const slope = (v2 - v1) / (t2 - t1)
    return Math.max(1, Math.min(99, Math.round(v1 + slope * (timeSecs - t1))))
  }

  if (timeSecs >= points[points.length - 1][0]) {
    const [t1, v1] = points[points.length - 2]
    const [t2, v2] = points[points.length - 1]
    const slope = (v2 - v1) / (t2 - t1)
    return Math.max(1, Math.min(99, Math.round(v2 + slope * (timeSecs - t2))))
  }

  for (let i = 0; i < points.length - 1; i++) {
    const [t1, v1] = points[i]
    const [t2, v2] = points[i + 1]
    if (timeSecs >= t1 && timeSecs <= t2) {
      const frac = (timeSecs - t1) / (t2 - t1)
      return Math.round(v1 + frac * (v2 - v1))
    }
  }

  return 50
}

// Format a percentile rank as a friendly "top X%" string
export function percentileToTopPct(percentile: number): string {
  const topPct = 100 - percentile
  if (topPct < 1) return 'Top 1%'
  return `Top ${Math.round(topPct)}%`
}
