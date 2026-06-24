'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MAJORS, getMajorQualifyingTime, hasQualified, formatQualTime, type MajorMarathon } from '@/lib/majors'
import styles from './MajorsClient.module.css'

interface ProfileLite { id: string; birth_year: number | null; gender: 'male' | 'female' | null; lottery_entries: Record<string, boolean> | null }
interface RaceLite { finish_time: string | null; race_type: string | null; race_name: string | null; date: string }
interface UpcomingRace { name: string; date: string }
interface Props { profile: ProfileLite | null; races: RaceLite[]; upcomingRaces: UpcomingRace[] }

// Each major has a stone color for the gauntlet
const STONE_COLORS: Record<string, { gem: string; glow: string; label: string }> = {
  tokyo:    { gem: '#9b5fe0', glow: 'rgba(155,95,224,0.7)',  label: 'Soul'    },
  boston:   { gem: '#f5a623', glow: 'rgba(245,166,35,0.7)',  label: 'Reality' },
  london:   { gem: '#47c8ff', glow: 'rgba(71,200,255,0.7)',  label: 'Space'   },
  sydney:   { gem: '#39ff6a', glow: 'rgba(57,255,106,0.7)',  label: 'Time'    },
  berlin:   { gem: '#ff4747', glow: 'rgba(255,71,71,0.7)',   label: 'Power'   },
  chicago:  { gem: '#ffd700', glow: 'rgba(255,215,0,0.7)',   label: 'Mind'    },
  nyc:      { gem: '#ff6b35', glow: 'rgba(255,107,53,0.7)',  label: 'Mind'    },
  capetown: { gem: '#ffb612', glow: 'rgba(255,182,18,0.7)',  label: 'Origin'  },
}

function nameMatchesMajor(raceName: string | null, majorId: string): boolean {
  if (!raceName) return false
  const lower = raceName.toLowerCase()
  const matchers: Record<string, string[]> = {
    tokyo:    ['tokyo'],
    boston:   ['boston'],
    london:   ['london'],
    sydney:   ['sydney'],
    berlin:   ['berlin'],
    chicago:  ['chicago'],
    nyc:      ['new york', 'nyc', 'new york city'],
    capetown: ['cape town', 'capetown'],
  }
  return (matchers[majorId] ?? []).some(k => lower.includes(k))
}

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

