'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Shoe, Run } from '@/lib/types'
import { paceToSeconds, paceToFinishTime, raceTypeLabel, derivePaceFromFinish, finishTimeToSeconds, secondsToPace, formatPaceInput, formatTimeInput, CAT_COLORS, getRaceLogoUrl } from '@/lib/utils'
import { raceTypeToDistance, getPercentileRow, estimatePercentile, percentileToTopPct, getP95, DISTANCE_LABELS, getAgeGroup, type Gender } from '@/lib/percentiles'
import Modal from '@/components/Modal'
import { FormGroup, FormLabel, FormInput, FormSelect, FormRow, FormActions, Btn } from '@/components/Form'
import { toast } from '@/components/Toast'
import styles from './RacesClient.module.css'

interface ProfileLite { birth_year: number | null; gender: Gender | null }
interface Props { shoes: Shoe[]; races: Run[]; profile: ProfileLite | null }

export default function RacesClient({ shoes, races, profile }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const [editModal, setEditModal] = useState(false)
  const [logModal, setLogModal]   = useState(false)
  const [editRun, setEditRun]     = useState<Run|null>(null)
  const [runShoeId, setRunShoeId] = useState('')
  const [runMiles, setRunMiles]   = useState('')
  const [runDate, setRunDate]     = useState('')
  const [runPace, setRunPace]     = useState('')
  const [runHr, setRunHr]         = useState('')
  const [runComfort, setRunComfort] = useState(7.5)
  const [runTemp, setRunTemp]     = useState('')
  const [runHumidity, setRunHumidity] = useState('')
  const [runFinish, setRunFinish] = useState('')
  const [runRaceName, setRunRaceName] = useState('')
  const [runRaceType, setRunRaceType] = useState('marathon')
  const [pacePrev, setPacePrev]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [podiumType, setPodiumType] = useState<'marathon'|'half'>('marathon')

  const marathons = races.filter(r=>r.race_type==='marathon')
  const halfs     = races.filter(r=>r.race_type==='half')
  const prOf = (arr: Run[]) => arr.filter(r=>r.pace).reduce<Run|null>((b,r)=>!b||paceToSeconds(r.pace)!<paceToSeconds(b.pace)!?r:b,null)
  const mPR = prOf(marathons), hPR = prOf(halfs)

  function openLogRace() {
    setEditRun(null)
    setRunShoeId(shoes.find(s=>s.category==='race')?.id ?? shoes[0]?.id ?? '')
    setRunMiles('26.2'); setRunDate(new Date().toISOString().split('T')[0])
    setRunPace(''); setRunHr(''); setRunComfort(7.5)
    setRunTemp(''); setRunHumidity(''); setRunFinish('')
    setRunRaceName(''); setRunRaceType('marathon'); setPacePrev('')
    setLogModal(true)
  }
  function openEdit(r: Run) {
    setEditRun(r); setRunShoeId(r.shoe_id); setRunMiles(String(r.miles)); setRunDate(r.date)
    setRunPace(r.pace||''); setRunHr(r.hr?String(r.hr):''); setRunComfort(r.comfort||7.5)
    setRunTemp(r.temp?String(r.temp):''); setRunHumidity(r.humidity?String(r.humidity):'')
    setRunFinish(r.finish_time||''); setRunRaceName(r.race_name||''); setRunRaceType(r.race_type||'marathon')
    if (r.finish_time&&r.miles) { const p=derivePaceFromFinish(r.finish_time,r.miles); setPacePrev(p?`→ ${p} / mile`:'') }
    else setPacePrev('')
    setEditModal(true)
  }
  async function saveEdit() {
    if (!editRun) return; setSaving(true)
    const miles = parseFloat(runMiles)
    const derived = runFinish ? derivePaceFromFinish(runFinish,miles) : null
    await supabase.from('runs').update({
      miles, date:runDate, pace:derived||runPace.trim()||null, hr:runHr?parseInt(runHr):null,
      temp:runTemp?parseFloat(runTemp):null, humidity:runHumidity?parseFloat(runHumidity):null,
      finish_time:runFinish||null, race_name:runRaceName.trim()||null, race_type:runRaceType,
    }).eq('id',editRun.id)
    toast('Race updated'); setSaving(false); setEditModal(false); router.refresh()
  }
  async function saveNewRace() {
    const miles = parseFloat(runMiles)
    if (!miles || miles<=0) return toast('Enter a valid distance','error')
    if (!runDate) return toast('Pick a date','error')
    if (!runShoeId) return toast('Select a shoe','error')
    setSaving(true)
    const derived = runFinish ? derivePaceFromFinish(runFinish, miles) : null
    const { data:{ session } } = await supabase.auth.getSession()
    await supabase.from('runs').insert({
      user_id: session!.user.id, shoe_id: runShoeId, miles, date: runDate,
      pace: derived||runPace.trim()||null, hr: runHr?parseInt(runHr):null, comfort: runComfort,
      temp: runTemp?parseFloat(runTemp):null, humidity: runHumidity?parseFloat(runHumidity):null,
      finish_time: runFinish||null, is_race: true,
      race_name: runRaceName.trim()||null, race_type: runRaceType,
    })
    toast('Race logged'); setSaving(false); setLogModal(false); router.refresh()
  }

  // Podium
  const podiumRaces = podiumType==='marathon' ? marathons : halfs
  const distMi      = podiumType==='marathon' ? 26.2 : 13.1
  const chrono = [...podiumRaces].filter(r=>r.pace).sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
  let runningBest: number|null = null
  const withPct = chrono.map(r => {
    const secs = paceToSeconds(r.pace)
    let pct: number|null = null
    if (runningBest!==null&&secs!==null) pct = ((runningBest-secs)/runningBest)*100
    if (secs!==null&&(runningBest===null||secs<runningBest)) runningBest=secs
    return { ...r, secs, pct }
  })
  const sorted = [...withPct].sort((a,b)=>(a.secs||9999)-(b.secs||9999))
  const medals = ['gold','silver','bronze']
  const medalEmoji = ['🥇','🥈','🥉']

  // ── PERCENTILE RANKINGS
  const hasProfile = !!(profile?.birth_year && profile?.gender)
  const percentileRaces = hasProfile ? races
    .map(r => {
      const distance = raceTypeToDistance(r.race_type)
      if (!distance) return null
      const timeSecs = r.finish_time ? finishTimeToSeconds(r.finish_time) : (r.pace && r.miles ? (paceToSeconds(r.pace)||0) * r.miles : null)
      if (!timeSecs) return null
      const raceYear = r.date ? new Date(r.date).getFullYear() : new Date().getFullYear()
      const age = raceYear - (profile!.birth_year as number)
      const row = getPercentileRow(distance, profile!.gender as Gender, age)
      const percentile = estimatePercentile(timeSecs, row)
      return { run: r, distance, timeSecs, age, ageGroup: getAgeGroup(age), row, percentile }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null) : []

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <div className={styles.title}>RACE<br/>LOG</div>
        <Btn variant="accent" onClick={openLogRace}>+ Log a Race</Btn>
      </div>

      {/* SUMMARY BAR */}
      <div className={styles.summaryBar}>
        {[
          {val:races.length,label:'Total Races'},
          {val:marathons.length,label:'Marathons'},
          {val:halfs.length,label:'Half Marathons'},
          {val:mPR?(mPR.finish_time||paceToFinishTime(mPR.pace,mPR.miles||26.2)||mPR.pace+'/mi'):'—',label:'Marathon PR'},
          {val:hPR?(hPR.finish_time||paceToFinishTime(hPR.pace,hPR.miles||13.1)||hPR.pace+'/mi'):'—',label:'Half PR'},
        ].map(({val,label},i)=>(
          <div key={i} className={styles.summaryItem}>
            <div className={styles.summaryVal}>{val}</div>
            <div className={styles.summaryLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* RACE TABLE */}
      {races.length===0 ? (
        <div className={styles.empty}><div>🏁</div><div>No Races Logged</div><div>When logging a run with a race day shoe, check "Was this a race?"</div></div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <span>Race</span><span>Type</span><span>Date</span><span>Finish</span><span>Pace</span><span>HR</span><span>Conditions</span><span/>
            </div>
            {races.map(r => {
              const shoe = shoes.find(s=>s.id===r.shoe_id)
              const isPR = (r.race_type==='marathon'&&mPR?.id===r.id)||(r.race_type==='half'&&hPR?.id===r.id)
              return (
                <div key={r.id} className={styles.tableRow}>
                  <div>
                    <div className={styles.raceName}>
                    {getRaceLogoUrl(r.race_name) && (
                      <img src={getRaceLogoUrl(r.race_name)!} alt={r.race_name||''} className={styles.raceLogoInline} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                    )}
                    {r.race_name||'Unnamed Race'}{isPR&&<span className={styles.prTag}>★ PR</span>}
                  </div>
                    <div className={styles.raceShoeName}>{shoe?`${shoe.brand} ${shoe.name}`:'—'}</div>
                  </div>
                  <div><span className={`${styles.typeBadge} ${styles[r.race_type||'other']}`}>{raceTypeLabel(r.race_type)}</span></div>
                  <div className={styles.raceStat}>{r.date}</div>
                  <div className={styles.raceStat}>{r.finish_time||'—'}</div>
                  <div className={styles.raceStat}>{r.pace?`${r.pace}/mi`:'—'}</div>
                  <div className={styles.raceStat}>{r.hr?`${r.hr} bpm`:'—'}</div>
                  <div className={styles.raceStat}>{r.temp!=null?`${r.temp}°F`:'—'}{r.humidity!=null?` · ${r.humidity}%`:''}</div>
                  <div><button className={styles.editBtn} onClick={()=>openEdit(r)}>EDIT</button></div>
                </div>
              )
            })}
          </div>

          {/* PODIUM */}
          {(marathons.length>0||halfs.length>0) && (
            <div className={styles.podiumSection}>
              <div className={styles.podiumTitle}>PERFORMANCE PODIUM</div>
              <div className={styles.podiumTabs}>
                {marathons.length>0&&<button className={`${styles.podiumTab} ${podiumType==='marathon'?styles.podiumTabActive:''}`} onClick={()=>setPodiumType('marathon')}>Marathon</button>}
                {halfs.length>0&&<button className={`${styles.podiumTab} ${podiumType==='half'?styles.podiumTabActive:''}`} onClick={()=>setPodiumType('half')}>Half Marathon</button>}
              </div>
              <div className={styles.podiumWrap}>
                {/* classic layout: silver | gold | bronze */}
                {[1,0,2].map(i => {
                  const r = sorted[i]
                  const medal = medals[i]
                  const emoji = medalEmoji[i]
                  if (!r) return (
                    <div key={i} className={styles.podiumCol}>
                      <div className={styles.podiumEmpty}><div style={{fontSize:28,opacity:0.3}}>{emoji}</div><div>No result yet</div></div>
                      <div className={`${styles.podiumBlock} ${styles[medal]}`}><span className={`${styles.podiumRankLabel} ${styles[medal]}`}>{i+1}</span></div>
                    </div>
                  )
                  const shoe  = shoes.find(s=>s.id===r.shoe_id)
                  const finish = r.finish_time||paceToFinishTime(r.pace,r.miles||distMi)||r.pace+'/mi'
                  const better = r.pct!==null&&r.pct>0
                  const worse  = r.pct!==null&&r.pct<=0
                  return (
                    <div key={i} className={styles.podiumCol}>
                      <div className={styles.podiumCard}>
                        <div className={`${styles.podiumMedal} ${styles[medal]}`}>{emoji}</div>
                        {getRaceLogoUrl(r.race_name) && (
                          <img src={getRaceLogoUrl(r.race_name)!} alt={r.race_name||''} className={styles.podiumRaceLogo} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                        )}
                        <div className={styles.podiumRaceName}>{r.race_name||'Unnamed Race'}</div>
                        <div className={styles.podiumDate}>{r.date}{shoe?` · ${shoe.name}`:''}</div>
                        <div className={`${styles.podiumTime} ${styles[medal]}`}>{finish}</div>
                        <div className={styles.podiumPace}>{r.pace}/mi{r.hr?` · ${r.hr} bpm`:''}</div>
                        {r.pct===null ? (
                          <div className={styles.podiumImp}>1st Logged Race</div>
                        ) : (
                          <div className={`${styles.podiumImp} ${better?styles.podiumBetter:styles.podiumWorse}`}>
                            {better?'↑':'↓'} {better?'+':''}{r.pct.toFixed(2)}% vs prev PR
                          </div>
                        )}
                      </div>
                      <div className={`${styles.podiumBlock} ${styles[medal]}`}><span className={`${styles.podiumRankLabel} ${styles[medal]}`}>{i+1}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* PERCENTILE RANKINGS */}
      {races.length > 0 && (
        <div className={styles.percentileSection}>
          <div className={styles.podiumTitle}>HOW YOU RANK</div>
          {!hasProfile ? (
            <div className={styles.percentileEmpty}>
              Add your birth year and gender in <strong>⚙ Profile</strong> (top nav) to see how your
              race times compare to other runners of your age and gender.
            </div>
          ) : percentileRaces.length === 0 ? (
            <div className={styles.percentileEmpty}>
              Log a finish time for a Marathon, Half Marathon, 10K, or 5K to see your percentile ranking.
            </div>
          ) : (
            <div className={styles.percentileGrid}>
              {percentileRaces.map(({ run, distance, timeSecs, ageGroup, row, percentile }) => (
                <div key={run.id} className={styles.percentileCard}>
                  <div className={styles.percentileCardHeader}>
                    <div>
                      <div className={styles.percentileRaceName}>{run.race_name || 'Unnamed Race'}</div>
                      <div className={styles.percentileMeta}>
                        {DISTANCE_LABELS[distance]} · {run.date} · {profile?.gender==='male'?'Male':'Female'} {ageGroup}
                      </div>
                    </div>
                    <div className={styles.percentileBadge}>
                      <div className={styles.percentileBadgeVal}>{percentileToTopPct(percentile)}</div>
                      <div className={styles.percentileBadgeLabel}>for your age &amp; gender</div>
                    </div>
                  </div>
                  <div className={styles.percentileBenchTable}>
                    {([
                      { label: 'Top 5%',  secs: getP95(row) },
                      { label: 'Top 10%', secs: row.p90 },
                      { label: 'Top 25%', secs: row.p75 },
                      { label: 'Median',  secs: row.p50 },
                      { label: 'Top 75%', secs: row.p25 },
                      { label: 'Back of Pack', secs: row.p10 },
                    ] as const).map((b) => {
                      const benches = [getP95(row),row.p90,row.p75,row.p50,row.p25,row.p10]
                      let closestIdx = 0, closestDiff = Infinity
                      benches.forEach((s,idx)=>{ const d=Math.abs(s-timeSecs); if(d<closestDiff){closestDiff=d;closestIdx=idx} })
                      const labels = ['Top 5%','Top 10%','Top 25%','Median','Top 75%','Back of Pack']
                      const isClosest = labels[closestIdx]===b.label
                      const display = (distance==='marathon'||distance==='half')
                        ? new Date(b.secs*1000).toISOString().substring(11,19).replace(/^0/,'')
                        : secondsToPace(b.secs)
                      return (
                        <div key={b.label} className={`${styles.percentileBenchItem} ${isClosest?styles.percentileBenchActive:''}`}>
                          <div className={styles.percentileBenchLabel}>{b.label}</div>
                          <div className={styles.percentileBenchTime}>{display}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className={styles.percentileYourTime}>
                    Your time: <strong>{run.finish_time || secondsToPace(timeSecs)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title="Edit Race">
        <FormRow>
          <FormGroup><FormLabel>Distance</FormLabel><FormInput type="number" step="0.01" value={runMiles} onChange={e=>setRunMiles(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Date</FormLabel><FormInput type="date" value={runDate} onChange={e=>setRunDate(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Pace (min/mi)</FormLabel><FormInput type="text" inputMode="numeric" placeholder="7:30" value={runPace} onChange={e=>setRunPace(formatPaceInput(e.target.value))}/></FormGroup>
          <FormGroup><FormLabel>Heart Rate</FormLabel><FormInput type="number" placeholder="155" value={runHr} onChange={e=>setRunHr(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Temp (°F)</FormLabel><FormInput type="number" value={runTemp} onChange={e=>setRunTemp(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Humidity (%)</FormLabel><FormInput type="number" value={runHumidity} onChange={e=>setRunHumidity(e.target.value)}/></FormGroup>
        </FormRow>
        <FormGroup>
          <FormLabel>Race Name</FormLabel>
          <FormInput value={runRaceName} onChange={e=>setRunRaceName(e.target.value)}/>
        </FormGroup>
        <FormGroup>
          <FormLabel>Race Type</FormLabel>
          <FormSelect value={runRaceType} onChange={e=>setRunRaceType(e.target.value)}>
            <option value="marathon">Marathon</option><option value="half">Half Marathon</option>
            <option value="ten_k">10K</option><option value="five_k">5K</option><option value="other">Other</option>
          </FormSelect>
        </FormGroup>
        <FormGroup>
          <FormLabel>Finish Time <span style={{color:'var(--text-dim)',fontSize:9}}>H:MM:SS</span></FormLabel>
          <FormInput type="text" inputMode="numeric" placeholder="2:58:30" value={runFinish} onChange={e=>{const v=formatTimeInput(e.target.value);setRunFinish(v);const p=derivePaceFromFinish(v,parseFloat(runMiles));setPacePrev(p?`→ ${p} / mile`:'')} }/>
          {pacePrev&&<div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--accent)',marginTop:6}}>{pacePrev}</div>}
        </FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setEditModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveEdit} disabled={saving}>{saving?'Saving…':'Save Changes'}</Btn>
        </FormActions>
      </Modal>

      {/* LOG A RACE MODAL */}
      <Modal open={logModal} onClose={()=>setLogModal(false)} title="Log a Race">
        <FormGroup>
          <FormLabel>Shoe</FormLabel>
          <FormSelect value={runShoeId} onChange={e=>setRunShoeId(e.target.value)}>
            <option value="">Select a shoe...</option>
            {shoes.map(s=><option key={s.id} value={s.id}>{s.brand} {s.name}</option>)}
          </FormSelect>
        </FormGroup>
        <FormRow>
          <FormGroup><FormLabel>Race Name</FormLabel><FormInput placeholder="e.g. Chicago Marathon 2026" value={runRaceName} onChange={e=>setRunRaceName(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Date</FormLabel><FormInput type="date" value={runDate} onChange={e=>setRunDate(e.target.value)}/></FormGroup>
        </FormRow>
        <FormGroup>
          <FormLabel>Race Type</FormLabel>
          <FormSelect value={runRaceType} onChange={e=>{
            const v = e.target.value; setRunRaceType(v)
            const dist = v==='marathon'?26.2:v==='half'?13.1:v==='ten_k'?6.2:v==='five_k'?3.1:parseFloat(runMiles)||0
            setRunMiles(String(dist))
          }}>
            <option value="marathon">Marathon</option><option value="half">Half Marathon</option>
            <option value="ten_k">10K</option><option value="five_k">5K</option><option value="other">Other</option>
          </FormSelect>
        </FormGroup>
        <FormRow>
          <FormGroup><FormLabel>Distance (miles)</FormLabel><FormInput type="number" step="0.01" value={runMiles} onChange={e=>{setRunMiles(e.target.value);if(runFinish){const p=derivePaceFromFinish(runFinish,parseFloat(e.target.value));setPacePrev(p?`→ ${p} / mile`:'')}}}/></FormGroup>
          <FormGroup>
            <FormLabel>Finish Time <span style={{color:'var(--text-dim)',fontSize:9}}>H:MM:SS</span></FormLabel>
            <FormInput type="text" inputMode="numeric" placeholder="2:58:30" value={runFinish} onChange={e=>{const v=formatTimeInput(e.target.value);setRunFinish(v);const p=derivePaceFromFinish(v,parseFloat(runMiles));setPacePrev(p?`→ ${p} / mile`:'')}}/>
          </FormGroup>
        </FormRow>
        {pacePrev&&<div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--accent)',marginTop:-8,marginBottom:8}}>{pacePrev}</div>}
        <FormRow>
          <FormGroup><FormLabel>Pace (min/mi)</FormLabel><FormInput type="text" inputMode="numeric" placeholder="7:30" value={runPace} onChange={e=>setRunPace(formatPaceInput(e.target.value))}/></FormGroup>
          <FormGroup><FormLabel>Heart Rate (bpm)</FormLabel><FormInput type="number" placeholder="155" value={runHr} onChange={e=>setRunHr(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Temp (°F)</FormLabel><FormInput type="number" value={runTemp} onChange={e=>setRunTemp(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Humidity (%)</FormLabel><FormInput type="number" value={runHumidity} onChange={e=>setRunHumidity(e.target.value)}/></FormGroup>
        </FormRow>
        <FormGroup>
          <FormLabel>Shoe Comfort: <span style={{color:'var(--accent)'}}>{runComfort}</span> / 10</FormLabel>
          <input type="range" min="0.5" max="10" step="0.5" value={runComfort} onChange={e=>setRunComfort(parseFloat(e.target.value))} className={styles.slider}/>
        </FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setLogModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveNewRace} disabled={saving}>{saving?'Saving…':'Log Race'}</Btn>
        </FormActions>
      </Modal>
    </div>
  )
}
