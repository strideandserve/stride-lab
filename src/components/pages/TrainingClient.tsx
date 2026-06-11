'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { TrainingPlan, PlannedRun, Shoe, Run, RunType } from '@/lib/types'
import { RUN_TYPE_LABELS, RUN_TYPE_COLORS, DAY_LABELS, catLabel, CAT_COLORS } from '@/lib/utils'
import Modal from '@/components/Modal'
import { FormGroup, FormLabel, FormInput, FormSelect, FormRow, FormActions, Btn } from '@/components/Form'
import { toast } from '@/components/Toast'
import BrandLogo from '@/components/BrandLogo'
import styles from './TrainingClient.module.css'

interface Props {
  plans: TrainingPlan[]
  plannedRuns: PlannedRun[]
  shoes: Shoe[]
  runs: Run[]
}

const RUN_TYPES: RunType[] = ['recovery','recovery_strides','gen_aerobic','med_long','lt_run','tempo','long_run','speed_intervals']
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function TrainingClient({ plans, plannedRuns, shoes, runs }: Props) {
  const router   = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const refresh  = () => startTransition(() => router.refresh())

  const activePlan = plans.find(p => p.active) ?? plans[0] ?? null
  const [selectedPlanId, setSelectedPlanId] = useState(activePlan?.id ?? '')
  const [viewWeek, setViewWeek] = useState<number>(1)

  // Plan modal
  const [planModal, setPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null)
  const [planName, setPlanName]   = useState('')
  const [planGoal, setPlanGoal]   = useState('')
  const [planStart, setPlanStart] = useState('')
  const [planWeeks, setPlanWeeks] = useState('18')
  const [savingPlan, setSavingPlan] = useState(false)

  // Planned run modal
  const [runModal, setRunModal]   = useState(false)
  const [editingPR, setEditingPR] = useState<PlannedRun | null>(null)
  const [prWeek, setPrWeek]       = useState(1)
  const [prDay, setPrDay]         = useState(0)
  const [prDate, setPrDate]       = useState('')
  const [prType, setPrType]       = useState<RunType>('gen_aerobic')
  const [prMiles, setPrMiles]     = useState('')
  const [prShoe, setPrShoe]       = useState('')
  const [prNotes, setPrNotes]     = useState('')
  const [savingRun, setSavingRun] = useState(false)

  // Log run modal (for marking planned run as completed)
  const [logModal, setLogModal]   = useState(false)
  const [logPR, setLogPR]         = useState<PlannedRun | null>(null)
  const [logMiles, setLogMiles]   = useState('')
  const [logPace, setLogPace]     = useState('')
  const [logHr, setLogHr]         = useState('')
  const [logComfort, setLogComfort] = useState(7.5)
  const [logNotes, setLogNotes]   = useState('')
  const [savingLog, setSavingLog] = useState(false)

  const currentPlan = plans.find(p => p.id === selectedPlanId) ?? activePlan

  // Get planned runs for current plan
  const planRuns = plannedRuns.filter(r => r.plan_id === currentPlan?.id)

  // Current week based on plan start date
  const today = new Date(); today.setHours(0,0,0,0)
  function getCurrentWeek(plan: TrainingPlan) {
    const start = new Date(plan.start_date + 'T00:00:00')
    const diff  = Math.floor((today.getTime() - start.getTime()) / (7 * 864e5))
    return Math.max(1, Math.min(plan.weeks, diff + 1))
  }

  // Set viewWeek to current when plan changes
  function selectPlan(id: string) {
    setSelectedPlanId(id)
    const p = plans.find(x => x.id === id)
    if (p) setViewWeek(getCurrentWeek(p))
  }

  // Runs for the viewed week
  const weekRuns = planRuns.filter(r => r.week_number === viewWeek)
    .sort((a, b) => a.day_of_week - b.day_of_week)

  // Week stats
  const weekTotal    = weekRuns.reduce((a, r) => a + r.planned_miles, 0)
  const weekLogged   = weekRuns.filter(r => r.logged_run_id).length
  const weekMiLogged = weekRuns.filter(r => r.logged_run_id)
    .reduce((a, r) => {
      const actual = runs.find(x => x.id === r.logged_run_id)
      return a + (actual?.miles ?? r.planned_miles)
    }, 0)

  // ── PLAN CRUD
  function openAddPlan() {
    setEditingPlan(null); setPlanName(''); setPlanGoal('')
    setPlanStart(today.toISOString().split('T')[0]); setPlanWeeks('18')
    setPlanModal(true)
  }
  function openEditPlan(p: TrainingPlan) {
    setEditingPlan(p); setPlanName(p.name); setPlanGoal(p.goal??'')
    setPlanStart(p.start_date); setPlanWeeks(String(p.weeks))
    setPlanModal(true)
  }
  async function savePlan() {
    if (!planName.trim()) return toast('Enter a plan name','error')
    if (!planStart)       return toast('Set a start date','error')
    setSavingPlan(true)
    const { data:{ session } } = await supabase.auth.getSession()
    const data = { name:planName.trim(), goal:planGoal.trim()||null, start_date:planStart, weeks:parseInt(planWeeks)||18, active:true }
    if (editingPlan) {
      await supabase.from('training_plans').update(data).eq('id', editingPlan.id)
      toast('Plan updated')
    } else {
      // Deactivate other plans
      await supabase.from('training_plans').update({ active:false }).eq('user_id', session!.user.id)
      const { data: newPlan } = await supabase.from('training_plans').insert({ ...data, user_id:session!.user.id }).select('id').single()
      if (newPlan) { setSelectedPlanId(newPlan.id); setViewWeek(1) }
      toast(`${planName} created`)
    }
    setSavingPlan(false); setPlanModal(false); refresh()
  }
  async function deletePlan(id: string) {
    if (!confirm('Delete this plan and all its planned runs?')) return
    await supabase.from('planned_runs').delete().eq('plan_id', id)
    await supabase.from('training_plans').delete().eq('id', id)
    toast('Plan deleted'); refresh()
  }

  // ── PLANNED RUN CRUD
  function openAddRun(week: number, dayOfWeek: number, date: string) {
    setEditingPR(null); setPrWeek(week); setPrDay(dayOfWeek); setPrDate(date)
    setPrType('gen_aerobic'); setPrMiles(''); setPrShoe(''); setPrNotes('')
    setRunModal(true)
  }
  function openEditRun(pr: PlannedRun) {
    setEditingPR(pr); setPrWeek(pr.week_number); setPrDay(pr.day_of_week); setPrDate(pr.date)
    setPrType(pr.run_type); setPrMiles(String(pr.planned_miles)); setPrShoe(pr.shoe_id??''); setPrNotes(pr.notes??'')
    setRunModal(true)
  }
  async function savePlannedRun() {
    const mi = parseFloat(prMiles)
    if (!mi || mi <= 0) return toast('Enter planned miles','error')
    if (!currentPlan)   return toast('Select a plan first','error')
    setSavingRun(true)
    const { data:{ session } } = await supabase.auth.getSession()
    const data = { plan_id:currentPlan.id, week_number:prWeek, day_of_week:prDay, date:prDate,
      run_type:prType, planned_miles:mi, shoe_id:prShoe||null, notes:prNotes.trim()||null }
    if (editingPR) {
      await supabase.from('planned_runs').update(data).eq('id', editingPR.id)
      toast('Run updated')
    } else {
      await supabase.from('planned_runs').insert({ ...data, user_id:session!.user.id })
      toast('Run added to plan')
    }
    setSavingRun(false); setRunModal(false); refresh()
  }
  async function deletePlannedRun(id: string) {
    await supabase.from('planned_runs').delete().eq('id', id)
    toast('Run removed'); refresh()
  }

  // ── LOG COMPLETED RUN
  function openLogRun(pr: PlannedRun) {
    setLogPR(pr); setLogMiles(String(pr.planned_miles)); setLogPace('')
    setLogHr(''); setLogComfort(7.5); setLogNotes(''); setLogModal(true)
  }
  async function saveLoggedRun() {
    const mi = parseFloat(logMiles)
    if (!mi || !logPR) return toast('Enter miles','error')
    if (!logPR.shoe_id) return toast('No shoe assigned to this run','error')
    setSavingLog(true)
    const { data:{ session } } = await supabase.auth.getSession()
    const { data: newRun } = await supabase.from('runs').insert({
      user_id: session!.user.id, shoe_id: logPR.shoe_id,
      miles: mi, date: logPR.date, pace: logPace.trim()||null,
      hr: logHr ? parseInt(logHr) : null, comfort: logComfort, notes: logNotes.trim()||null,
    }).select('id').single()
    if (newRun) {
      await supabase.from('planned_runs').update({ logged_run_id: newRun.id }).eq('id', logPR.id)
    }
    toast(`${mi} mi logged`); setSavingLog(false); setLogModal(false); refresh()
  }
  async function unlogRun(pr: PlannedRun) {
    if (!confirm('Remove the logged run from this planned run?')) return
    if (pr.logged_run_id) await supabase.from('runs').delete().eq('id', pr.logged_run_id)
    await supabase.from('planned_runs').update({ logged_run_id: null }).eq('id', pr.id)
    toast('Run un-logged'); refresh()
  }

  // Build week dates
  function getWeekDates(plan: TrainingPlan, week: number) {
    const start = new Date(plan.start_date + 'T00:00:00')
    const weekStart = new Date(start.getTime() + (week - 1) * 7 * 864e5)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.getTime() + i * 864e5)
      return d.toISOString().split('T')[0]
    })
  }

  const weekDates = currentPlan ? getWeekDates(currentPlan, viewWeek) : []
  const isCurrentWeek = currentPlan ? viewWeek === getCurrentWeek(currentPlan) : false

  // Shoe forecast: planned miles per shoe
  function shoeForecasts() {
    return shoes.map(shoe => {
      const sr = runs.filter(r => r.shoe_id === shoe.id)
      const usedMi = (shoe.start_miles || 0) + sr.reduce((a, r) => a + (r.miles || 0), 0)
      const plannedMi = plannedRuns.filter(p => p.shoe_id === shoe.id && !p.logged_run_id)
        .reduce((a, p) => a + p.planned_miles, 0)
      const totalProjected = usedMi + plannedMi
      const maxMi = shoe.max_miles || 350
      const pct   = Math.min(100, totalProjected / maxMi * 100)
      const miLeft = Math.max(0, maxMi - totalProjected)
      return { shoe, usedMi, plannedMi, totalProjected, maxMi, pct, miLeft, danger: pct >= 85 }
    }).filter(f => f.usedMi > 0 || f.plannedMi > 0)
  }

  const forecasts = shoeForecasts()

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.title}>TRAINING<br/>PLAN</div>
        <div className={styles.headerActions}>
          {plans.length > 0 && (
            <select className={styles.planSelect} value={selectedPlanId} onChange={e => selectPlan(e.target.value)}>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}{p.active?' (Active)':''}</option>)}
            </select>
          )}
          <Btn variant="primary" onClick={openAddPlan}>+ New Plan</Btn>
        </div>
      </div>

      {!currentPlan ? (
        <div className={styles.empty}>
          <div>📋</div>
          <div>No Training Plan Yet</div>
          <div>Create your first plan to start scheduling runs</div>
          <Btn variant="primary" onClick={openAddPlan} style={{marginTop:16}}>Create Plan</Btn>
        </div>
      ) : (
        <>
          {/* PLAN INFO BAR */}
          <div className={styles.planBar}>
            <div className={styles.planBarLeft}>
              <div className={styles.planName}>{currentPlan.name}</div>
              {currentPlan.goal && <div className={styles.planGoal}>🎯 {currentPlan.goal}</div>}
              <div className={styles.planMeta}>
                {new Date(currentPlan.start_date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                {' · '}{currentPlan.weeks} weeks
                {isCurrentWeek && <span className={styles.currentWeekBadge}>Week {viewWeek} — This Week</span>}
              </div>
            </div>
            <div className={styles.planBarRight}>
              <button className={styles.editPlanBtn} onClick={()=>openEditPlan(currentPlan)}>EDIT</button>
              <button className={styles.delPlanBtn} onClick={()=>deletePlan(currentPlan.id)}>DELETE</button>
            </div>
          </div>

          {/* WEEK SELECTOR */}
          <div className={styles.weekNav}>
            <button className={styles.weekNavBtn} onClick={()=>setViewWeek(v=>Math.max(1,v-1))} disabled={viewWeek<=1}>←</button>
            <div className={styles.weekNavScroll}>
              {Array.from({length:currentPlan.weeks},(_,i)=>i+1).map(w => {
                const wRuns = planRuns.filter(r=>r.week_number===w)
                const wLogged = wRuns.filter(r=>r.logged_run_id).length
                const isCurrent = w === getCurrentWeek(currentPlan)
                return (
                  <button key={w}
                    className={`${styles.weekBtn} ${w===viewWeek?styles.weekBtnActive:''} ${isCurrent?styles.weekBtnCurrent:''}`}
                    onClick={()=>setViewWeek(w)}>
                    <span>W{w}</span>
                    {wRuns.length > 0 && (
                      <span className={styles.weekBtnDots}>
                        {wLogged}/{wRuns.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <button className={styles.weekNavBtn} onClick={()=>setViewWeek(v=>Math.min(currentPlan.weeks,v+1))} disabled={viewWeek>=currentPlan.weeks}>→</button>
          </div>

          {/* WEEK STATS */}
          <div className={styles.weekStats}>
            <div className={styles.weekStatItem}>
              <div className={styles.weekStatVal}>{weekLogged}/{weekRuns.length}</div>
              <div className={styles.weekStatLabel}>Runs Completed</div>
            </div>
            <div className={styles.weekStatItem}>
              <div className={styles.weekStatVal}>{weekMiLogged.toFixed(1)}/{weekTotal.toFixed(1)}</div>
              <div className={styles.weekStatLabel}>Miles Completed</div>
            </div>
            <div className={styles.weekStatItem}>
              <div className={styles.weekStatVal}>{planRuns.reduce((a,r)=>a+r.planned_miles,0).toFixed(0)}</div>
              <div className={styles.weekStatLabel}>Total Plan Miles</div>
            </div>
            <div className={styles.weekStatItem}>
              <div className={styles.weekStatVal}>{planRuns.filter(r=>r.logged_run_id).length}/{planRuns.length}</div>
              <div className={styles.weekStatLabel}>Plan Progress</div>
            </div>
          </div>

          {/* WEEK GRID — 7 day columns */}
          <div className={styles.weekGrid}>
            {weekDates.map((date, dayIdx) => {
              const dayRuns = weekRuns.filter(r => r.day_of_week === dayIdx)
              const isToday = date === today.toISOString().split('T')[0]
              const isPast  = new Date(date+'T00:00:00') < today
              return (
                <div key={date} className={`${styles.dayCol} ${isToday?styles.dayColToday:''} ${isPast&&!isToday?styles.dayColPast:''}`}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayName}>{DAY_LABELS[dayIdx]}</span>
                    <span className={styles.dayDate}>{new Date(date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                    {isToday && <span className={styles.todayDot}/>}
                  </div>

                  <div className={styles.dayRuns}>
                    {dayRuns.map(pr => {
                      const shoe      = shoes.find(s => s.id === pr.shoe_id)
                      const loggedRun = runs.find(r => r.id === pr.logged_run_id)
                      const isLogged  = !!pr.logged_run_id
                      const color     = RUN_TYPE_COLORS[pr.run_type] || '#39ff6a'
                      return (
                        <div key={pr.id} className={`${styles.plannedRun} ${isLogged?styles.plannedRunLogged:''} ${isPast&&!isLogged?styles.plannedRunUnlogged:''}`}
                          style={{borderLeftColor: color}}>
                          <div className={styles.prTop}>
                            <span className={styles.prType} style={{color}}>{RUN_TYPE_LABELS[pr.run_type]}</span>
                            <div className={styles.prActions}>
                              {!isLogged && <button className={styles.prLogBtn} onClick={()=>openLogRun(pr)} title="Log this run">✓</button>}
                              <button className={styles.prEditBtn} onClick={()=>openEditRun(pr)} title="Edit">✏</button>
                              <button className={styles.prDelBtn} onClick={()=>deletePlannedRun(pr.id)} title="Delete">✕</button>
                            </div>
                          </div>
                          <div className={styles.prMiles}>
                            {isLogged && loggedRun ? (
                              <span>{loggedRun.miles} <span style={{color:'var(--text-muted)',fontSize:9}}>/ {pr.planned_miles} mi</span></span>
                            ) : (
                              <span>{pr.planned_miles} mi</span>
                            )}
                          </div>
                          {shoe && (
                            <div className={styles.prShoe}>
                              <BrandLogo brand={shoe.brand} size={14}/>
                              <span>{shoe.name}</span>
                            </div>
                          )}
                          {isLogged ? (
                            <div className={styles.prLogged}>
                              ✓ Logged
                              <button className={styles.prUnlogBtn} onClick={()=>unlogRun(pr)}>undo</button>
                            </div>
                          ) : isPast ? (
                            <div className={styles.prUnloggedBadge}>Un-Logged</div>
                          ) : null}
                          {pr.notes && <div className={styles.prNotes}>{pr.notes}</div>}
                        </div>
                      )
                    })}

                    <button className={styles.addRunBtn} onClick={()=>openAddRun(viewWeek, dayIdx, date)}>
                      + Add Run
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* SHOE FORECAST */}
          {forecasts.length > 0 && (
            <>
              <div className={styles.sectionTitle} style={{marginTop:40}}>Shoe Forecast from Training Plan</div>
              <div className={styles.forecastGrid}>
                {forecasts.map(f => (
                  <div key={f.shoe.id} className={`${styles.forecastCard} ${f.danger?styles.forecastDanger:''}`}>
                    <div className={styles.forecastTop}>
                      <BrandLogo brand={f.shoe.brand} size={28}/>
                      <div className={styles.forecastName}>
                        <div>{f.shoe.brand} {f.shoe.name}</div>
                        <div className={styles.forecastCat} style={{color:CAT_COLORS[f.shoe.category]}}>{catLabel(f.shoe.category)}</div>
                      </div>
                    </div>
                    <div className={styles.forecastBar}>
                      {/* Used portion */}
                      <div className={styles.forecastBarUsed} style={{width:`${Math.min(100,(f.usedMi/f.maxMi)*100)}%`,background:f.danger?'var(--red)':CAT_COLORS[f.shoe.category]}}/>
                      {/* Planned portion */}
                      {f.plannedMi > 0 && (
                        <div className={styles.forecastBarPlanned} style={{
                          width:`${Math.min(100,(f.plannedMi/f.maxMi)*100)}%`,
                          background:(CAT_COLORS[f.shoe.category]||'#39ff6a')+'55'
                        }}/>
                      )}
                    </div>
                    <div className={styles.forecastStats}>
                      <span>{f.usedMi.toFixed(0)} used</span>
                      {f.plannedMi > 0 && <span style={{color:CAT_COLORS[f.shoe.category]}}>+{f.plannedMi.toFixed(0)} planned</span>}
                      <span>{f.miLeft.toFixed(0)} left after plan</span>
                    </div>
                    {f.danger && <div className={styles.forecastWarn}>⚠ Will need replacement</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* NEW / EDIT PLAN MODAL */}
      <Modal open={planModal} onClose={()=>setPlanModal(false)} title={editingPlan?'Edit Plan':'New Training Plan'}>
        <FormGroup><FormLabel>Plan Name</FormLabel><FormInput placeholder="e.g. Chicago Marathon Build" value={planName} onChange={e=>setPlanName(e.target.value)}/></FormGroup>
        <FormGroup><FormLabel>Goal (optional)</FormLabel><FormInput placeholder="e.g. Sub 2:50 at Chicago" value={planGoal} onChange={e=>setPlanGoal(e.target.value)}/></FormGroup>
        <FormRow>
          <FormGroup><FormLabel>Start Date</FormLabel><FormInput type="date" value={planStart} onChange={e=>setPlanStart(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Number of Weeks</FormLabel><FormInput type="number" placeholder="18" value={planWeeks} onChange={e=>setPlanWeeks(e.target.value)}/></FormGroup>
        </FormRow>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setPlanModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={savePlan} disabled={savingPlan}>{savingPlan?'Saving…':editingPlan?'Save Changes':'Create Plan'}</Btn>
        </FormActions>
      </Modal>

      {/* ADD / EDIT PLANNED RUN MODAL */}
      <Modal open={runModal} onClose={()=>setRunModal(false)} title={editingPR?'Edit Planned Run':'Add Planned Run'}>
        <div className={styles.modalSubLabel}>{DAY_NAMES[prDay]} · {prDate}</div>
        <FormGroup>
          <FormLabel>Run Type</FormLabel>
          <FormSelect value={prType} onChange={e=>setPrType(e.target.value as RunType)}>
            {RUN_TYPES.map(t=><option key={t} value={t}>{RUN_TYPE_LABELS[t]}</option>)}
          </FormSelect>
        </FormGroup>
        <FormRow>
          <FormGroup><FormLabel>Planned Miles</FormLabel><FormInput type="number" step="0.1" placeholder="6.0" value={prMiles} onChange={e=>setPrMiles(e.target.value)}/></FormGroup>
          <FormGroup>
            <FormLabel>Shoe</FormLabel>
            <FormSelect value={prShoe} onChange={e=>setPrShoe(e.target.value)}>
              <option value="">No shoe assigned</option>
              {shoes.map(s=><option key={s.id} value={s.id}>{s.brand} {s.name}</option>)}
            </FormSelect>
          </FormGroup>
        </FormRow>
        <FormGroup><FormLabel>Notes (optional)</FormLabel><FormInput placeholder="Easy effort, conversational pace" value={prNotes} onChange={e=>setPrNotes(e.target.value)}/></FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setRunModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={savePlannedRun} disabled={savingRun}>{savingRun?'Saving…':editingPR?'Save':'Add Run'}</Btn>
        </FormActions>
      </Modal>

      {/* LOG COMPLETED RUN MODAL */}
      <Modal open={logModal} onClose={()=>setLogModal(false)} title="Log Completed Run">
        {logPR && (
          <div className={styles.modalSubLabel}>
            {RUN_TYPE_LABELS[logPR.run_type]} · {logPR.date}
            {shoes.find(s=>s.id===logPR.shoe_id) && ` · ${shoes.find(s=>s.id===logPR.shoe_id)!.brand} ${shoes.find(s=>s.id===logPR.shoe_id)!.name}`}
          </div>
        )}
        <FormRow>
          <FormGroup><FormLabel>Actual Miles</FormLabel><FormInput type="number" step="0.01" value={logMiles} onChange={e=>setLogMiles(e.target.value)}/></FormGroup>
          <FormGroup><FormLabel>Avg Pace (min/mi)</FormLabel><FormInput type="text" placeholder="7:30" value={logPace} onChange={e=>setLogPace(e.target.value)}/></FormGroup>
        </FormRow>
        <FormGroup><FormLabel>Heart Rate (bpm)</FormLabel><FormInput type="number" placeholder="145" value={logHr} onChange={e=>setLogHr(e.target.value)}/></FormGroup>
        <FormGroup>
          <FormLabel>Shoe Comfort: <span style={{color:'var(--accent)'}}>{logComfort}</span> / 10</FormLabel>
          <input type="range" min="0.5" max="10" step="0.5" value={logComfort} onChange={e=>setLogComfort(parseFloat(e.target.value))} className={styles.slider}/>
        </FormGroup>
        <FormGroup><FormLabel>Notes (optional)</FormLabel><FormInput placeholder="How did it feel?" value={logNotes} onChange={e=>setLogNotes(e.target.value)}/></FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setLogModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveLoggedRun} disabled={savingLog}>{savingLog?'Saving…':'Log Run'}</Btn>
        </FormActions>
      </Modal>
    </div>
  )
}