export default function MajorsClient({ profile, races, upcomingRaces }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'qualifying'>('overview')
  const [enteredLottery, setEnteredLottery] = useState<Record<string, boolean>>(profile?.lottery_entries ?? {})

  async function toggleLottery(id: string) {
    const next = { ...enteredLottery, [id]: !enteredLottery[id] }
    setEnteredLottery(next) // optimistic update
    if (profile?.id) {
      const { error } = await supabase.from('profiles').update({ lottery_entries: next }).eq('id', profile.id)
      if (error) {
        // revert on failure so the UI doesn't silently drift from saved state
        setEnteredLottery(enteredLottery)
      }
    }
  }

  const age = profile?.birth_year ? TODAY.getFullYear() - profile.birth_year : null
  const gender = profile?.gender ?? null

  // Find the user's best marathon time
  const marathonPRTime = races
    .filter(r => r.race_type === 'marathon' && r.finish_time)
    .sort((a, b) => {
      const toSecs = (t: string) => { const p = t.split(':').map(Number); return p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+p[1] }
      return toSecs(a.finish_time!) - toSecs(b.finish_time!)
    })[0]?.finish_time ?? null

  // Which majors has the user completed?
  const completedIds = new Set(
    MAJORS
      .filter(m => races.some(r => r.race_type === 'marathon' && nameMatchesMajor(r.race_name, m.id)))
      .map(m => m.id)
  )

  // Which majors does the user have planned (in upcoming_races)?
  const plannedIds = new Set(
    MAJORS
      .filter(m => upcomingRaces.some(r => nameMatchesMajor(r.name, m.id)))
      .map(m => m.id)
  )

  const stonesEarned = completedIds.size
  const upcoming = MAJORS.filter(m => daysUntil(m.raceDate2026) > 0).sort((a,b) => daysUntil(a.raceDate2026) - daysUntil(b.raceDate2026))
  const past     = MAJORS.filter(m => daysUntil(m.raceDate2026) <= 0).sort((a,b) => daysUntil(b.raceDate2026) - daysUntil(a.raceDate2026))

  // Next lottery to open
  const nextLottery = [...MAJORS]
    .filter(m => m.lotteryOpens && new Date(m.lotteryOpens) > TODAY)
    .sort((a, b) => new Date(a.lotteryOpens!).getTime() - new Date(b.lotteryOpens!).getTime())[0] ?? null

  return (
    <div className={styles.wrap}>

      {/* INFINITY GAUNTLET */}
      <div className={styles.gauntlet}>
        <div className={styles.gauntletLeft}>
          <div className={styles.gauntletTitle}>MAJOR MARATHON GAUNTLET</div>
          <div className={styles.gauntletSub}>
            {stonesEarned === 0 && 'Complete a World Major to earn your first stone.'}
            {stonesEarned > 0 && stonesEarned < 8 && `${stonesEarned} of 8 Majors completed`}
            {stonesEarned === 8 && '⚡ ALL 8 MAJORS COMPLETED — INFINITY ACHIEVED'}
          </div>
          <div className={styles.gauntletStones}>
            {(() => {
              const completed = MAJORS.filter(m => completedIds.has(m.id))
              const planned   = MAJORS.filter(m => !completedIds.has(m.id) && plannedIds.has(m.id))
              const remaining = MAJORS.filter(m => !completedIds.has(m.id) && !plannedIds.has(m.id))
                .sort((a, b) => a.city.localeCompare(b.city))
              return [...completed, ...planned, ...remaining].map(major => {
                const stone = STONE_COLORS[major.id]
                const isCompleted = completedIds.has(major.id)
                const isPlanned   = plannedIds.has(major.id)
                return (
                  <div key={major.id} className={styles.stoneSlot} title={`${major.flag} ${major.name}${isCompleted?' — Completed':isPlanned?' — Planned':''}`}>
                    <div
                      className={`${styles.stone} ${isCompleted ? styles.stoneEarned : isPlanned ? styles.stonePlanned : styles.stoneEmpty}`}
                      style={isCompleted ? {
                        background: `radial-gradient(circle at 35% 35%, #fff 0%, ${stone.gem} 40%, #000 100%)`,
                        boxShadow: `0 0 18px ${stone.glow}, 0 0 40px ${stone.glow}`,
                      } : isPlanned ? {
                        background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, ${stone.gem}cc 40%, ${stone.gem}44 100%)`,
                        boxShadow: `0 0 16px ${stone.glow}99, 0 0 32px ${stone.glow}44`,
                        outline: `2px dashed ${stone.gem}cc`,
                        outlineOffset: '4px',
                      } : {}}
                    />
                    <div className={`${styles.stoneLabel} ${isCompleted?styles.stoneLabelEarned:isPlanned?styles.stoneLabelPlanned:''}`}>
                      {major.flag}
                    </div>
                    <div className={styles.stoneCity}>{major.city}</div>
                    {isPlanned && !isCompleted && <div className={styles.stonePendingBadge}>Planned</div>}
                    {isCompleted && <div className={styles.stoneCompleteBadge}>✓</div>}
                  </div>
                )
              })
            })()}
          </div>
          <div className={styles.gauntletLegend}>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'var(--accent)',boxShadow:'0 0 8px var(--accent)'}}/>Completed</div>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'rgba(255,255,255,0.25)',border:'1.5px dashed rgba(255,255,255,0.7)'}}/>Planned</div>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'var(--surface2)',border:'1px solid var(--border)'}}/>Not yet</div>
          </div>
        </div>
        <div className={styles.gauntletFist}>
          <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.gauntletSvg}>
            {/* Gauntlet arm/wrist */}
            <rect x="60" y="200" width="80" height="60" rx="8" fill="#b8860b" stroke="#ffd700" strokeWidth="1.5"/>
            <rect x="65" y="205" width="70" height="50" rx="6" fill="#daa520"/>
            {/* Palm */}
            <rect x="50" y="140" width="100" height="70" rx="10" fill="#b8860b" stroke="#ffd700" strokeWidth="1.5"/>
            <rect x="56" y="146" width="88" height="58" rx="7" fill="#daa520"/>
            {/* Thumb */}
            <rect x="20" y="155" width="38" height="28" rx="10" fill="#b8860b" stroke="#ffd700" strokeWidth="1.5"/>
            <rect x="25" y="160" width="28" height="18" rx="7" fill="#daa520"/>
            {/* Fingers */}
            {[0,1,2,3].map(i => (
              <g key={i}>
                <rect x={52 + i*26} y={75 + (i===0||i===3?15:0)} width="22" height="72" rx="10" fill="#b8860b" stroke="#ffd700" strokeWidth="1.5"/>
                <rect x={57 + i*26} y={80 + (i===0||i===3?15:0)} width="12" height="62" rx="7" fill="#daa520"/>
              </g>
            ))}
            {/* Knuckle stones — 4 across the knuckles */}
            {['boston','london','sydney','berlin'].map((id, i) => {
              const major = MAJORS.find(m => m.id === id)!
              const stone = STONE_COLORS[major.id]
              const done  = completedIds.has(major.id)
              const plan  = plannedIds.has(major.id)
              return (
                <g key={i}>
                  <ellipse cx={63 + i*26} cy={148} rx="9" ry="7"
                    fill={done ? stone.gem : plan ? stone.gem+'aa' : '#3a3000'}
                    stroke={done ? '#fff' : plan ? stone.gem : '#5a4a0a'}
                    strokeWidth={plan ? '1.5' : '1'}
                    strokeDasharray={plan ? '2 1' : undefined}
                  />
                  {done && <ellipse cx={61 + i*26} cy={146} rx="4" ry="3" fill="rgba(255,255,255,0.5)"/>}
                </g>
              )
            })}
            {/* Back of hand center stone — Chicago */}
            {(() => {
              const major = MAJORS.find(m => m.id === 'chicago')!
              const stone = STONE_COLORS[major.id]
              const done  = completedIds.has(major.id)
              const plan  = plannedIds.has(major.id)
              return (
                <g>
                  <ellipse cx="100" cy="172" rx="16" ry="12"
                    fill={done ? stone.gem : plan ? stone.gem+'aa' : '#3a3000'}
                    stroke={done ? '#fff' : plan ? stone.gem : '#5a4a0a'}
                    strokeWidth={plan ? '2' : '1.5'}
                    strokeDasharray={plan ? '3 1.5' : undefined}
                  />
                  {done && <ellipse cx="95" cy="168" rx="7" ry="5" fill="rgba(255,255,255,0.5)"/>}
                </g>
              )
            })()}
            {/* Wrist stones — tokyo, nyc, capetown — spread across wrist band x=70–130 */}
            {['tokyo','nyc','capetown'].map((id, i) => {
              const major = MAJORS.find(m => m.id === id)!
              const stone = STONE_COLORS[major.id]
              const done  = completedIds.has(major.id)
              const plan  = plannedIds.has(major.id)
              const cx = 72 + i * 28  // 72, 100, 128 — evenly spaced within wrist band
              return (
                <g key={i}>
                  <ellipse cx={cx} cy={218} rx="10" ry="7"
                    fill={done ? stone.gem : plan ? stone.gem+'aa' : '#3a3000'}
                    stroke={done ? '#fff' : plan ? stone.gem : '#5a4a0a'}
                    strokeWidth={plan ? '1.5' : '1.2'}
                    strokeDasharray={plan ? '2 1' : undefined}
                  />
                  {done && <ellipse cx={cx - 2} cy={216} rx="4" ry="3" fill="rgba(255,255,255,0.5)"/>}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className={styles.titleRow}>
        <div className={styles.title}>WORLD<br/>MARATHON<br/>MAJORS</div>
        <div className={styles.titleMeta}>
          <div className={styles.starCount}>⭐ 8 Majors · 2026 Season</div>
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
                {upcoming.map(major => <MajorCard key={major.id} major={major} age={age} gender={gender} marathonPR={marathonPRTime} upcoming={true} entered={enteredLottery[major.id]||false} onToggle={()=>toggleLottery(major.id)}/>)}
              </div>
            </div>
          )}

          {/* PAST */}
          {past.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Planning for 2027 — 2026 races completed</div>
              <div className={styles.majorGrid}>
                {past.map(major => <MajorCard key={major.id} major={major} age={age} gender={gender} marathonPR={marathonPRTime} upcoming={false} entered={enteredLottery[major.id]||false} onToggle={()=>toggleLottery(major.id)}/>)}
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

function MajorCard({ major, age, gender, marathonPR, upcoming, entered, onToggle }: { major: MajorMarathon; age: number|null; gender: 'male'|'female'|null; marathonPR: string|null; upcoming: boolean; entered: boolean; onToggle: ()=>void }) {
  const days = daysUntil(major.raceDate2026)
  const qualTime = age && gender ? getMajorQualifyingTime(major, gender, age) : null
  const qualified = marathonPR && qualTime ? hasQualified(marathonPR, qualTime) : false

  const lotteryDays = major.lotteryOpens ? daysUntil(major.lotteryOpens) : null
  const lotteryOpen = lotteryDays !== null && lotteryDays > 0 && lotteryDays < 120
  const lotteryIsOpen = major.lotteryOpens && major.lotteryCloses
    ? new Date() >= new Date(major.lotteryOpens) && new Date() <= new Date(major.lotteryCloses)
    : false
  const resultDays = major.lotteryResultsDate ? daysUntil(major.lotteryResultsDate) : null
  const awaitingResults = entered && resultDays !== null && resultDays > 0

  return (
    <div className={styles.majorCard}>
      <div className={styles.majorCardAccent} style={{background: major.color}}/>
      <div className={styles.majorCardHeader}>
        <div className={styles.majorFlag}>{major.flag}</div>
        <div className={styles.majorCardInfo}>
          <div className={styles.majorName}>{major.name}</div>
          <div className={styles.majorCity}>{major.city}, {major.country}</div>
        </div>
        {qualified && <div className={styles.majorQualBadge}>✓ BQ</div>}
      </div>

      {upcoming ? (
        /* ── UPCOMING: show 2026 race date prominently ── */
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
      ) : (
        /* ── PAST: 2026 already ran — focus on 2027 ── */
        <>
          <div className={styles.pastRaceBanner}>
            <span className={styles.pastRaceCheck}>✓</span> 2026 race completed — planning ahead for 2027
          </div>
          <div className={styles.majorDateRow}>
            <div className={styles.majorDate}>
              <div className={styles.majorDateLabel}>Next Race — 2027</div>
              <div className={styles.majorDateVal}>{formatDate(major.raceDate2027)}</div>
              <div className={styles.majorDays}>
                in {daysUntil(major.raceDate2027)} days
              </div>
            </div>
          </div>
        </>
      )}

      <div className={styles.majorDivider}/>

      <div className={styles.majorEntryRow}>
        <div className={styles.majorEntryBlock}>
          <div className={styles.majorEntryLabel}>{upcoming ? 'Lottery' : '2027 Lottery'}</div>
          <div className={styles.majorEntryVal}>{major.lotteryWindow}</div>
          {lotteryOpen && (
            <div className={styles.majorLotteryAlert}>🎟 Opens in {lotteryDays} days</div>
          )}
          {lotteryIsOpen && (
            <div className={styles.majorLotteryAlert}>🎟 Lottery is open now!</div>
          )}
          {major.lotteryOpens && !lotteryOpen && !lotteryIsOpen && lotteryDays && lotteryDays > 0 && (
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

      <div className={styles.majorDivider}/>

      {/* LOTTERY ENTRY TRACKER */}
      {major.entryMethod !== 'qualifier-only' && (
        <div className={styles.lotteryTracker}>
          <label className={styles.lotteryCheckRow} onClick={onToggle}>
            <div className={`${styles.lotteryCheckBox} ${entered ? styles.lotteryCheckBoxOn : ''}`}>✓</div>
            <div className={styles.lotteryCheckLabel}>I entered the lottery</div>
          </label>
          {entered && (
            <div className={styles.lotteryResultAlert}>
              {awaitingResults ? (
                <>
                  <div className={styles.lotteryResultIcon}>⏳</div>
                  <div>
                    <div className={styles.lotteryResultTitle}>Results expected {major.lotteryResultsDesc}</div>
                    <div className={styles.lotteryResultSub}>in {resultDays} days · fingers crossed 🤞</div>
                  </div>
                </>
              ) : resultDays !== null && resultDays <= 0 ? (
                <>
                  <div className={styles.lotteryResultIcon}>📬</div>
                  <div>
                    <div className={styles.lotteryResultTitle}>Results should be out!</div>
                    <div className={styles.lotteryResultSub}>Check your email from {major.name}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.lotteryResultIcon}>📅</div>
                  <div>
                    <div className={styles.lotteryResultTitle}>Results: {major.lotteryResultsDesc}</div>
                  </div>
                </>
              )}
            </div>
          )}
          {lotteryIsOpen && !entered && (
            <div className={styles.lotteryOpenAlert}>🎟 Lottery is open now!</div>
          )}
        </div>
      )}

      <a href={major.entryUrl} target="_blank" rel="noopener noreferrer" className={styles.majorLink}>
        Official Entry Site ↗
      </a>

      {/* ALTERNATIVE ENTRY METHODS */}
      {major.alternativeEntries.length > 0 && (
        <div className={styles.altEntriesSection}>
          <div className={styles.altEntriesTitle}>Other Ways In</div>
          <div className={styles.altEntriesList}>
            {major.alternativeEntries.map((alt, i) => (
              <div key={i} className={styles.altEntry}>
                <div className={styles.altEntryHeader}>
                  <div className={styles.altEntryName}>{alt.name}</div>
                  {alt.guaranteed && <div className={styles.altEntryGuaranteed}>⚡ Guaranteed</div>}
                </div>
                <div className={styles.altEntryDesc}>{alt.description}</div>
                <a href={alt.learnMoreUrl} target="_blank" rel="noopener noreferrer" className={styles.altEntryLink}>Learn more ↗</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARITY INFO */}
      {major.charity && (
        <div className={styles.charitySection}>
          <div className={styles.charityTitle}>🎗 Run for Charity</div>
          <div className={styles.charityStats}>
            {major.charity.spotsApprox && (
              <div className={styles.charityStat}>
                <div className={styles.charityStatVal}>~{major.charity.spotsApprox.toLocaleString()}</div>
                <div className={styles.charityStatLabel}>charity spots</div>
              </div>
            )}
            {major.charity.numPartners && (
              <div className={styles.charityStat}>
                <div className={styles.charityStatVal}>{major.charity.numPartners}</div>
                <div className={styles.charityStatLabel}>partner orgs</div>
              </div>
            )}
            {major.charity.minFundraisingUSD && (
              <div className={styles.charityStat}>
                <div className={styles.charityStatVal}>${major.charity.minFundraisingUSD.toLocaleString()}</div>
                <div className={styles.charityStatLabel}>min. fundraising (USD)</div>
              </div>
            )}
          </div>
          <div className={styles.charityNote}>{major.charity.fundraisingNote}</div>
          <div className={styles.charityNote} style={{marginTop:6}}>{major.charity.applicationNote}</div>
          <a href={major.charity.learnMoreUrl} target="_blank" rel="noopener noreferrer" className={styles.altEntryLink}>Charity programme ↗</a>
        </div>
      )}
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
