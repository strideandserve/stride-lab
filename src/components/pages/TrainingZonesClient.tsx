'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatPaceInput } from '@/lib/utils'
import styles from './TrainingZonesClient.module.css'

// ── RUN TYPE DEFINITIONS ──
// Based on Jack Daniels' Running Formula (Daniels & Gilbert), the most validated
// framework in distance-running coaching. Each type targets a distinct physiological
// adaptation; mixing them across the week is what produces marathon fitness.
//
// Pace ranges (your parameters):
//   Recovery:      30–40% slower than goal marathon pace  | HR: <75% HRmax
//   Gen Aerobic:   15–25% slower than goal marathon pace  | HR: 72–80% HRmax
//   Med Long:      10–20% slower than goal marathon pace  | HR: 75–83% HRmax
//   Long Run:      10–20% slower than goal marathon pace  | HR: 75–83% HRmax
//   Marathon Pace: goal marathon pace exactly             | HR: 74–84% HRmax
//   LT Run:        20–25 min continuous at lactate thresh  | HR: 83–90% HRmax
//   Tempo:         LT pace (same as LT run)              | HR: 83–90% HRmax
//   Speed/Intervals: 97–100% VO2max effort               | HR: 98–100% HRmax

interface RunTypeDef {
  id: string
  label: string
  tagline: string
  description: string
  purpose: string[]
  paceCalc: (goalPaceSecs: number) => { minSecs: number; maxSecs: number } | null
  hrCalc: (maxHr: number) => { min: number; max: number }
  note?: string
}

