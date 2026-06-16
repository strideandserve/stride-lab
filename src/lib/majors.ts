// ── WORLD MARATHON MAJORS DATA ──
// Sources: therunningchannel.com (updated April 2026), marathonballot.com,
// official race websites. Race dates are for 2026 season.
// Qualifying times sourced from official race sites (April 2026).
// Lottery windows are approximate — check official sites for exact dates.

export interface MajorMarathon {
  id: string
  name: string
  city: string
  country: string
  flag: string
  raceDate2026: string           // YYYY-MM-DD
  raceDate2027: string           // YYYY-MM-DD (estimated where not yet announced)
  entryMethod: 'lottery' | 'qualifier-only' | 'both'
  lotteryWindow: string          // Human-readable
  lotteryOpens: string | null    // Approx YYYY-MM-DD for next cycle
  lotteryCloses: string | null
  lotteryOdds: string            // e.g. "<10%"
  qualifyingTimes: QualifyingTimes | null
  qualifyingNotes: string
  entryUrl: string
  guaranteed: boolean            // true if meeting time guarantees entry
  color: string                  // brand color for card accent
}

export interface QualifyingTimes {
  male: AgeGroupTimes
  female: AgeGroupTimes
}

export type AgeGroupTimes = {
  '18-34': string
  '35-39': string
  '40-44': string
  '45-49': string
  '50-54': string
  '55-59': string
  '60-64': string
  '65-69': string
  '70-74': string
  '75+': string
}

