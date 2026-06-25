'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { MajorMarathon, RaceSeries } from '@/lib/majors'
import styles from './MajorDetailClient.module.css'

type ProgressMap = Record<string, { signed_up: boolean; finished: boolean; finish_time: string | null }>

interface Props {
  major: MajorMarathon
  series: RaceSeries[]
  seriesProgress: ProgressMap
  userId: string | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export default function MajorDetailClient({ major, series, seriesProgress, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [progress, setProgress] = useState<ProgressMap>(seriesProgress)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingTime, setEditingTime] = useState<string | null>(null)
  const [timeInput, setTimeInput] = useState('')

  async function updateProgress(seriesId: string, raceId: string, field: 'signed_up' | 'finished', value: boolean) {
    if (!userId) return
    const key = `${seriesId}__${raceId}`
    const current = progress[key] ?? { signed_up: false, finished: false, finish_time: null }
    const next = { ...current, [field]: value }
    setProgress(p => ({ ...p, [key]: next }))
    setSaving(key)
    await supabase.from('race_series_progress').upsert({
      user_id: userId,
      series_id: seriesId,
      race_id: raceId,
      signed_up: next.signed_up,
      finished: next.finished,
      finish_time: next.finish_time,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,series_id,race_id' })
    setSaving(null)
  }

  async function saveFinishTime(seriesId: string, raceId: string) {
    if (!userId) return
    const key = `${seriesId}__${raceId}`
    const current = progress[key] ?? { signed_up: false, finished: false, finish_time: null }
    const next = { ...current, finish_time: timeInput.trim() || null, finished: true }
    setProgress(p => ({ ...p, [key]: next }))
    setSaving(key)
    await supabase.from('race_series_progress').upsert({
      user_id: userId,
      series_id: seriesId,
      race_id: raceId,
      signed_up: next.signed_up,
      finished: next.finished,
      finish_time: next.finish_time,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,series_id,race_id' })
    setSaving(null)
    setEditingTime(null)
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.back} onClick={() => router.push('/app/majors')}>
        ← Back to Majors
      </button>

      {/* HEADER */}
      <div className={styles.header} style={{ borderLeftColor: major.color }}>
        <div className={styles.flag}>{major.flag}</div>
        <div>
          <div className={styles.title}>{major.name}</div>
          <div className={styles.subtitle}>{major.city}, {major.country}</div>
        </div>
      </div>

      <div className={styles.tagline}>
        Beyond the lottery and qualifying times — every way to get to the start line.
      </div>

      {/* RACE SERIES TRACKER */}
      {series.map(s => {
        const completedCount = s.races.filter(r => progress[`${s.id}__${r.id}`]?.finished).length
        const totalRequired = s.races.filter(r => r.isSeriesQualifier).length
        const allDone = completedCount >= totalRequired
        return (
          <section key={s.id} className={styles.section}>
            <div className={styles.sectionTitle}>{s.name}</div>

            {/* PROGRESS BAR */}
            <div className={styles.seriesProgress}>
              <div className={styles.seriesProgressBar}>
                <div
                  className={styles.seriesProgressFill}
                  style={{ width: `${(completedCount / totalRequired) * 100}%` }}
                />
              </div>
              <div className={styles.seriesProgressLabel}>
                {allDone
                  ? `🏆 Series complete — ${s.reward}`
                  : `${completedCount} of ${totalRequired} races finished · ${totalRequired - completedCount} remaining to earn guaranteed entry`
                }
              </div>
            </div>

            <p className={styles.seriesDesc}>{s.description}</p>
            <a href={s.seriesUrl} target="_blank" rel="noopener noreferrer" className={styles.seriesLink}>
              Official series info ↗
            </a>

            {/* RACE CARDS */}
            <div className={styles.raceCards}>
              {s.races.map((race, i) => {
                const key = `${s.id}__${race.id}`
                const p = progress[key] ?? { signed_up: false, finished: false, finish_time: null }
                const raceDay = daysUntil(race.date)
                const regDay = daysUntil(race.registrationOpens)
                const isPast = raceDay < 0
                const isEditingThis = editingTime === key
                const isSaving = saving === key

                return (
                  <div key={race.id} className={`${styles.raceCard} ${p.finished ? styles.raceCardDone : ''}`}>
                    {/* STEP NUMBER */}
                    <div className={`${styles.raceStep} ${p.finished ? styles.raceStepDone : ''}`}>
                      {p.finished ? '✓' : i + 1}
                    </div>

                    <div className={styles.raceCardBody}>
                      <div className={styles.raceCardTop}>
                        <div>
                          <div className={styles.raceName}>{race.name}</div>
                          <div className={styles.raceMeta}>
                            <span className={styles.raceDistance}>{race.distance}</span>
                            <span className={styles.raceDot}>·</span>
                            <span>{formatDate(race.date)}</span>
                            {!isPast && (
                              <span className={`${styles.raceDays} ${raceDay < 60 ? styles.raceDaysSoon : ''}`}>
                                · {raceDay}d away
                              </span>
                            )}
                            {isPast && <span className={styles.racePast}>· Past</span>}
                          </div>
                        </div>

                        {/* SIGN UP LINK */}
                        <a
                          href={race.registerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.registerBtn}
                        >
                          Sign Up ↗
                        </a>
                      </div>

                      {/* REGISTRATION TIMING */}
                      <div className={styles.regNote}>
                        <span className={styles.regNoteLabel}>Registration: </span>
                        {regDay > 0
                          ? `Opens ~${formatDate(race.registrationOpens)} (${regDay} days)`
                          : 'Registration open now'}
                        {' — '}{race.registrationNote}
                      </div>

                      {/* CHECKBOXES */}
                      <div className={styles.raceChecks}>
                        <label className={styles.raceCheck}>
                          <input
                            type="checkbox"
                            checked={p.signed_up}
                            disabled={isSaving}
                            onChange={e => updateProgress(s.id, race.id, 'signed_up', e.target.checked)}
                          />
                          <span>Signed up</span>
                        </label>

                        <label className={styles.raceCheck}>
                          <input
                            type="checkbox"
                            checked={p.finished}
                            disabled={isSaving}
                            onChange={e => {
                              updateProgress(s.id, race.id, 'finished', e.target.checked)
                              if (e.target.checked && !p.finish_time) {
                                setEditingTime(key)
                                setTimeInput('')
                              }
                            }}
                          />
                          <span>Finished</span>
                        </label>

                        {/* FINISH TIME INPUT */}
                        {isEditingThis ? (
                          <div className={styles.timeEntry}>
                            <input
                              className={styles.timeInput}
                              type="text"
                              placeholder={race.distance === 'Marathon' ? '3:45:00' : '45:30'}
                              value={timeInput}
                              onChange={e => setTimeInput(e.target.value)}
                              autoFocus
                            />
                            <button className={styles.timeSaveBtn} onClick={() => saveFinishTime(s.id, race.id)}>
                              Save
                            </button>
                            <button className={styles.timeCancelBtn} onClick={() => setEditingTime(null)}>
                              Skip
                            </button>
                          </div>
                        ) : p.finish_time ? (
                          <button
                            className={styles.finishTimeDisplay}
                            onClick={() => { setEditingTime(key); setTimeInput(p.finish_time ?? '') }}
                          >
                            🏁 {p.finish_time} ✏️
                          </button>
                        ) : p.finished ? (
                          <button
                            className={styles.addTimeBtn}
                            onClick={() => { setEditingTime(key); setTimeInput('') }}
                          >
                            + Add finish time
                          </button>
                        ) : null}

                        {isSaving && <span className={styles.savingDot}>saving…</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* ALTERNATIVE ENTRY METHODS */}
      {major.alternativeEntries.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Other Ways In</div>
          <div className={styles.entryGrid}>
            {major.alternativeEntries.map((alt, i) => (
              <div key={i} className={styles.entryCard}>
                <div className={styles.entryCardTop}>
                  <div className={styles.entryName}>{alt.name}</div>
                  {alt.guaranteed
                    ? <div className={styles.guaranteedBadge}>⚡ Guaranteed Entry</div>
                    : <div className={styles.notGuaranteedBadge}>Not guaranteed</div>
                  }
                </div>
                <div className={styles.entryDesc}>{alt.description}</div>
                <a href={alt.learnMoreUrl} target="_blank" rel="noopener noreferrer" className={styles.entryLink}>
                  Official source ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CHARITY */}
      {major.charity && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>🎗 Run for Charity</div>
          {(major.charity.spotsApprox || major.charity.numPartners || major.charity.minFundraisingUSD) && (
            <div className={styles.charityStats}>
              {major.charity.spotsApprox && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>~{major.charity.spotsApprox.toLocaleString()}</div>
                  <div className={styles.charityStatLabel}>Charity Spots</div>
                </div>
              )}
              {major.charity.numPartners && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>{major.charity.numPartners}</div>
                  <div className={styles.charityStatLabel}>Partner Orgs</div>
                </div>
              )}
              {major.charity.minFundraisingUSD && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>${major.charity.minFundraisingUSD.toLocaleString()}</div>
                  <div className={styles.charityStatLabel}>Min. Fundraising (USD)</div>
                </div>
              )}
              {major.charity.maxFundraisingUSD && major.charity.maxFundraisingUSD !== major.charity.minFundraisingUSD && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>~${major.charity.maxFundraisingUSD.toLocaleString()}</div>
                  <div className={styles.charityStatLabel}>Typical Ask (USD)</div>
                </div>
              )}
            </div>
          )}
          <div className={styles.charityCard}>
            <div className={`${styles.charityDeadline} ${styles[`deadline_${major.charity.deadlineUrgency}`]}`}>
              <div className={styles.charityLabel}>⏱ Application Deadline</div>
              <div className={styles.charityDeadlineText}>{major.charity.deadline}</div>
            </div>
            <div className={styles.charitySection}>
              <div className={styles.charityLabel}>How It Works</div>
              <div className={styles.charityText}>{major.charity.fundraisingNote}</div>
            </div>
            <div className={styles.charitySection}>
              <div className={styles.charityLabel}>How to Apply</div>
              <div className={styles.charityText}>{major.charity.applicationNote}</div>
            </div>
            <a href={major.charity.learnMoreUrl} target="_blank" rel="noopener noreferrer" className={styles.charityLink}>
              View charity partners ↗
            </a>
          </div>
        </section>
      )}

      <div className={styles.footer}>
        All entry information sourced from official race websites. Dates, fees, and requirements
        change year to year — always verify directly with the race before applying.
        <a href={major.entryUrl} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
          Official {major.name} entry site ↗
        </a>
      </div>
    </div>
  )
}