const RUN_TYPES: RunTypeDef[] = [
  {
    id: 'recovery',
    label: 'Recovery Run',
    tagline: 'Run slow enough that your body can fix itself.',
    description: 'The most underrated run in any training block. Recovery runs are short, deliberately easy efforts that flush metabolic waste from hard sessions and stimulate blood flow to repairing muscles — without adding meaningful fatigue. According to Daniels\' Running Formula, easy-pace running at this intensity is responsible for key cellular adaptations: the heart muscle strengthens, mitochondrial density increases, and muscles improve their ability to process oxygen. These runs "connect the dots" between your hard sessions and should never feel like a workout.',
    purpose: [
      'Clears lactate and metabolic byproducts from hard sessions',
      'Maintains weekly mileage without adding training stress',
      'Builds aerobic base through mitochondrial development',
      'Active recovery — better than total rest for circulation',
    ],
    paceCalc: (goal) => ({ minSecs: Math.round(goal * 1.30), maxSecs: Math.round(goal * 1.40) }),
    hrCalc: (max) => ({ min: 0, max: Math.round(max * 0.75) }),
    note: 'Heart rate is a better guide than pace here — keep it below 75% max HR. If it climbs above that, slow down further or walk.',
  },
  {
    id: 'gen_aerobic',
    label: 'General Aerobic',
    tagline: 'The workhorse of marathon training — comfortable but purposeful.',
    description: 'General aerobic runs form the largest portion of a well-built training block by time on feet. Pace-wise they sit comfortably between recovery runs and marathon pace — challenging enough to stimulate aerobic adaptation, easy enough to run day after day without accumulating deep fatigue. These runs build your aerobic engine: increasing VO2max, improving fat oxidation efficiency, and building the structural resilience (stronger tendons, bones, and connective tissue) that lets you absorb the volume of marathon training without injury. Daniels describes this zone as 59–74% of VO2max, or the range where you can hold a full conversation without straining.',
    purpose: [
      'Primary aerobic base-building stimulus',
      'Improves fat metabolism efficiency — critical for late-race fuel management',
      'Builds structural resilience for high-volume training',
      'Develops cardiovascular efficiency without high recovery cost',
    ],
    paceCalc: (goal) => ({ minSecs: Math.round(goal * 1.15), maxSecs: Math.round(goal * 1.25) }),
    hrCalc: (max) => ({ min: Math.round(max * 0.72), max: Math.round(max * 0.80) }),
  },
  {
    id: 'med_long',
    label: 'Medium-Long Run',
    tagline: 'The bridge between easy miles and true long run stress.',
    description: 'The medium-long run is a mid-week quality effort that sits between a general aerobic run and the weekend long run in both distance and fatigue cost. Typically 10–16 miles for a competitive marathon runner, these runs build time-on-feet fitness and reinforce aerobic endurance without requiring the multi-day recovery of a full long run. In advanced marathon blocks, medium-long runs are often used as a second "quality" day, sometimes with the final miles at marathon pace to accumulate race-specific fatigue in a controlled setting. The pace sits at the same range as long runs — 10–20% slower than goal marathon pace — because the adaptation target is the same: aerobic endurance.',
    purpose: [
      'Builds time-on-feet endurance at sub-maximal effort',
      'Develops glycogen economy and fat utilization at race-relevant intensities',
      'Bridges the gap between easy base miles and long run demand',
      'Allows marathon-pace finishes to accumulate race-specific fatigue in a controlled way',
    ],
    paceCalc: (goal) => ({ minSecs: Math.round(goal * 1.10), maxSecs: Math.round(goal * 1.20) }),
    hrCalc: (max) => ({ min: Math.round(max * 0.75), max: Math.round(max * 0.83) }),
  },
  {
    id: 'long_run',
    label: 'Long Run',
    tagline: 'The cornerstone of marathon preparation. Run slow to race fast.',
    description: 'The long run is the defining workout of marathon training. Run at an easy-to-moderate pace — 10–20% slower than goal marathon pace — its primary purpose is physiological: teaching the body to burn fat as fuel, delay glycogen depletion, and tolerate the musculoskeletal stress of 2–4+ hours of continuous running. Daniels advises keeping long runs under 2:30 hours for most athletes, not exceeding 25% of weekly mileage, and running them truly easy rather than racing them. Many advanced training plans include progressive long runs where the final 6–8 miles are run at marathon pace — a powerful stimulus for race-specific fitness that this run type is perfectly positioned to host.',
    purpose: [
      'Develops fat oxidation and glycogen economy — the #1 late-race performance factor',
      'Builds mitochondrial density and capillary development in slow-twitch fibers',
      'Conditions muscles, tendons, and connective tissue for marathon distance',
      'Trains mental resilience for long-duration effort',
    ],
    paceCalc: (goal) => ({ minSecs: Math.round(goal * 1.10), maxSecs: Math.round(goal * 1.20) }),
    hrCalc: (max) => ({ min: Math.round(max * 0.75), max: Math.round(max * 0.83) }),
    note: 'Daniels recommends long runs cap at 2:30–3 hours regardless of pace. Beyond that, recovery cost outweighs adaptation benefit for most runners.',
  },
  {
    id: 'lt_run',
    label: 'Lactate Threshold Run',
    tagline: 'The single most effective workout for improving your marathon time.',
    description: 'Lactate threshold (LT) runs target the precise intensity at which blood lactate begins accumulating faster than your body can clear it — commonly called the "lactate threshold" or "tempo pace." Daniels defines this as 83–88% of VO2max, or the pace you could sustain in an all-out effort for roughly 60 minutes. Training at this intensity raises the threshold itself — meaning you can run faster before lactate builds up, directly translating to a faster sustainable marathon pace. The standard format is a sustained 20–30 minute effort at threshold pace. Longer threshold efforts (40–60 min) use "cruise intervals" — threshold reps with 1–2 minute rest between segments to accumulate more time at the target intensity.',
    purpose: [
      'Directly raises the lactate threshold — the primary determinant of marathon performance',
      'Improves clearance rate of blood lactate at high intensities',
      'Builds mental tolerance for sustained discomfort',
      '"Comfortably hard" — the most time-efficient quality stimulus in distance running',
    ],
    paceCalc: () => null, // LT pace is user-defined, not derived from marathon pace
    hrCalc: (max) => ({ min: Math.round(max * 0.83), max: Math.round(max * 0.90) }),
    note: 'Lactate threshold pace varies significantly person-to-person. Enter your LT pace manually — a common way to find it is your best 10K race pace, or the pace you can sustain for exactly 60 minutes in a hard time trial.',
  },
  {
    id: 'tempo',
    label: 'Tempo Run',
    tagline: 'Sustained effort at comfortably hard — builds your engine\'s ceiling.',
    description: 'The tempo run is a variation of lactate threshold training — typically a steady, unbroken 20–30 minute effort at threshold pace (the same physiological zone as LT runs). Daniels describes threshold pace as "comfortably hard" — not a race effort, but noticeably harder than general aerobic runs. While LT runs may use cruise intervals (broken reps) to accumulate time at threshold, a tempo run is specifically the continuous version. The physiological target is identical: sustained running at the lactate threshold to elevate that threshold over time. These workouts are most effective when done consistently, not heroically — Daniels recommends no more than 10% of weekly mileage at threshold pace.',
    purpose: [
      'Elevates the lactate threshold through repeated quality exposure',
      'Builds confidence in sustained hard running — critical for marathon race execution',
      'More sustainable than interval training — can be run more frequently',
      'Develops the neuromuscular patterning of "hard but controlled" effort',
    ],
    paceCalc: () => null, // same as LT, user-defined
    hrCalc: (max) => ({ min: Math.round(max * 0.83), max: Math.round(max * 0.90) }),
    note: 'Tempo and LT run pace should feel like a 7–8 out of 10 effort — hard enough that conversation is limited to a few words, but not a sprint. You should finish tired but not destroyed.',
  },
  {
    id: 'speed_intervals',
    label: 'Speed / Intervals',
    tagline: 'Short, fast, and powerful. Train the top end to raise the bottom.',
    description: 'Interval training targets VO2max — the maximum rate at which your body can take in and use oxygen. By running at 97–100% of VO2max intensity in short (3–5 minute) repeats with equal-duration recovery jogs, you force the cardiovascular system to operate at its ceiling, creating a powerful adaptation stimulus. Over time, VO2max rises, meaning all paces below it — including marathon pace — become relatively easier. Daniels recommends intervals of 800m–1200m (or 3–5 min efforts), with recovery jogs equal to or slightly shorter than the work interval. The key is that each repeat should feel hard but controlled — not a sprint — and form should be maintained throughout.',
    purpose: [
      'Directly improves VO2max — the upper limit of aerobic power',
      'Raises the "ceiling" that all other training intensities operate below',
      'Improves running economy through neuromuscular adaptation at fast paces',
      'Develops speed tolerance — the ability to sustain fast paces without form breakdown',
    ],
    paceCalc: (goal) => ({ minSecs: Math.round(goal * 0.88), maxSecs: Math.round(goal * 0.92) }),
    hrCalc: (max) => ({ min: Math.round(max * 0.95), max: max }),
    note: 'Pace guidance here is approximate — true interval pace is derived from your VDOT score, not directly from marathon pace. This estimate works for most runners but won\'t be exact. Daniels caps intervals at 8% of weekly mileage.',
  },
  {
    id: 'recovery_strides',
    label: 'Recovery w/ Strides',
    tagline: 'Easy miles with brief pickups — keeps your legs honest on a rest day.',
    description: 'Recovery runs with strides are easy-pace runs that conclude with 4–6 brief accelerations of 15–20 seconds — not sprints, but smooth, controlled pickups to a fast but comfortable speed. The strides serve a specific neuromuscular purpose: maintaining fast-twitch muscle engagement and running economy during recovery weeks or high-volume periods when pure easy running might let the nervous system become too "slow." They cost negligible physiological effort but preserve the muscular coordination needed for quality workouts. After each stride, full recovery before the next is essential. Strides should feel effortless, relaxed, and quick — never forced.',
    purpose: [
      'Maintains neuromuscular speed and fast-twitch engagement during recovery periods',
      'Preserves running economy without adding training stress',
      'Keeps legs "fresh" and responsive heading into quality workouts',
      'Easy to add to any recovery day without extending recovery time',
    ],
    paceCalc: (goal) => ({ minSecs: Math.round(goal * 1.30), maxSecs: Math.round(goal * 1.40) }),
    hrCalc: (max) => ({ min: 0, max: Math.round(max * 0.75) }),
    note: 'Pace above is for the easy portion. Strides (15–20 sec each) are run at ~85–90% effort — not fully measurable by overall pace. The overall average pace will look like a recovery run even with strides included.',
  },
]

