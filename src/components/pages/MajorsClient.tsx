'use client'
import { useState } from 'react'
import { MAJORS, getMajorQualifyingTime, hasQualified, formatQualTime, type MajorMarathon } from '@/lib/majors'
import styles from './MajorsClient.module.css'

interface ProfileLite { birth_year: number | null; gender: 'male' | 'female' | null }
interface RaceLite { finish_time: string | null; race_type: string | null; race_name: string | null; date: string }
interface Props { profile: ProfileLite | null; races: RaceLite[] }

const TODAY = new Date()

function daysUntil(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((d.getTime() - TODAY.getTime()) / 86400000)
  return diff
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MajorsClient({ profile, races }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'qualifying'>('overview')

  const age = profile?.birth_year ? TODAY.getFullYear() - profile.birth_year : null
  const gender = profile?.gender ?? null

  // Find the user's best marathon time
  const marathonPRTime = races
    .filter(r => r.race_type === 'marathon' && r.finish_time)
    .sort((a, b) => {
      const toSecs = (t: string) => { const p = t.split(':').map(Number); return p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+p[1] }
      return toSecs(a.finish_time!) - toSecs(b.finish_time!)
    })[0]?.finish_time ?? null

  const upcoming = MAJORS.filter(m => daysUntil(m.raceDate2026) > 0).sort((a,b) => daysUntil(a.raceDate2026) - daysUntil(b.raceDate2026))
  const past     = MAJORS.filter(m => daysUntil(m.raceDate2026) <= 0).sort((a,b) => daysUntil(b.raceDate2026) - daysUntil(a.raceDate2026))

  // Next lottery to open
  const nextLottery = [...MAJORS]
    .filter(m => m.lotteryOpens && new Date(m.lotteryOpens) > TODAY)
    .sort((a, b) => new Date(a.lotteryOpens!).getTime() - new Date(b.lotteryOpens!).getTime())[0] ?? null

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <div className={styles.title}>WORLD<br/>MARATHON<br/>MAJORS</div>
        <div className={styles.titleMeta}>
          <div className={styles.starCount}>⭐ 7 Majors · 2026 Season</div>
          {nextLottery && (
            <div className={styles.nextLotteryAlert}>
              <div className={styles.nextLotteryLabel}>Next Lottery Opens</div>
              <div className={styles.nextLotteryName}>{nextLottery.flag} {nextLottery.name}</div>
              <div className={styles.nextLotteryDate}>{formatDate(nextLottery.lotteryOpens!)}</div>
              <div className={styles.nextLotteryCountdown}>in {daysUntil(nextLottery.lotteryOpens!)} days</div>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab==='overview'?styles.tabActive:''}`} onClick={()=>setActiveTab('overview')}>📅 Race Calendar</button>
        <button className={`${styles.tab} ${activeTab==='qualifying'?styles.tabActive:''}`} onClick={()=>setActiveTab('qualifying')}>🎯 Qualifying Times</button>
      </div>

      {activeTab === 'overview' && (
        <div>
          {/* UPCOMING */}
          {upcoming.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Upcoming in 2026</div>
              <div className={styles.majorGrid}>
                {upcoming.map(major => <MajorCard key={major.id} major={major} age={age} gender={gender} marathonPR={marathonPRTime} upcoming={true}/>)}
              </div>
            </div>
          )}

          {/* PAST */}
          {past.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Already Run in 2026</div>
              <div className={styles.majorGrid}>
                {past.map(major => <MajorCard key={major.id} major={major} age={age} gender={gender} marathonPR={marathonPRTime} upcoming={false}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'qualifying' && (
        <div className={styles.section}>
          {!profile?.birth_year || !profile?.gender ? (
            <div className={styles.noProfile}>
              Add your birth year and gender in <strong>⚙ Profile</strong> (top nav) to see your personal qualifying times for each major.
            </div>
          ) : (
            <>
              <div className={styles.qualHeader}>
                <div className={styles.qualTitle}>Your qualifying times</div>
                <div className={styles.qualMeta}>
                  {gender === 'male' ? 'Male' : 'Female'} · Age {age} · Age group {getAgeGroupLabel(age!)}
                  {marathonPRTime && <> · PR: <span style={{color:'var(--accent)'}}>{marathonPRTime}</span></>}
                </div>
              </div>
              <div className={styles.qualGrid}>
                {MAJORS.map(major => {
                  const qualTime = getMajorQualifyingTime(major, gender!, age!)
                  const qualified = marathonPRTime && qualTime ? hasQualified(marathonPRTime, qualTime) : false
                  const gapSecs = marathonPRTime && qualTime ? getGapSeconds(marathonPRTime, qualTime) : null
                  return (
                    <div key={major.id} className={`${styles.qualCard} ${qualified ? styles.qualCardAchieved : ''}`} style={{borderColor: qualified ? 'var(--accent)' : undefined}}>
                      <div className={styles.qualCardAccent} style={{background: major.color}}/>
                      <div className={styles.qualCardHeader}>
                        <div className={styles.qualCardFlag}>{major.flag}</div>
                        <div>
                          <div className={styles.qualCardName}>{major.name}</div>
                          <div className={styles.qualCardCity}>{major.city} · {formatDateShort(major.raceDate2026)}</div>
                        </div>
                        {qualified && <div className={styles.qualBadge}>✓ QUALIFIED</div>}
                      </div>
                      {qualTime ? (
                        <>
                          <div className={styles.qualTime}>{formatQualTime(qualTime)}</div>
                          <div className={styles.qualTimeLabel}>qualifying standard</div>
                          {gapSecs !== null && (
                            <div className={gapSecs <= 0 ? styles.qualGapAchieved : styles.qualGapNeeded}>
                              {gapSecs <= 0
                                ? `${formatGap(Math.abs(gapSecs))} under standard`
                                : `Need ${formatGap(gapSecs)} faster`
                              }
                            </div>
                          )}
                          {major.guaranteed && <div className={styles.qualGuaranteed}>⚡ Guaranteed entry</div>}
                          {!major.guaranteed && <div className={styles.qualNotGuaranteed}>Fastest-first selection</div>}
                        </>
                      ) : (
                        <div className={styles.qualNA}>No age-group standard — lottery/charity entry</div>
                      )}
                      <div className={styles.qualNotes}>{major.qualifyingNotes}</div>
                      <a href={major.entryUrl} target="_blank" rel="noopener noreferrer" className={styles.qualLink}>Apply ↗</a>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MajorCard({ major, age, gender, marathonPR, upcoming }: { major: MajorMarathon; age: number|null; gender: 'male'|'female'|null; marathonPR: string|null; upcoming: boolean }) {
  const days = daysUntil(major.raceDate2026)
  const qualTime = age && gender ? getMajorQualifyingTime(major, gender, age) : null
  const qualified = marathonPR && qualTime ? hasQualified(marathonPR, qualTime) : false

  // Next relevant action (lottery open or race day)
  const lotteryDays = major.lotteryOpens ? daysUntil(major.lotteryOpens) : null
  const lotteryOpen = lotteryDays !== null && lotteryDays > 0 && lotteryDays < 120

  return (
    <div className={`${styles.majorCard} ${!upcoming ? styles.majorCardPast : ''}`}>
      <div className={styles.majorCardAccent} style={{background: major.color}}/>
      <div className={styles.majorCardHeader}>
        <div className={styles.majorFlag}>{major.flag}</div>
        <div className={styles.majorCardInfo}>
          <div className={styles.majorName}>{major.name}</div>
          <div className={styles.majorCity}>{major.city}, {major.country}</div>
        </div>
        {qualified && <div className={styles.majorQualBadge}>✓ BQ</div>}
      </div>

      <div className={styles.majorDateRow}>
        <div className={styles.majorDate}>
          <div className={styles.majorDateLabel}>2026 Race</div>
          <div className={styles.majorDateVal}>{formatDate(major.raceDate2026)}</div>
          <div className={`${styles.majorDays} ${days <= 14 ? styles.majorDaysUrgent : days <= 60 ? styles.majorDaysSoon : ''}`}>
            {days > 0 ? `${days} days away` : days === 0 ? 'TODAY' : 'Completed'}
          </div>
        </div>
        <div className={styles.majorDate}>
          <div className={styles.majorDateLabel}>2027 Race (est.)</div>
          <div className={styles.majorDateVal}>{formatDate(major.raceDate2027)}</div>
        </div>
      </div>

      <div className={styles.majorDivider}/>

      <div className={styles.majorEntryRow}>
        <div className={styles.majorEntryBlock}>
          <div className={styles.majorEntryLabel}>Lottery</div>
          <div className={styles.majorEntryVal}>{major.lotteryWindow}</div>
          {lotteryOpen && (
            <div className={styles.majorLotteryAlert}>🎟 Opens in {lotteryDays} days</div>
          )}
          {major.lotteryOpens && !lotteryOpen && lotteryDays && lotteryDays > 0 && (
            <div className={styles.majorLotteryDate}>{formatDateShort(major.lotteryOpens)}</div>
          )}
          <div className={styles.majorOdds}>Odds: {major.lotteryOdds}</div>
        </div>
        <div className={styles.majorEntryBlock}>
          <div className={styles.majorEntryLabel}>Qualify to Enter</div>
          {qualTime ? (
            <>
              <div className={styles.majorQualTime}>{formatQualTime(qualTime)}</div>
              <div className={styles.majorQualSub}>{gender === 'male' ? 'Male' : 'Female'} age {age}</div>
              {major.guaranteed && <div className={styles.majorGuaranteed}>⚡ Guaranteed</div>}
            </>
          ) : age && gender ? (
            <div className={styles.majorQualNA}>No standard for your age group</div>
          ) : (
            <div className={styles.majorQualNA}>Add profile to see your time</div>
          )}
        </div>
      </div>

      <a href={major.entryUrl} target="_blank" rel="noopener noreferrer" className={styles.majorLink}>
        Official Entry Site ↗
      </a>
    </div>
  )
}

function getAgeGroupLabel(age: number) {
  if (age < 35) return '18-34'
  if (age < 40) return '35-39'
  if (age < 45) return '40-44'
  if (age < 50) return '45-49'
  if (age < 55) return '50-54'
  if (age < 60) return '55-59'
  if (age < 65) return '60-64'
  if (age < 70) return '65-69'
  if (age < 75) return '70-74'
  return '75+'
}

function timeToSeconds(t: string) {
  const parts = t.split(':').map(Number)
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]
  return parts[0]*60 + parts[1]
}

function getGapSeconds(finishTime: string, qualTime: string) {
  return timeToSeconds(finishTime) - timeToSeconds(formatQualTime(qualTime))
}

function formatGap(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return s > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${m}:00`
}