export const MAJORS: MajorMarathon[] = [
  {
    id: 'tokyo',
    name: 'Tokyo Marathon',
    city: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    raceDate2026: '2026-03-01',
    raceDate2027: '2027-03-07',
    entryMethod: 'both',
    lotteryWindow: 'Mid-August (2 weeks)',
    lotteryOpens: '2026-08-15',
    lotteryCloses: '2026-08-31',
    lotteryOdds: '~10%',
    qualifyingTimes: {
      male:   { '18-34':'2:28', '35-39':'2:28', '40-44':'2:28', '45-49':'2:28', '50-54':'2:28', '55-59':'2:28', '60-64':'2:28', '65-69':'2:28', '70-74':'2:28', '75+':'2:28' },
      female: { '18-34':'2:54', '35-39':'2:54', '40-44':'2:54', '45-49':'2:54', '50-54':'2:54', '55-59':'2:54', '60-64':'2:54', '65-69':'2:54', '70-74':'2:54', '75+':'2:54' },
    },
    qualifyingNotes: 'Semi-elite only — just 25 overseas spots per gender. Selected fastest-first. Best route for most runners is charity or tour operator.',
    entryUrl: 'https://www.marathon.tokyo/en/',
    guaranteed: false,
    color: '#e8002d',
  },
  {
    id: 'boston',
    name: 'Boston Marathon',
    city: 'Boston',
    country: 'USA',
    flag: '🇺🇸',
    raceDate2026: '2026-04-20',
    raceDate2027: '2027-04-19',
    entryMethod: 'qualifier-only',
    lotteryWindow: 'Registration week: early September',
    lotteryOpens: '2026-09-08',
    lotteryCloses: '2026-09-12',
    lotteryOdds: 'Qualifier-only (no lottery)',
    qualifyingTimes: {
      male:   { '18-34':'2:55', '35-39':'3:00', '40-44':'3:05', '45-49':'3:15', '50-54':'3:20', '55-59':'3:30', '60-64':'3:50', '65-69':'4:05', '70-74':'4:20', '75+':'4:35' },
      female: { '18-34':'3:25', '35-39':'3:30', '40-44':'3:35', '45-49':'3:45', '50-54':'3:50', '55-59':'4:00', '60-64':'4:20', '65-69':'4:35', '70-74':'4:50', '75+':'5:05' },
    },
    qualifyingNotes: 'Meeting the BQ standard does not guarantee entry — runners must be faster than the cutoff time (4:34 faster required for 2026). Based on age on race day.',
    entryUrl: 'https://www.baa.org/races/boston-marathon/qualify',
    guaranteed: false,
    color: '#0075bf',
  },
  {
    id: 'london',
    name: 'London Marathon',
    city: 'London',
    country: 'UK',
    flag: '🇬🇧',
    raceDate2026: '2026-04-26',
    raceDate2027: '2027-04-25',
    entryMethod: 'both',
    lotteryWindow: 'Late April–early May (day after race)',
    lotteryOpens: '2026-04-27',
    lotteryCloses: '2026-05-04',
    lotteryOdds: '<5%',
    qualifyingTimes: {
      male:   { '18-34':'2:52', '35-39':'2:52', '40-44':'2:57', '45-49':'3:02', '50-54':'3:07', '55-59':'3:12', '60-64':'3:34', '65-69':'3:52', '70-74':'4:52', '75+':'5:07' },
      female: { '18-34':'3:38', '35-39':'3:38', '40-44':'3:43', '45-49':'3:46', '50-54':'3:53', '55-59':'3:58', '60-64':'4:23', '65-69':'4:53', '70-74':'5:35', '75+':'6:10' },
    },
    qualifyingNotes: 'Good For Age — UK residents only. Fastest-first basis, 3,000 places per gender. Based on age when you ran the time.',
    entryUrl: 'https://www.tcslondonmarathon.com/enter',
    guaranteed: false,
    color: '#0099cc',
  },
  {
    id: 'sydney',
    name: 'Sydney Marathon',
    city: 'Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    raceDate2026: '2026-08-30',
    raceDate2027: '2027-08-29',
    entryMethod: 'both',
    lotteryWindow: 'September (opens ~6 weeks after race)',
    lotteryOpens: '2026-09-10',
    lotteryCloses: '2026-10-15',
    lotteryOdds: '~33%',
    qualifyingTimes: {
      male:   { '18-34':'2:53', '35-39':'2:55', '40-44':'2:58', '45-49':'3:05', '50-54':'3:14', '55-59':'3:23', '60-64':'3:34', '65-69':'3:45', '70-74':'4:10', '75+':'4:30' },
      female: { '18-34':'3:13', '35-39':'3:15', '40-44':'3:26', '45-49':'3:38', '50-54':'3:51', '55-59':'4:10', '60-64':'4:27', '65-69':'4:50', '70-74':'5:30', '75+':'6:00' },
    },
    qualifyingNotes: 'Fastest-first within age/gender. Must be achieved on an AIMS-certified course. Unsuccessful qualifiers move into the main ballot. Most forgiving ballot odds of all Majors.',
    entryUrl: 'https://www.tcssydneymarathon.com/',
    guaranteed: false,
    color: '#008000',
  },
  {
    id: 'berlin',
    name: 'Berlin Marathon',
    city: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    raceDate2026: '2026-09-27',
    raceDate2027: '2027-09-26',
    entryMethod: 'both',
    lotteryWindow: 'Early October–mid November',
    lotteryOpens: '2026-10-01',
    lotteryCloses: '2026-11-15',
    lotteryOdds: '~20%',
    qualifyingTimes: {
      male:   { '18-34':'2:45', '35-39':'2:45', '40-44':'2:45', '45-49':'2:55', '50-54':'2:55', '55-59':'2:55', '60-64':'3:25', '65-69':'3:25', '70-74':'3:25', '75+':'3:25' },
      female: { '18-34':'3:10', '35-39':'3:10', '40-44':'3:10', '45-49':'3:30', '50-54':'3:30', '55-59':'3:30', '60-64':'4:20', '65-69':'4:20', '70-74':'4:20', '75+':'4:20' },
    },
    qualifyingNotes: 'Fastest course in the world — world records set here regularly. GUARANTEED entry if you meet the qualifying standard. No need to wait for a ballot result.',
    entryUrl: 'https://www.bmw-berlin-marathon.com/en/',
    guaranteed: true,
    color: '#1a3a6b',
  },
  {
    id: 'chicago',
    name: 'Chicago Marathon',
    city: 'Chicago',
    country: 'USA',
    flag: '🇺🇸',
    raceDate2026: '2026-10-11',
    raceDate2027: '2027-10-10',
    entryMethod: 'both',
    lotteryWindow: 'Late October (opens ~2 weeks after race)',
    lotteryOpens: '2026-10-25',
    lotteryCloses: '2026-11-30',
    lotteryOdds: '~25%',
    qualifyingTimes: {
      male:   { '18-34':'2:50', '35-39':'2:55', '40-44':'3:00', '45-49':'3:10', '50-54':'3:15', '55-59':'3:25', '60-64':'3:40', '65-69':'3:55', '70-74':'4:15', '75+':'4:30' },
      female: { '18-34':'3:20', '35-39':'3:25', '40-44':'3:30', '45-49':'3:40', '50-54':'3:50', '55-59':'3:55', '60-64':'4:15', '65-69':'4:25', '70-74':'4:45', '75+':'5:00' },
    },
    qualifyingNotes: 'GUARANTEED entry with qualifying time. Flat, fast course ideal for PRs. Time qualifiers from age 16+. Entry fee $250 USD.',
    entryUrl: 'https://www.chicagomarathon.com/runners/registration/',
    guaranteed: true,
    color: '#003087',
  },
  {
    id: 'nyc',
    name: 'New York City Marathon',
    city: 'New York',
    country: 'USA',
    flag: '🇺🇸',
    raceDate2026: '2026-11-01',
    raceDate2027: '2027-11-07',
    entryMethod: 'both',
    lotteryWindow: 'February',
    lotteryOpens: '2027-02-01',
    lotteryCloses: '2027-02-28',
    lotteryOdds: '~4%',
    qualifyingTimes: {
      male:   { '18-34':'2:53', '35-39':'2:55', '40-44':'2:58', '45-49':'3:05', '50-54':'3:15', '55-59':'3:23', '60-64':'3:34', '65-69':'3:45', '70-74':'4:10', '75+':'4:30' },
      female: { '18-34':'3:13', '35-39':'3:15', '40-44':'3:26', '45-49':'3:38', '50-54':'3:51', '55-59':'4:10', '60-64':'4:27', '65-69':'4:50', '70-74':'5:30', '75+':'6:00' },
    },
    qualifyingNotes: 'Fastest-first in each age/gender bracket. NYRR 9+1 program (run 9 NYRR races + volunteer once) guarantees entry. Hardest ballot odds after London.',
    entryUrl: 'https://www.nyrr.org/tcsnycmarathon',
    guaranteed: false,
    color: '#ff6200',
  },
]