function secsToMmSs(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function paceToSecs(pace: string): number | null {
  const parts = pace.split(':').map(Number)
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return parts[0] * 60 + parts[1]
}

interface Props { initialGoalPace: string; initialMaxHr: number | null; userId: string }

export default function TrainingZonesClient({ initialGoalPace, initialMaxHr, userId }: Props) {
  const supabase = createClient()
  const [goalPace, setGoalPace] = useState(initialGoalPace)
  const [maxHr, setMaxHr] = useState(initialMaxHr ? String(initialMaxHr) : '')
  const [ltPace, setLtPace] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const goalSecs = paceToSecs(goalPace)
  const maxHrNum = maxHr ? parseInt(maxHr) : null

  async function save() {
    setSaving(true)
    await supabase.from('profiles').update({
      goal_marathon_pace: goalPace || null,
      max_hr: maxHrNum || null,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>TRAINING<br/>ZONES</div>
      <div className={styles.subtitle}>
        Run type definitions and personalized pace/HR targets based on Jack Daniels' Running Formula
      </div>

      {/* INPUTS */}
      <div className={styles.inputCard}>
        <div className={styles.inputCardTitle}>Your Training Parameters</div>
        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Goal Marathon Pace (min/mi)</label>
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              placeholder="6:50"
              value={goalPace}
              onChange={e => setGoalPace(formatPaceInput(e.target.value))}
            />
            <div className={styles.inputHint}>Your target race pace for your goal marathon</div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Max Heart Rate (bpm)</label>
            <input
              className={styles.input}
              type="number"
              placeholder="190"
              value={maxHr}
              onChange={e => setMaxHr(e.target.value)}
            />
            <div className={styles.inputHint}>Used for HR zone targets. Unsure? A common estimate is 220 − age.</div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Lactate Threshold Pace (min/mi)</label>
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              placeholder="7:15"
              value={ltPace}
              onChange={e => setLtPace(formatPaceInput(e.target.value))}
            />
            <div className={styles.inputHint}>Your ~60-min race pace or 10K race pace. Used for LT/Tempo runs.</div>
          </div>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save to Profile'}
          </button>
        </div>
      </div>

      {/* PACE + HR TABLE */}
      {(goalSecs || maxHrNum) && (
        <div className={styles.tableCard}>
          <div className={styles.tableTitle}>Your Personalized Targets</div>
          <div className={styles.tableSubtitle}>
            Pace ranges derived from your goal marathon pace. HR zones based on your max HR.
            {!goalSecs && ' Enter goal marathon pace for pace targets.'}
            {!maxHrNum && ' Enter max HR for heart rate targets.'}
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Run Type</th>
                  <th>Pace Range (min/mi)</th>
                  <th>Heart Rate Zone</th>
                </tr>
              </thead>
              <tbody>
                {RUN_TYPES.map(rt => {
                  const ltSecs = paceToSecs(ltPace)
                  const paceRange = (() => {
                    if (rt.id === 'lt_run' || rt.id === 'tempo') {
                      if (!ltSecs) return 'Enter LT pace above'
                      return `${secsToMmSs(ltSecs)} /mi`
                    }
                    if (!goalSecs) return '—'
                    const calc = rt.paceCalc(goalSecs)
                    if (!calc) return 'See LT pace'
                    return `${secsToMmSs(calc.minSecs)} – ${secsToMmSs(calc.maxSecs)} /mi`
                  })()
                  const hrRange = (() => {
                    if (!maxHrNum) return '—'
                    const calc = rt.hrCalc(maxHrNum)
                    if (rt.id === 'recovery' || rt.id === 'recovery_strides') {
                      return `< ${calc.max} bpm`
                    }
                    return `${calc.min} – ${calc.max} bpm`
                  })()
                  const isLt = rt.id === 'lt_run' || rt.id === 'tempo'
                  const isSpeed = rt.id === 'speed_intervals'
                  return (
                    <tr key={rt.id} className={isLt ? styles.rowHighlight : isSpeed ? styles.rowSpeed : ''}>
                      <td className={styles.tdLabel}>{rt.label}</td>
                      <td className={styles.tdPace}>{paceRange}</td>
                      <td className={styles.tdHr}>{hrRange}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RUN TYPE CARDS */}
      <div className={styles.zonesTitle}>Run Type Reference</div>
      <div className={styles.zoneGrid}>
        {RUN_TYPES.map(rt => {
          const ltSecs = paceToSecs(ltPace)
          const paceRange = (() => {
            if (rt.id === 'lt_run' || rt.id === 'tempo') {
              if (!ltSecs) return null
              return `${secsToMmSs(ltSecs)} /mi`
            }
            if (!goalSecs) return null
            const calc = rt.paceCalc(goalSecs)
            if (!calc) return null
            return `${secsToMmSs(calc.minSecs)} – ${secsToMmSs(calc.maxSecs)} /mi`
          })()
          const hrRange = (() => {
            if (!maxHrNum) return null
            const calc = rt.hrCalc(maxHrNum)
            if (rt.id === 'recovery' || rt.id === 'recovery_strides') return `< ${calc.max} bpm`
            return `${calc.min} – ${calc.max} bpm`
          })()

          return (
            <div key={rt.id} className={styles.zoneCard}>
              <div className={styles.zoneCardHeader}>
                <div className={styles.zoneCardName}>{rt.label}</div>
                <div className={styles.zoneCardTagline}>{rt.tagline}</div>
              </div>

              {(paceRange || hrRange) && (
                <div className={styles.zoneCardTargets}>
                  {paceRange && (
                    <div className={styles.zoneTarget}>
                      <div className={styles.zoneTargetLabel}>Your Pace</div>
                      <div className={styles.zoneTargetVal}>{paceRange}</div>
                    </div>
                  )}
                  {hrRange && (
                    <div className={styles.zoneTarget}>
                      <div className={styles.zoneTargetLabel}>Your HR Zone</div>
                      <div className={styles.zoneTargetVal}>{hrRange}</div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.zoneCardDesc}>{rt.description}</div>

              <div className={styles.zoneCardPurpose}>
                <div className={styles.zoneCardPurposeTitle}>What it trains</div>
                <ul className={styles.zoneCardPurposeList}>
                  {rt.purpose.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>

              {rt.note && (
                <div className={styles.zoneCardNote}>💡 {rt.note}</div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.citation}>
        Pace zones and HR ranges based on{' '}
        <strong>Jack Daniels' Running Formula</strong> (Daniels &amp; Gilbert, 3rd ed.)
        — the most rigorously validated training-intensity framework in distance running.
        The VDOT oxygen-cost model underpins all pace prescriptions.
        Lactate threshold HR ranges sourced from the VO2 Running Calculator (vdoto2.com).
      </div>
    </div>
  )
}
