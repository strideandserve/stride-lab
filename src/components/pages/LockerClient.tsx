'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Shoe, Run, Category } from '@/lib/types'
import { computeCompositeScore, catLabel, CAT_COLORS, raceTypeLabel, derivePaceFromFinish, formatPaceInput } from '@/lib/utils'
import BrandLogo from '@/components/BrandLogo'
import Modal from '@/components/Modal'
import { FormGroup, FormLabel, FormInput, FormSelect, FormRow, FormActions, Btn } from '@/components/Form'
import { toast } from '@/components/Toast'
import styles from './LockerClient.module.css'

interface Props { shoes: Shoe[]; runs: Run[] }

const DEFAULT_MAX: Record<string,number> = { daily:350, speed:175, race:150 }

export default function LockerClient({ shoes: initShoes, runs: initRuns }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const refresh = () => startTransition(() => router.refresh())

  // ── Shoe modal state
  const [shoeModal, setShoeModal]   = useState(false)
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null)
  const [shoeName, setShoeName]     = useState('')
  const [shoeBrand, setShoeBrand]   = useState('')
  const [shoeCat, setShoeCat]       = useState<Category>('daily')
  const [shoeMax, setShoeMax]       = useState('350')
  const [shoeStart, setShoeStart]   = useState('0')
  const [shoeSize, setShoeSize]     = useState('')
  const [shoeWide, setShoeWide]     = useState('standard')
  const [shoePrice, setShoePrice]   = useState('')
  const [shoeRetired, setShoeRetired] = useState(false)
  const [savingShoe, setSavingShoe] = useState(false)

  // ── Run modal state
  const [runModal, setRunModal]     = useState(false)
  const [editingRun, setEditingRun] = useState<Run | null>(null)
  const [runShoe, setRunShoe]       = useState<Shoe | null>(null)
  const [runMiles, setRunMiles]     = useState('')
  const [runDate, setRunDate]       = useState('')
  const [runPace, setRunPace]       = useState('')
  const [runHr, setRunHr]           = useState('')
  const [runElev, setRunElev]       = useState('')
  const [runTemp, setRunTemp]       = useState('')
  const [runHumidity, setRunHumidity] = useState('')
  const [runLocation, setRunLocation] = useState('')
  const [runComfort, setRunComfort] = useState(7.5)
  const [runKneePain, setRunKneePain] = useState('')
  const [runFootPain, setRunFootPain] = useState('')
  const [runShinPain, setRunShinPain] = useState('')
  const [runNotes, setRunNotes]     = useState('')
  const [runIsRace, setRunIsRace]   = useState(false)
  const [runRaceName, setRunRaceName] = useState('')
  const [runRaceType, setRunRaceType] = useState('marathon')
  const [runFinishTime, setRunFinishTime] = useState('')
  const [pacePrev, setPacePrev]     = useState('')
  const [savingRun, setSavingRun]   = useState(false)

  // Open expanded runs
  const [openRuns, setOpenRuns]     = useState<Record<string,boolean>>({})

  // ── SHOE HELPERS
  function openAddShoe() {
    setEditingShoe(null); setShoeName(''); setShoeBrand(''); setShoeCat('daily')
    setShoeMax('350'); setShoeStart('0'); setShoeSize(''); setShoeWide('standard')
    setShoePrice(''); setShoeRetired(false)
    setShoeModal(true)
  }
  function openEditShoe(shoe: Shoe) {
    setEditingShoe(shoe); setShoeName(shoe.name); setShoeBrand(shoe.brand)
    setShoeCat(shoe.category); setShoeMax(String(shoe.max_miles)); setShoeStart(String(shoe.start_miles||0))
    setShoeSize(shoe.size ? String(shoe.size) : ''); setShoeWide(shoe.wide || 'standard')
    setShoePrice(shoe.price ? String(shoe.price) : ''); setShoeRetired(shoe.retired || false)
    setShoeModal(true)
  }
  async function saveShoe() {
    if (!shoeName.trim()) return toast('Enter a shoe name','error')
    setSavingShoe(true)
    const data = { name:shoeName.trim(), brand:shoeBrand.trim()||'Unknown', category:shoeCat,
      max_miles:parseFloat(shoeMax)||350, start_miles:parseFloat(shoeStart)||0,
      size:shoeSize?parseFloat(shoeSize):null, wide:shoeWide,
      price:shoePrice?parseFloat(shoePrice):null, retired:shoeRetired }
    if (editingShoe) {
      await supabase.from('shoes').update(data).eq('id',editingShoe.id)
      toast(`${shoeName} updated`)
    } else {
      const { data:{ session } } = await supabase.auth.getSession()
      await supabase.from('shoes').insert({ ...data, user_id:session!.user.id, added_date:new Date().toISOString().split('T')[0] })
      toast(`${shoeBrand} ${shoeName} added`)
    }
    setSavingShoe(false); setShoeModal(false); refresh()
  }
  async function deleteShoe(id: string) {
    if (!confirm('Delete this shoe and all its runs?')) return
    await supabase.from('runs').delete().eq('shoe_id',id)
    await supabase.from('shoes').delete().eq('id',id)
    toast('Shoe removed'); refresh()
  }

  // ── RUN HELPERS
  function openLogRun(shoe: Shoe) {
    setEditingRun(null); setRunShoe(shoe); setRunMiles(''); setRunDate(new Date().toISOString().split('T')[0])
    setRunPace(''); setRunHr(''); setRunElev(''); setRunTemp(''); setRunHumidity('')
    setRunLocation(''); setRunComfort(7.5); setRunKneePain(''); setRunFootPain(''); setRunShinPain('')
    setRunNotes(''); setRunIsRace(false)
    setRunRaceName(''); setRunRaceType('marathon'); setRunFinishTime(''); setPacePrev('')
    setRunModal(true)
  }
  function openEditRun(run: Run) {
    const shoe = initShoes.find(s=>s.id===run.shoe_id)||null
    setEditingRun(run); setRunShoe(shoe); setRunMiles(String(run.miles))
    setRunDate(run.date); setRunPace(run.pace||''); setRunHr(run.hr?String(run.hr):'')
    setRunElev(run.elevation?String(run.elevation):''); setRunTemp(run.temp?String(run.temp):'')
    setRunHumidity(run.humidity?String(run.humidity):''); setRunLocation(run.location||'')
    setRunComfort(run.comfort||7.5)
    setRunKneePain(run.knee_pain!=null?String(run.knee_pain):'')
    setRunFootPain(run.foot_pain!=null?String(run.foot_pain):'')
    setRunShinPain(run.shin_pain!=null?String(run.shin_pain):'')
    setRunNotes(run.notes||''); setRunIsRace(run.is_race||false)
    setRunRaceName(run.race_name||''); setRunRaceType(run.race_type||'marathon')
    setRunFinishTime(run.finish_time||'')
    if (run.finish_time && run.miles) {
      const p = derivePaceFromFinish(run.finish_time, run.miles)
      setPacePrev(p ? `→ ${p} / mile` : '')
    } else { setPacePrev('') }
    setRunModal(true)
  }
  function onFinishTimeChange(val: string) {
    setRunFinishTime(val)
    const mi = parseFloat(runMiles)
    if (val && mi) {
      const p = derivePaceFromFinish(val, mi)
      setPacePrev(p ? `→ ${p} / mile` : 'Enter distance to calculate pace')
    } else { setPacePrev('') }
  }
  async function saveRun() {
    const miles = parseFloat(runMiles)
    if (!miles||miles<=0) return toast('Enter a valid distance','error')
    if (!runDate) return toast('Pick a date','error')
    setSavingRun(true)
    const derivedPace = runFinishTime ? derivePaceFromFinish(runFinishTime, miles) : null
    const finalPace   = derivedPace || runPace.trim() || null
    const data = {
      shoe_id: runShoe!.id, miles, date: runDate,
      pace: finalPace, hr: runHr?parseInt(runHr):null, comfort: runComfort,
      elevation: runElev?parseFloat(runElev):null, temp: runTemp?parseFloat(runTemp):null,
      humidity: runHumidity?parseFloat(runHumidity):null, location: runLocation.trim()||null,
      knee_pain: runKneePain?parseFloat(runKneePain):null,
      foot_pain: runFootPain?parseFloat(runFootPain):null,
      shin_pain: runShinPain?parseFloat(runShinPain):null,
      notes: runNotes.trim()||null, finish_time: runFinishTime||null,
      is_race: runIsRace, race_name: runIsRace?runRaceName.trim()||null:null,
      race_type: runIsRace?runRaceType:null,
    }
    if (editingRun) {
      await supabase.from('runs').update(data).eq('id',editingRun.id)
      toast('Run updated')
    } else {
      const { data:{ session } } = await supabase.auth.getSession()
      await supabase.from('runs').insert({ ...data, user_id:session!.user.id })
      toast(`${miles} mi logged`)
    }
    setSavingRun(false); setRunModal(false); refresh()
  }
  async function deleteRun(id: string) {
    await supabase.from('runs').delete().eq('id',id)
    toast('Run removed'); refresh()
  }

  async function quickRetire(shoe: Shoe) {
    await supabase.from('shoes').update({ retired: !shoe.retired }).eq('id', shoe.id)
    toast(shoe.retired ? `${shoe.name} restored` : `${shoe.name} retired`); refresh()
  }

  function renderShoeCard(shoe: Shoe) {
    const runs     = initRuns.filter(r=>r.shoe_id===shoe.id)
    const totalMi  = (shoe.start_miles||0)+runs.reduce((a,r)=>a+(r.miles||0),0)
    const maxMi    = shoe.max_miles||400
    const pct      = Math.min(100,totalMi/maxMi*100)
    const danger   = pct>=85
    const score    = computeCompositeScore(runs)
    const sorted   = [...runs].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
    const firstRun = sorted[0]
    const firstDate = firstRun ? new Date(firstRun.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : null
    const expanded = openRuns[shoe.id]

    return (
      <div key={shoe.id} className={`${styles.card} ${shoe.retired ? styles.cardRetired : ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.cardAccent} style={{background: shoe.retired ? '#444' : CAT_COLORS[shoe.category]}}/>
          <div className={styles.cardTopRow}>
            <div>
              <div className={styles.cardName}>
                {shoe.name}
                {shoe.retired && <span className={styles.retiredBadge}>Retired</span>}
              </div>
              <div className={styles.cardBrand}>
                {shoe.brand} · {catLabel(shoe.category)}
                {shoe.size && <span className={styles.sizeBadge}>US {shoe.size}{shoe.wide==='wide'?' · Wide':''}</span>}
                {shoe.price && <span className={styles.sizeBadge}>${shoe.price}</span>}
              </div>
            </div>
            <BrandLogo brand={shoe.brand} size={34}/>
          </div>
          {firstDate && <div className={styles.firstDate}>📅 First run {firstDate}</div>}
          <div className={styles.stats}>
            <div className={styles.stat}><div className={styles.statVal}>{totalMi.toFixed(1)}</div><div className={styles.statLabel}>Miles</div></div>
            <div className={styles.stat}><div className={styles.statVal}>{runs.length}</div><div className={styles.statLabel}>Runs</div></div>
            <div className={styles.stat}><div className={styles.statVal}>{score??'—'}</div><div className={styles.statLabel}>Score</div></div>
            {shoe.price && totalMi > 0 && (
              <div className={styles.stat}>
                <div className={styles.statVal} style={{fontSize:18}}>${(shoe.price/totalMi).toFixed(2)}</div>
                <div className={styles.statLabel}>Cost/Mile</div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.progLabel}>
            <span>{totalMi.toFixed(1)} mi used</span>
            <span>{shoe.retired ? 'Retired' : danger ? '⚠ Near limit' : `${(maxMi-totalMi).toFixed(1)} mi left`}</span>
          </div>
          <div className={styles.progTrack}>
            <div className={styles.progFill} style={{width:`${pct}%`,background:shoe.retired?'#555':danger?'var(--red)':CAT_COLORS[shoe.category]}}/>
          </div>
          <div className={styles.actions}>
            {!shoe.retired && <Btn variant="accent" onClick={()=>openLogRun(shoe)}>+ Log Run</Btn>}
            <Btn variant="ghost" onClick={()=>setOpenRuns(p=>({...p,[shoe.id]:!p[shoe.id]}))}>Runs ({runs.length})</Btn>
            <Btn variant="ghost" onClick={()=>openEditShoe(shoe)}>Edit</Btn>
            <Btn variant="ghost" onClick={()=>quickRetire(shoe)} style={{color: shoe.retired ? 'var(--accent)' : 'var(--warn)'}}>
              {shoe.retired ? 'Restore' : 'Retire'}
            </Btn>
            <Btn variant="danger" onClick={()=>deleteShoe(shoe.id)}>Delete</Btn>
          </div>
          {expanded && (
            <div className={styles.runsList}>
              {runs.length===0 ? (
                <div className={styles.noRuns}>No runs logged yet</div>
              ) : [...runs].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(r => (
                <div key={r.id} className={styles.runItem}>
                  <div className={styles.runRow}>
                    <span className={styles.runDate}>{r.date}</span>
                    <span>{r.miles} mi</span>
                    <span>{r.pace?`${r.pace}/mi`:'—'} · {r.hr?`${r.hr} bpm`:'—'}</span>
                    <span style={{color:'var(--accent)'}}>{r.comfort}/10</span>
                    <span style={{display:'flex',gap:6}}>
                      <button className={styles.runEditBtn} onClick={()=>openEditRun(r)}>EDIT</button>
                      <button className={styles.runDelBtn} onClick={()=>deleteRun(r.id)}>✕</button>
                    </span>
                  </div>
                  {r.elevation!=null||r.temp!=null||r.knee_pain!=null||r.foot_pain!=null||r.shin_pain!=null ? (
                    <div className={styles.runExtra}>
                      {r.elevation!=null&&<span>↑{r.elevation}ft</span>}
                      {r.temp!=null&&<span>{r.temp}°F</span>}
                      {r.humidity!=null&&<span>{r.humidity}%</span>}
                      {r.location&&<span>📍{r.location}</span>}
                      {r.knee_pain!=null&&<span style={{color: r.knee_pain>0?'var(--red)':'var(--text-dim)'}}>🦵 Knee {r.knee_pain}/10</span>}
                      {r.foot_pain!=null&&<span style={{color: r.foot_pain>0?'var(--red)':'var(--text-dim)'}}>🦶 Foot {r.foot_pain}/10</span>}
                      {r.shin_pain!=null&&<span style={{color: r.shin_pain>0?'var(--red)':'var(--text-dim)'}}>🩹 Shin {r.shin_pain}/10</span>}
                    </div>
                  ):null}
                  {r.is_race&&<div className={styles.raceBadge}>🏁 {r.race_name||'Race'} · {raceTypeLabel(r.race_type)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>SHOE<br/>LOCKER</div>
        <Btn variant="primary" onClick={openAddShoe}>+ Add Shoe</Btn>
      </div>

      {initShoes.length===0 ? (
        <div className={styles.empty}><div>👟</div><div>Locker is Empty</div><div>Add your first pair to start tracking</div></div>
      ) : (
        <>
          <div className={styles.grid}>
            {initShoes.filter(s=>!s.retired).map(shoe => renderShoeCard(shoe))}
          </div>
          {initShoes.some(s=>s.retired) && (
            <>
              <div className={styles.retiredHeader}>
                <div className={styles.retiredTitle}>🪦 Retired Shoes</div>
                <div className={styles.retiredSub}>Run history preserved · not counted in active forecasts</div>
              </div>
              <div className={styles.grid}>
                {initShoes.filter(s=>s.retired).map(shoe => renderShoeCard(shoe))}
              </div>
            </>
          )}
        </>
      )}

      {/* ADD / EDIT SHOE MODAL */}
      <Modal open={shoeModal} onClose={()=>setShoeModal(false)} title={editingShoe?'Edit Shoe':'Add New Shoe'}>
        <FormGroup><FormLabel>Shoe Name / Model</FormLabel><FormInput placeholder="e.g. Alphafly 3" value={shoeName} onChange={e=>setShoeName(e.target.value)}/></FormGroup>
        <FormGroup><FormLabel>Brand</FormLabel><FormInput placeholder="e.g. Nike" value={shoeBrand} onChange={e=>setShoeBrand(e.target.value)}/></FormGroup>
        <FormGroup>
          <FormLabel>Category</FormLabel>
          <div className={styles.catGrid}>
            {(['daily','speed','race'] as Category[]).map(c=>(
              <div key={c} className={`${styles.catOpt} ${shoeCat===c?styles[`cat${c}`]:''}`} onClick={()=>{setShoeCat(c);if(!shoeMax||shoeMax===String(DEFAULT_MAX[shoeCat]))setShoeMax(String(DEFAULT_MAX[c]))}}>
                <div>{c==='daily'?'🏃':c==='speed'?'⚡':'🏆'}</div>
                <div className={styles.catLabel}>{catLabel(c)}</div>
              </div>
            ))}
          </div>
        </FormGroup>
        <FormRow>
          <FormGroup><FormLabel>Max Mileage</FormLabel><FormInput type="number" placeholder="350" value={shoeMax} onChange={e=>setShoeMax(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Starting Miles</FormLabel><FormInput type="number" placeholder="0" value={shoeStart} onChange={e=>setShoeStart(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Shoe Size (US)</FormLabel><FormInput type="number" step="0.5" placeholder="10.5" value={shoeSize} onChange={e=>setShoeSize(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Fit</FormLabel><FormSelect value={shoeWide} onChange={e=>setShoeWide(e.target.value)}><option value="standard">Standard</option><option value="wide">Wide</option></FormSelect></FormGroup>
        </FormRow>
        <FormGroup><FormLabel>Price Paid ($)</FormLabel><FormInput type="number" step="0.01" placeholder="160.00" value={shoePrice} onChange={e=>setShoePrice(e.target.value)}/></FormGroup>
        <div className={styles.retireToggleRow} onClick={()=>setShoeRetired(!shoeRetired)}>
          <div className={`${styles.retireToggleBox} ${shoeRetired?styles.retireToggleOn:''}`}>✓</div>
          <div className={styles.retireToggleLabel}>This shoe is retired — hide from active locker &amp; home page</div>
        </div>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setShoeModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveShoe} disabled={savingShoe}>{savingShoe?'Saving…':editingShoe?'Save Changes':'Add Shoe'}</Btn>
        </FormActions>
      </Modal>

      {/* LOG / EDIT RUN MODAL */}
      <Modal open={runModal} onClose={()=>setRunModal(false)} title={editingRun?'Edit Run':'Log a Run'}>
        {runShoe && <div className={styles.runShoeLabel}>{runShoe.brand.toUpperCase()} {runShoe.name.toUpperCase()}</div>}
        <FormRow>
          <FormGroup><FormLabel>Distance (miles)</FormLabel><FormInput type="number" step="0.01" placeholder="6.2" value={runMiles} onChange={e=>{setRunMiles(e.target.value);if(runFinishTime){const p=derivePaceFromFinish(runFinishTime,parseFloat(e.target.value));setPacePrev(p?`→ ${p} / mile`:'')}}} /></FormGroup>
          <FormGroup><FormLabel>Date</FormLabel><FormInput type="date" value={runDate} onChange={e=>setRunDate(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Avg Pace (min/mi)</FormLabel><FormInput type="text" inputMode="numeric" placeholder="7:30" value={runPace} onChange={e=>setRunPace(formatPaceInput(e.target.value))}/></FormGroup>
          <FormGroup><FormLabel>Heart Rate (bpm)</FormLabel><FormInput type="number" placeholder="155" value={runHr} onChange={e=>setRunHr(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Elevation Gain (ft)</FormLabel><FormInput type="number" placeholder="320" value={runElev} onChange={e=>setRunElev(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Temperature (°F)</FormLabel><FormInput type="number" placeholder="68" value={runTemp} onChange={e=>setRunTemp(e.target.value)}/></FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup><FormLabel>Humidity (%)</FormLabel><FormInput type="number" placeholder="55" value={runHumidity} onChange={e=>setRunHumidity(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Location</FormLabel><FormInput placeholder="Lakefront Trail" value={runLocation} onChange={e=>setRunLocation(e.target.value)}/></FormGroup>
        </FormRow>
        <FormGroup>
          <FormLabel>Shoe Comfort: <span style={{color:'var(--accent)'}}>{runComfort}</span> / 10</FormLabel>
          <input type="range" min="0.5" max="10" step="0.5" value={runComfort} onChange={e=>setRunComfort(parseFloat(e.target.value))} className={styles.slider}/>
        </FormGroup>

        {/* OPTIONAL PAIN TRACKING */}
        <div className={styles.painSection}>
          <div className={styles.painHeader}>How did your body feel? <span>(optional)</span></div>
          <div className={styles.painGrid}>
            <FormGroup><FormLabel>Knee Pain (0-10)</FormLabel><FormInput type="number" min="0" max="10" step="1" placeholder="—" value={runKneePain} onChange={e=>setRunKneePain(e.target.value)}/></FormGroup>
            <FormGroup><FormLabel>Foot Pain (0-10)</FormLabel><FormInput type="number" min="0" max="10" step="1" placeholder="—" value={runFootPain} onChange={e=>setRunFootPain(e.target.value)}/></FormGroup>
            <FormGroup><FormLabel>Shin Pain (0-10)</FormLabel><FormInput type="number" min="0" max="10" step="1" placeholder="—" value={runShinPain} onChange={e=>setRunShinPain(e.target.value)}/></FormGroup>
          </div>
        </div>
        {runShoe?.category==='race' && (
          <div className={styles.raceSection}>
            <div className={`${styles.raceCheckRow} ${runIsRace?styles.raceChecked:''}`} onClick={()=>setRunIsRace(!runIsRace)}>
              <div className={`${styles.raceCheckBox} ${runIsRace?styles.raceCheckBoxOn:''}`}>✓</div>
              <div className={styles.raceCheckLabel}>Yes — this was a race</div>
            </div>
            {runIsRace && (
              <div className={styles.racePanel}>
                <FormGroup><FormLabel>Race Name</FormLabel><FormInput placeholder="e.g. Chicago Marathon 2025" value={runRaceName} onChange={e=>setRunRaceName(e.target.value)}/></FormGroup>
                <FormGroup><FormLabel>Race Type</FormLabel>
                  <FormSelect value={runRaceType} onChange={e=>setRunRaceType(e.target.value)}>
                    <option value="marathon">Marathon (26.2 mi)</option>
                    <option value="half">Half Marathon (13.1 mi)</option>
                    <option value="ten_k">10K</option>
                    <option value="five_k">5K</option>
                    <option value="other">Other</option>
                  </FormSelect>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Finish Time <span style={{color:'var(--text-dim)',fontSize:9}}>H:MM:SS — auto-calculates pace</span></FormLabel>
                  <FormInput type="text" placeholder="2:58:30" value={runFinishTime} onChange={e=>onFinishTimeChange(e.target.value)}/>
                  {pacePrev && <div className={styles.pacePrev}>{pacePrev}</div>}
                </FormGroup>
              </div>
            )}
          </div>
        )}
        <FormGroup><FormLabel>Notes (optional)</FormLabel><FormInput placeholder="Felt great, legs were fresh…" value={runNotes} onChange={e=>setRunNotes(e.target.value)}/></FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setRunModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveRun} disabled={savingRun}>{savingRun?'Saving…':editingRun?'Save Changes':'Log Run'}</Btn>
        </FormActions>
      </Modal>
    </div>
  )
}