// Returns the qualifying time for a given major, gender, and age
export function getMajorQualifyingTime(major: MajorMarathon, gender: 'male' | 'female', age: number): string | null {
  if (!major.qualifyingTimes) return null
  const times = gender === 'male' ? major.qualifyingTimes.male : major.qualifyingTimes.female
  if (age < 35) return times['18-34']
  if (age < 40) return times['35-39']
  if (age < 45) return times['40-44']
  if (age < 50) return times['45-49']
  if (age < 55) return times['50-54']
  if (age < 60) return times['55-59']
  if (age < 65) return times['60-64']
  if (age < 70) return times['65-69']
  if (age < 75) return times['70-74']
  return times['75+']
}

// Given a finish time string (H:MM:SS or MM:SS) and a qualifying time string,
// returns whether the runner has achieved the qualifying standard
export function hasQualified(finishTime: string, qualTime: string): boolean {
  const toSecs = (t: string) => {
    const parts = t.split(':').map(Number)
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]
    return parts[0]*60 + parts[1]
  }
  return toSecs(finishTime) <= toSecs(qualTime)
}

// Format a qualifying time for display — "2:55:00" → "2:55:00", "2:55" → "2:55:00"
export function formatQualTime(t: string): string {
  if (t.split(':').length === 2) return `${t}:00`
  return t
}
