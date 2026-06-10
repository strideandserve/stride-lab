'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Shoe, Run } from '@/lib/types'
import { paceToSeconds, paceToFinishTime, raceTypeLabel, derivePaceFromFinish, CAT_COLORS } from '@/lib/utils'
import Modal from '@/components/Modal'
import { FormGroup, FormLabel, FormInput, FormSelect, FormRow, FormActions, Btn } from '@/components/Form'
import { toast } from '@/components/Toast'
import styles from './RacesClient.module.css'

interface Props { shoes: Shoe[]; races: Run[] }

export default function RacesClient({ shoes, races }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const [editModal, setEditModal] = useState(false)
  const [editRun, setEditRun]     = useState<Run|null>(null)
  const [runMiles, setRunMiles]   = useState('')
  const [runDate, setRunDate]     = useState('')
  const [runPace, setRunPace]     = useState('')
  const [runHr, setRunHr]         = useState('')
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

  function openEdit(r: Run) {
    setEditRun(r); setRunMiles(String(r.miles)); setRunDate(r.date)
    setRunPace(r.pace||''); setRunHr(r.hr?String(r.hr):'')
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

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>RACE<br/>LOG</div>

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
                    <div className={styles.raceName}>{r.race_name||'Unnamed Race'}{isPR&&<span className={styles.prTag}>★ PR</span>}</div>
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

      {/* EDIT MODAL */}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title="Edit Race">
        <FormRow>
          <FormGroup><FormLabel>Distance</FormLabel><FormInput type="number" step="0.01" value={runMiles} onChange={e=>setRunMiles(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Date</FormLabel><FormInput type="date" value={runDate} onChange={e=>setRunDate(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Pace (min/mi)</FormLabel><FormInput type="text" placeholder="7:30" value={runPace} onChange={e=>setRunPace(e.target.value)}/></FormGroup>
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
          <FormInput type="text" placeholder="2:58:30" value={runFinish} onChange={e=>{setRunFinish(e.target.value);const p=derivePaceFromFinish(e.target.value,parseFloat(runMiles));setPacePrev(p?`→ ${p} / mile`:'')} }/>
          {pacePrev&&<div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--accent)',marginTop:6}}>{pacePrev}</div>}
        </FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setEditModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveEdit} disabled={saving}>{saving?'Saving…':'Save Changes'}</Btn>
        </FormActions>
      </Modal>
    </div>
  )
}
