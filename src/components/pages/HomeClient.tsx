'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Shoe, Run, UpcomingRace, TrainingPlan, PlannedRun } from '@/lib/types'
import { computeCompositeScore, catLabel, CAT_COLORS, raceTypeLabel, RUN_TYPE_LABELS, RUN_TYPE_COLORS, getRaceLogoUrl, getMonday, formatTimeInput } from '@/lib/utils'
import BrandLogo from '@/components/BrandLogo'
import Modal from '@/components/Modal'
import { FormGroup, FormLabel, FormInput, FormSelect, FormRow, FormActions, Btn } from '@/components/Form'
import { toast } from '@/components/Toast'
import styles from './HomeClient.module.css'

interface Props {
  shoes: Shoe[]
  runs: Run[]
  userName: string
  upcomingRaces: UpcomingRace[]
  activePlan: TrainingPlan | null
  plannedRuns: PlannedRun[]
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SHOE_COLORS = ['#39ff6a','#ff6b35','#a8ff3e','#47c8ff','#ff47a0','#ffcc00','#b347ff','#ff4747']

function getMonthKey(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${MONTHS[parseInt(m)-1]} '${y.slice(2)}`
}
function getAllMonths(runs: Run[]) {
  const keys = runs.filter(r=>r.date).map(r=>getMonthKey(r.date))
  const unique = Array.from(new Set(keys))
  return unique.sort()
}

function predictReplacement(shoe: Shoe, runs: Run[]) {
  if (shoe.category !== 'daily') return null
  const totalMi = (shoe.start_miles||0) + runs.reduce((a,r)=>a+(r.miles||0),0)
  const maxMi   = shoe.max_miles || 350
  const miLeft  = maxMi - totalMi
  if (miLeft <= 0) return { overdue: true, shoe, totalMi, maxMi }
  const sorted = [...runs].filter(r=>r.date).sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
  if (!sorted.length) return null
  const start = new Date(sorted[0].date + 'T00:00:00')
  const daysElapsed = Math.max(1,(Date.now()-start.getTime())/(1000*60*60*24))
  const mi = runs.reduce((a,r)=>a+(r.miles||0),0)
  const daily = mi/daysElapsed
  if (daily<=0) return null
  const daysLeft = Math.round(miLeft/daily)
  const dt = new Date(Date.now()+daysLeft*864e5)
  return { overdue:false, shoe, totalMi, maxMi, miLeft:miLeft.toFixed(1), daily:daily.toFixed(2), daysLeft, dateStr:dt.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) }
}

export default function HomeClient({ shoes, runs, userName, upcomingRaces: initRaces, activePlan, plannedRuns }: Props) {
  const router     = useRouter()
  const supabase   = createClient()
  const [, startTransition] = useTransition()
  const refresh    = () => startTransition(() => router.refresh())

  // Race modal state
  const [raceModal, setRaceModal]     = useState(false)
  const [editingRace, setEditingRace] = useState<UpcomingRace | null>(null)
  const [raceName, setRaceName]       = useState('')
  const [raceDate, setRaceDate]       = useState('')
  const [raceType, setRaceType]       = useState('marathon')
  const [raceLocation, setRaceLocation] = useState('')
  const [raceGoal, setRaceGoal]       = useState('')
  const [savingRace, setSavingRace]   = useState(false)
  const allMonths = getAllMonths(runs)
  const [activeMonth, setActiveMonth] = useState(() => allMonths[allMonths.length-1] ?? null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const barCanvasRef = useRef<HTMLCanvasElement>(null)

  const totalMiles = runs.reduce((a,r)=>a+(r.miles||0),0)

  // Filter out retired shoes everywhere on home page
  const activeShoes = shoes.filter(s => !s.retired)
  const oneYearAgo  = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const recentShoes = activeShoes.filter(s =>
    runs.some(r => r.shoe_id === s.id && r.date && new Date(r.date + 'T00:00:00') >= oneYearAgo)
  )

  // ── RACE CRUD
  function openAddRace() {
    setEditingRace(null); setRaceName(''); setRaceDate(''); setRaceType('marathon')
    setRaceLocation(''); setRaceGoal(''); setRaceModal(true)
  }
  function openEditRace(r: UpcomingRace) {
    setEditingRace(r); setRaceName(r.name); setRaceDate(r.date); setRaceType(r.type||'marathon')
    setRaceLocation(r.location||''); setRaceGoal(r.goal_time||''); setRaceModal(true)
  }
  async function saveRace() {
    if (!raceName.trim()) return toast('Enter a race name','error')
    if (!raceDate)        return toast('Pick a date','error')
    setSavingRace(true)
    const { data:{ session } } = await supabase.auth.getSession()
    const data = { name:raceName.trim(), date:raceDate, type:raceType, location:raceLocation.trim()||null, goal_time:raceGoal.trim()||null }
    if (editingRace) {
      await supabase.from('upcoming_races').update(data).eq('id', editingRace.id)
      toast('Race updated')
    } else {
      await supabase.from('upcoming_races').insert({ ...data, user_id:session!.user.id })
      toast(`${raceName} added`)
    }
    setSavingRace(false); setRaceModal(false); refresh()
  }
  async function deleteRace(id: string) {
    await supabase.from('upcoming_races').delete().eq('id', id)
    toast('Race removed'); refresh()
  }

  function daysUntil(dateStr: string) {
    const today = new Date(); today.setHours(0,0,0,0)
    const d     = new Date(dateStr + 'T00:00:00')
    return Math.ceil((d.getTime() - today.getTime()) / 86400000)
  }

  // ── SPENDING CALCULATIONS
  const now        = new Date()
  const today      = new Date(); today.setHours(0,0,0,0)
  const dayName    = today.toLocaleDateString('en-US', { weekday: 'long' })
  const yearStart  = new Date(now.getFullYear(), 0, 1)
  const yearEnd    = new Date(now.getFullYear(), 11, 31)
  const daysInYear = 365
  const dayOfYear  = Math.floor((now.getTime() - yearStart.getTime()) / 86400000) + 1
  const daysLeft   = daysInYear - dayOfYear

  // Shoes purchased this year (use added_date as proxy)
  const shoesThisYear = shoes.filter(s => s.added_date && new Date(s.added_date).getFullYear() === now.getFullYear())
  const totalSpentThisYear = shoesThisYear.reduce((a, s) => a + (s.price || 0), 0)
  const spentByCategory = {
    daily: shoesThisYear.filter(s=>s.category==='daily').reduce((a,s)=>a+(s.price||0),0),
    speed: shoesThisYear.filter(s=>s.category==='speed').reduce((a,s)=>a+(s.price||0),0),
    race:  shoesThisYear.filter(s=>s.category==='race').reduce((a,s)=>a+(s.price||0),0),
  }
  const countByCategory = {
    daily: shoesThisYear.filter(s=>s.category==='daily').length,
    speed: shoesThisYear.filter(s=>s.category==='speed').length,
    race:  shoesThisYear.filter(s=>s.category==='race').length,
  }

  // Average daily miles per category this year
  const runsThisYear = runs.filter(r => r.date && new Date(r.date).getFullYear() === now.getFullYear())
  function avgDailyMilesByCat(cat: string) {
    const catShoeIds = shoes.filter(s=>s.category===cat).map(s=>s.id)
    const mi = runsThisYear.filter(r=>catShoeIds.includes(r.shoe_id)).reduce((a,r)=>a+(r.miles||0),0)
    return mi / Math.max(dayOfYear, 1)
  }

  // Projection: how many MORE WHOLE shoes you'll need to buy this year × avg price per shoe.
  // Rather than prorating a fraction of a shoe's price (which produces unrealistic
  // numbers like "$84 toward a daily trainer"), round up to the next whole shoe —
  // if you're going to wear one out, you'll buy a full replacement at the going rate.
  function projectSpend(cat: string): { total: number; count: number } {
    const catShoes     = shoes.filter(s=>s.category===cat)
    if (!catShoes.length) return { total: 0, count: 0 }
    const avgMax       = catShoes.reduce((a,s)=>a+s.max_miles,0) / catShoes.length
    const pricedShoes  = catShoes.filter(s=>s.price)
    const avgPrice     = pricedShoes.length ? pricedShoes.reduce((a,s)=>a+(s.price||0),0) / pricedShoes.length : 0
    if (!avgPrice) return { total: 0, count: 0 }
    const milesLeft    = avgDailyMilesByCat(cat) * daysLeft
    const shoesNeeded  = Math.ceil(milesLeft / avgMax)
    return { total: shoesNeeded * avgPrice, count: shoesNeeded }
  }

  const projDailyData = projectSpend('daily')
  const projSpeedData = projectSpend('speed')
  const projRaceData  = projectSpend('race')
  const projDaily = projDailyData.total
  const projSpeed = projSpeedData.total
  const projRace  = projRaceData.total
  const totalProj = projDaily + projSpeed + projRace

  // ── TRAINING PLAN WIDGET
  function getCurrentWeekNum(plan: TrainingPlan) {
    const now2 = new Date(); now2.setHours(0,0,0,0)
    const todayMonday = getMonday(now2.toISOString().split('T')[0])
    const startMonday = getMonday(plan.start_date)
    const diff = Math.floor((todayMonday.getTime() - startMonday.getTime()) / (7 * 864e5))
    return Math.max(1, Math.min(plan.weeks, diff + 1))
  }

  const currentWeekNum   = activePlan ? getCurrentWeekNum(activePlan) : null
  const thisWeekRuns     = activePlan && currentWeekNum
    ? plannedRuns.filter(r => r.plan_id === activePlan.id && r.week_number === currentWeekNum)
    : []
  const thisWeekLogged   = thisWeekRuns.filter(r => r.logged_run_id).length
  const thisWeekTotal    = thisWeekRuns.length
  const thisWeekMiPlan   = thisWeekRuns.reduce((a, r) => a + r.planned_miles, 0)
  const thisWeekMiLogged = thisWeekRuns.filter(r => r.logged_run_id).reduce((a, r) => {
    const actual = runs.find(x => x.id === r.logged_run_id)
    return a + (actual?.miles ?? r.planned_miles)
  }, 0)

  // Next unlogged run from today forward
  const todayStr    = today.toISOString().split('T')[0]
  const nextWorkout = activePlan
    ? plannedRuns.filter(r => r.plan_id === activePlan.id && !r.logged_run_id && r.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    : null
  const nextShoe = nextWorkout?.shoe_id ? shoes.find(s => s.id === nextWorkout.shoe_id) : null

  // Next upcoming race (soonest future date)
  const nextRace = [...initRaces]
    .filter(r => r.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null

  // Best by category
  function bestShoe(cat: string) {
    const scored = activeShoes.filter(s=>s.category===cat).map(s=>({
      s, score: computeCompositeScore(runs.filter(r=>r.shoe_id===s.id), plannedRuns)
    })).filter(x=>x.score!==null).sort((a,b)=>(b.score!-a.score!))
    return scored[0] ?? null
  }

  // Most recent shoe — only from active (non-retired) shoes
  const latestRun  = [...runs].filter(r=>r.date&&r.shoe_id&&activeShoes.some(s=>s.id===r.shoe_id)).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())[0]
  const recentShoe = latestRun ? activeShoes.find(s=>s.id===latestRun.shoe_id) : null

  // Predictions — only active daily shoes
  const preds   = activeShoes.filter(s=>s.category==='daily').map(s=>predictReplacement(s,runs.filter(r=>r.shoe_id===s.id))).filter(Boolean) as ReturnType<typeof predictReplacement>[]
  const overdue  = preds.filter(p=>p?.overdue)
  const upcoming = preds.filter(p=>!p?.overdue).sort((a,b)=>(a!.daysLeft??0)-(b!.daysLeft??0))

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !activeMonth) return
    const [y,mo] = activeMonth.split('-').map(Number)
    const days = new Date(y,mo,0).getDate()
    const activeShoes = shoes.filter(s=>runs.some(r=>r.shoe_id===s.id&&r.date&&getMonthKey(r.date)===activeMonth))
    if (!activeShoes.length) return

    const dpr = window.devicePixelRatio||1
    const W   = canvas.parentElement!.clientWidth - 32
    const H   = 260
    canvas.width  = W*dpr; canvas.height = H*dpr
    canvas.style.width = W+'px'; canvas.style.height = H+'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr,dpr)
    ctx.clearRect(0,0,W,H)

    const padL=48,padR=20,padT=28,padB=32
    const cW=W-padL-padR, cH=H-padT-padB

    const today = new Date()
    const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === mo
    // Only plot up to today if current month, otherwise plot full month
    const lastDay = isCurrentMonth ? today.getDate() : days
    const todayIdx = isCurrentMonth ? today.getDate() - 1 : -1

    const datasets = activeShoes.map((shoe,idx)=>{
      const color = SHOE_COLORS[idx%SHOE_COLORS.length]
      const daily = new Array(days).fill(0)
      runs.filter(r=>r.shoe_id===shoe.id&&r.date&&getMonthKey(r.date)===activeMonth)
        .forEach(r=>{ const d=new Date(r.date+'T00:00:00').getDate()-1; daily[d]+=(r.miles||0) })
      const cum: number[] = []; let sum=0
      daily.forEach(m=>{ sum+=m; cum.push(parseFloat(sum.toFixed(2))) })
      return { shoe, color, cum }
    })

    const maxV = Math.max(...datasets.map(d=>d.cum[lastDay-1]),1)
    const yMax = Math.ceil(maxV/5)*5||10
    // X scale based on full month width but only plot to lastDay
    const xP = (i:number) => padL+i*(cW/(days-1))
    const yP = (v:number) => padT+cH-(v/yMax)*cH

    // Grid
    for(let i=0;i<=4;i++){
      const v=yMax/4*i, y2=yP(v)
      ctx.beginPath(); ctx.strokeStyle=i===0?'#2e452e':'#1a2a1a'
      ctx.lineWidth=1; ctx.setLineDash(i===0?[]:[3,3])
      ctx.moveTo(padL,y2); ctx.lineTo(padL+cW,y2); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle='#527a52'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='right'
      ctx.fillText(v.toFixed(0),padL-6,y2+3)
    }
    // X labels — only show days up to lastDay
    ctx.fillStyle='#527a52'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='center'
    for(let d=0;d<days;d++) {
      if(d===0||(d+1)%7===0||d===days-1) ctx.fillText(String(d+1),xP(d),H-padB+14)
    }

    datasets.forEach(({shoe,color,cum})=>{
      // Area — only up to lastDay
      ctx.beginPath()
      for(let i=0;i<lastDay;i++) i===0?ctx.moveTo(xP(i),yP(cum[i])):ctx.lineTo(xP(i),yP(cum[i]))
      ctx.lineTo(xP(lastDay-1),yP(0)); ctx.lineTo(xP(0),yP(0)); ctx.closePath()
      ctx.fillStyle=color+'18'; ctx.fill()
      // Line — only up to lastDay
      ctx.beginPath()
      for(let i=0;i<lastDay;i++) i===0?ctx.moveTo(xP(i),yP(cum[i])):ctx.lineTo(xP(i),yP(cum[i]))
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke()
      // Run dots
      runs.filter(r=>r.shoe_id===shoe.id&&r.date&&getMonthKey(r.date)===activeMonth).forEach(r=>{
        const d=new Date(r.date+'T00:00:00').getDate()-1
        if(d>=lastDay) return
        ctx.beginPath(); ctx.arc(xP(d),yP(cum[d]),4,0,Math.PI*2)
        ctx.fillStyle=color; ctx.fill()
        ctx.strokeStyle='#050a05'; ctx.lineWidth=2; ctx.stroke()
      })
      // Shoe icon + label at last logged day
      const ex=xP(lastDay-1), ey=yP(cum[lastDay-1])
      ctx.font='16px serif'; ctx.textAlign='center'
      ctx.fillText('👟',ex,ey-10)
      ctx.fillStyle=color; ctx.font='bold 10px DM Mono,monospace'
      ctx.fillText(cum[lastDay-1].toFixed(1)+' mi',ex,ey-24)
    })

    // TODAY vertical line
    if(todayIdx >= 0) {
      const tx = xP(todayIdx)
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(57,255,106,0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.moveTo(tx, padT)
      ctx.lineTo(tx, padT + cH)
      ctx.stroke()
      ctx.setLineDash([])
      // "TODAY" label
      ctx.fillStyle = 'var(--accent)'
      ctx.font = 'bold 9px DM Mono,monospace'
      ctx.textAlign = 'center'
      // Check if too close to right edge
      const labelX = tx + 20 > W - padR ? tx - 24 : tx + 24
      ctx.fillStyle = '#39ff6a'
      ctx.fillText('TODAY', labelX, padT + 10)
    }
  }, [activeMonth, shoes, runs])

  // ── BAR CHART useEffect
  useEffect(() => {
    const canvas = barCanvasRef.current
    if (!canvas || !recentShoes.length) return

    const dpr = window.devicePixelRatio || 1
    const W   = canvas.parentElement!.clientWidth - 32
    const H   = 280
    canvas.width  = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const padL = 52, padR = 20, padT = 20, padB = 64
    const cW = W - padL - padR
    const cH = H - padT - padB

    // Build data
    const barData = recentShoes.map(shoe => {
      const sr       = runs.filter(r => r.shoe_id === shoe.id)
      const usedMi   = (shoe.start_miles || 0) + sr.reduce((a, r) => a + (r.miles || 0), 0)
      const maxMi    = shoe.max_miles || 350
      const remMi    = Math.max(0, maxMi - usedMi)
      const pct      = Math.min(1, usedMi / maxMi)
      const danger   = pct >= 0.85
      const color    = danger ? '#ff4747' : CAT_COLORS[shoe.category] || '#39ff6a'
      return { shoe, usedMi, remMi, maxMi, pct, color, danger }
    })

    const maxVal  = Math.max(...barData.map(d => d.maxMi), 1)
    const yMax    = Math.ceil(maxVal / 50) * 50 || 100
    const yP      = (v: number) => padT + cH - (v / yMax) * cH

    // Y grid lines
    const gridSteps = 4
    for (let i = 0; i <= gridSteps; i++) {
      const v  = (yMax / gridSteps) * i
      const y2 = yP(v)
      ctx.beginPath()
      ctx.strokeStyle = i === 0 ? '#2e452e' : '#1a2a1a'
      ctx.lineWidth   = 1
      ctx.setLineDash(i === 0 ? [] : [3, 3])
      ctx.moveTo(padL, y2); ctx.lineTo(padL + cW, y2)
      ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle   = '#527a52'
      ctx.font        = '10px DM Mono,monospace'
      ctx.textAlign   = 'right'
      ctx.fillText(v.toFixed(0), padL - 6, y2 + 3)
    }

    const n         = barData.length
    const barW      = Math.min(56, (cW / n) * 0.55)
    const gap       = cW / n

    barData.forEach(({ shoe, usedMi, remMi, maxMi, color, danger }, i) => {
      const cx = padL + gap * i + gap / 2

      // Remaining (dim background bar)
      const totalH = (maxMi / yMax) * cH
      const usedH  = (usedMi / yMax) * cH
      const remH   = Math.max(0, totalH - usedH)
      const barX   = cx - barW / 2

      // Remaining bar (faded)
      if (remH > 0) {
        ctx.fillStyle = color + '22'
        ctx.beginPath()
        ctx.roundRect(barX, yP(maxMi), barW, remH, [4, 4, 0, 0])
        ctx.fill()
        // Dashed top border on remaining
        ctx.strokeStyle = color + '44'
        ctx.lineWidth   = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(barX, yP(maxMi), barW, remH)
        ctx.setLineDash([])
      }

      // Used bar (solid)
      if (usedH > 0) {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(barX, yP(usedMi), barW, usedH, remH > 0 ? [0, 0, 0, 0] : [4, 4, 0, 0])
        ctx.fill()
        // Subtle glow on used bar
        ctx.shadowColor = color
        ctx.shadowBlur  = 6
        ctx.fillStyle   = color
        ctx.beginPath()
        ctx.roundRect(barX, yP(usedMi), barW, usedH, remH > 0 ? [0,0,0,0] : [4,4,0,0])
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Miles used label above bar
      ctx.fillStyle   = color
      ctx.font        = 'bold 10px DM Mono,monospace'
      ctx.textAlign   = 'center'
      ctx.fillText(usedMi.toFixed(0) + ' mi', cx, yP(usedMi) - 6)

      // Remaining label inside faded area if space
      if (remH > 18 && remMi > 0) {
        ctx.fillStyle = color + '88'
        ctx.font      = '9px DM Mono,monospace'
        ctx.fillText(remMi.toFixed(0) + ' left', cx, yP(maxMi) + 12)
      }

      // Shoe icon below bar
      ctx.font      = '18px serif'
      ctx.textAlign = 'center'
      ctx.fillText('👟', cx, H - padB + 18)

      // Shoe name below icon
      const shortName = shoe.name.length > 10 ? shoe.name.slice(0, 9) + '…' : shoe.name
      ctx.fillStyle = '#527a52'
      ctx.font      = '9px DM Mono,monospace'
      ctx.textAlign = 'center'
      ctx.fillText(shortName, cx, H - padB + 32)

      // Brand name
      const shortBrand = shoe.brand.length > 8 ? shoe.brand.slice(0, 7) + '…' : shoe.brand
      ctx.fillStyle = '#2e452e'
      ctx.font      = '9px DM Mono,monospace'
      ctx.fillText(shortBrand, cx, H - padB + 44)
    })

  }, [shoes, runs])

  return (
    <div className={styles.wrap}>
      {/* GREETING */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.greeting}>HAPPY {dayName.toUpperCase()},<br/><span>{userName.toUpperCase()}</span>.</div>
          <div className={styles.tagline}>Let&apos;s have a run.</div>
          <div className={styles.sub}>
            {runs.length === 0 ? "NO RUNS LOGGED YET — LET'S GO." : `${runs.length} RUN${runs.length!==1?'S':''} LOGGED · ${totalMiles.toFixed(1)} TOTAL MILES`}
          </div>
        </div>
        {nextRace ? (
          <div className={styles.nextRaceCard} onClick={()=>openEditRace(nextRace)}>
            {getRaceLogoUrl(nextRace.name) && (
              <img src={getRaceLogoUrl(nextRace.name)!} alt={nextRace.name} className={styles.nextRaceLogo} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
            )}
            <div className={styles.nextRaceLabel}>NEXT RACE</div>
            <div className={styles.nextRaceDays}>{daysUntil(nextRace.date)}</div>
            <div className={styles.nextRaceDaysLabel}>DAYS TO GO</div>
            <div className={styles.nextRaceName}>{nextRace.name}</div>
            <div className={styles.nextRaceDate}>
              {new Date(nextRace.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
              {nextRace.goal_time && <span style={{color:'var(--accent)'}}> · Goal {nextRace.goal_time}</span>}
            </div>
            <div className={styles.raceTimeline}>
              <div className={styles.raceTimelinePoint}>
                <div className={styles.raceTimelineDot}/>
                <div className={styles.raceTimelinePointLabel}>
                  <div className={styles.raceTimelinePointTitle}>Today</div>
                  <div className={styles.raceTimelinePointDate}>{today.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                </div>
              </div>
              <div className={styles.raceTimelineLine}/>
              <div className={styles.raceTimelinePoint}>
                <div className={`${styles.raceTimelineDot} ${styles.raceTimelineDotEnd}`}/>
                <div className={styles.raceTimelinePointLabel}>
                  <div className={styles.raceTimelinePointTitle}>Race Day</div>
                  <div className={styles.raceTimelinePointDate}>{new Date(nextRace.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button className={styles.nextRaceAddBtn} onClick={openAddRace}>+ Add Race</button>
        )}
      </div>

      {/* MOST RECENT SHOE */}
      {recentShoe && (
        <div className={styles.recentStrip}>
          <div className={styles.recentLabel}>Most Recent Shoe</div>
          <div className={styles.recentDivider}/>
          <BrandLogo brand={recentShoe.brand} size={38}/>
          <div className={styles.recentInfo}>
            <div className={styles.recentName}>{recentShoe.brand} {recentShoe.name}</div>
            <div className={styles.recentMeta}>
              <span style={{color: CAT_COLORS[recentShoe.category]}}>{catLabel(recentShoe.category)}</span>
              {recentShoe.size && <span>US {recentShoe.size}{recentShoe.wide==='wide'?' · Wide':''}</span>}
              {latestRun.miles && <span>{latestRun.miles} mi{latestRun.pace?` · ${latestRun.pace}/mi`:''}</span>}
            </div>
            <div className={styles.recentBar}>
              <div className={styles.recentBarLabel}>
                <span>{((shoes.find(s=>s.id===recentShoe.id) ? (recentShoe.start_miles||0)+runs.filter(r=>r.shoe_id===recentShoe.id).reduce((a,r)=>a+(r.miles||0),0) : 0).toFixed(1))} / {recentShoe.max_miles} mi</span>
              </div>
              <div className={styles.recentBarTrack}>
                <div className={styles.recentBarFill} style={{
                  width:`${Math.min(100,((recentShoe.start_miles||0)+runs.filter(r=>r.shoe_id===recentShoe.id).reduce((a,r)=>a+(r.miles||0),0))/recentShoe.max_miles*100)}%`,
                  background: CAT_COLORS[recentShoe.category]
                }}/>
              </div>
            </div>
          </div>
          <div className={styles.recentDate}>
            <span className={styles.recentDateLabel}>LAST RUN</span>
            <span className={styles.recentDateVal}>{new Date(latestRun.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
          </div>
        </div>
      )}

      {/* TRAINING PLAN WIDGET */}
      {activePlan && (
        <div className={styles.trainingWidget}>
          <div className={styles.trainingWidgetLeft}>
            <div className={styles.trainingWidgetLabel}>Active Plan</div>
            <div className={styles.trainingWidgetName}>{activePlan.name}</div>
            <div className={styles.trainingWidgetWeek}>Week {currentWeekNum} of {activePlan.weeks}</div>
            <div className={styles.trainingWidgetProgress}>
              <div className={styles.trainingProgressBar}>
                <div className={styles.trainingProgressFill} style={{width:`${thisWeekTotal>0?(thisWeekLogged/thisWeekTotal)*100:0}%`}}/>
              </div>
              <div className={styles.trainingProgressLabel}>
                {thisWeekLogged}/{thisWeekTotal} runs · {thisWeekMiLogged.toFixed(1)}/{thisWeekMiPlan.toFixed(1)} mi this week
              </div>
            </div>
          </div>
          {nextWorkout && (
            <div className={styles.trainingWidgetNext}>
              <div className={styles.trainingWidgetNextLabel}>Next Workout</div>
              <div className={styles.trainingWidgetNextType} style={{color: RUN_TYPE_COLORS[nextWorkout.run_type] || 'var(--accent)'}}>
                {RUN_TYPE_LABELS[nextWorkout.run_type]}
              </div>
              <div className={styles.trainingWidgetNextMeta}>
                {nextWorkout.planned_miles} mi · {new Date(nextWorkout.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
              </div>
              {nextShoe && (
                <div className={styles.trainingWidgetNextShoe}>
                  <BrandLogo brand={nextShoe.brand} size={14}/>
                  <span>{nextShoe.name}</span>
                </div>
              )}
            </div>
          )}
          <button className={styles.trainingWidgetBtn} onClick={()=>router.push(`/app/training?week=${currentWeekNum}`)}>
            View Plan →
          </button>
        </div>
      )}

      {/* SPENDING SUMMARY MOVED TO BOTTOM OF PAGE */}
      <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Best Shoes by Category</div></div>
      <div className={styles.bestGrid}>
        {(['daily','speed','race'] as const).map(cat => {
          const best = bestShoe(cat)
          return (
            <div key={cat} className={`${styles.bestCard} ${styles[cat]}`}>
              <div className={`${styles.cardCat} ${styles[cat]}`}>
                {cat==='daily'?'🏃 Daily Trainer':cat==='speed'?'⚡ Speed / Carbon':'🏆 Race Day'}
              </div>
              {best ? (
                <>
                  <div className={styles.cardShoeRow}>
                    <BrandLogo brand={best.s.brand} size={30}/>
                    <div className={styles.cardShoeName}>{best.s.brand} {best.s.name}</div>
                  </div>
                  <div className={styles.cardScoreRow}>
                    <div className={styles.cardScore} style={{color:CAT_COLORS[cat]}}>{best.score}</div>
                    <div className={styles.cardScoreLabel}>/ 100<br/>COMPOSITE</div>
                  </div>
                </>
              ) : (
                <div className={styles.cardEmpty}>Log runs to see your best {cat} shoe</div>
              )}
            </div>
          )
        })}
      </div>

      {/* SCORING METHODOLOGY */}
      <details className={styles.methodology}>
        <summary className={styles.methodologySummary}>
          <span className={styles.methodologyIcon}>ⓘ</span> How the composite score works
        </summary>
        <div className={styles.methodologyBody}>
          <p>
            The composite score is built on two established exercise-science models rather than
            simple pace and heart rate scales, so it captures genuine performance — not just "ran fast that day."
            Every run is first condition-adjusted for heat, humidity, and elevation, then scored
            across three components:
          </p>
          <div className={styles.methodologyGrid}>
            <div className={styles.methodologyItem}>
              <div className={styles.methodologyLabel} style={{color:'var(--accent)'}}>VDOT Performance Score</div>
              <div className={styles.methodologyDesc}>
                Based on Jack Daniels' VDOT formula — the same model elite coaches use to equate
                race performances across distances. It converts your pace into an oxygen-cost-equivalent
                value, capturing both fitness and running economy in one number rather than rewarding
                raw speed alone.
              </div>
            </div>
            <div className={styles.methodologyItem}>
              <div className={styles.methodologyLabel} style={{color:'var(--accent)'}}>TRIMP Effort Score</div>
              <div className={styles.methodologyDesc}>
                Based on Banister's Training Impulse model, which weights heart rate exponentially
                rather than linearly — physiological strain rises faster than HR does. This component
                asks whether your heart rate was appropriately controlled for the pace you ran, or
                higher than the pace alone would predict.
              </div>
            </div>
            <div className={styles.methodologyItem}>
              <div className={styles.methodologyLabel} style={{color:'var(--accent)'}}>Comfort</div>
              <div className={styles.methodologyDesc}>
                Your 0–10 shoe comfort rating from each run, converted to a 0–100 scale.
              </div>
            </div>
          </div>
          <p className={styles.methodologyNote}>
            <strong>Run type changes the weighting.</strong> Recovery runs lean on comfort and
            effort control over speed. Tempo, LT, and speed workouts weight the VDOT performance
            score heavily. Long runs and general aerobic runs use a balanced blend. This means
            the same shoe can score differently across run types — a shoe that's great for easy
            days might not be your best tempo shoe, and vice versa.
          </p>
        </div>
      </details>

      {/* SHOE LIFESPAN BAR CHART */}
      <div className={styles.sectionHeader} style={{marginTop:32}}>
        <div className={styles.sectionTitle}>Shoe Lifespan Overview</div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-muted)',letterSpacing:'0.5px'}}>
          Solid = miles used &nbsp;·&nbsp; Faded = remaining lifespan
        </div>
      </div>
      <div className={styles.chartCard}>
        {recentShoes.length === 0 ? (
          <div className={styles.chartEmpty}>Add shoes to see lifespan overview</div>
        ) : (
          <>
            <canvas ref={barCanvasRef} style={{display:'block',width:'100%'}}/>
            <div className={styles.chartLegend} style={{marginTop:12}}>
              {recentShoes.map(s => {
                const sr     = runs.filter(r => r.shoe_id === s.id)
                const used   = (s.start_miles||0) + sr.reduce((a,r)=>a+(r.miles||0),0)
                const pct    = Math.min(100, used / s.max_miles * 100)
                const danger = pct >= 85
                const color  = danger ? 'var(--red)' : CAT_COLORS[s.category]
                return (
                  <div key={s.id} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{background:color}}/>
                    <span>{s.brand} {s.name}</span>
                    <span style={{color:'var(--text-dim)',marginLeft:4}}>{used.toFixed(0)}/{s.max_miles} mi</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* MONTHLY CHART */}
      <div className={styles.sectionHeader} style={{marginTop:32}}>
        <div className={styles.sectionTitle}>Monthly Mileage by Shoe</div>
        <div className={styles.monthToggles}>
          {allMonths.map(m=>(
            <button key={m} className={`${styles.monthBtn} ${m===activeMonth?styles.monthActive:''}`} onClick={()=>setActiveMonth(m)}>
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.chartCard}>
        {allMonths.length===0 ? (
          <div className={styles.chartEmpty}>Log runs to see monthly progress</div>
        ) : (
          <>
            <canvas ref={canvasRef} style={{display:'block',width:'100%'}}/>
            <div className={styles.chartLegend}>
              {shoes.filter(s=>runs.some(r=>r.shoe_id===s.id&&r.date&&activeMonth&&getMonthKey(r.date)===activeMonth)).map((s,i)=>(
                <div key={s.id} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{background:SHOE_COLORS[i%SHOE_COLORS.length]}}/>
                  <span>{s.brand} {s.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* PREDICTION BANNERS */}
      <div className={styles.sectionHeader} style={{marginTop:32}}><div className={styles.sectionTitle}>Shoe Mileage Tracker</div></div>
      {overdue.map((p,i) => p && (
        <div key={i} className={`${styles.predBanner} ${styles.predDanger}`}>
          <span className={styles.predIcon}>⚠️</span>
          <div className={styles.predText}>
            <div className={styles.predLabel} style={{color:'var(--red)'}}>Daily Trainer — Replace Now</div>
            <div className={styles.predMain}>{p.shoe.brand} {p.shoe.name} has hit its mileage limit</div>
            <div className={styles.predSub}>{p.totalMi.toFixed(1)} mi logged · {p.maxMi} mi limit</div>
          </div>
        </div>
      ))}
      {upcoming[0] && (
        <div className={styles.predBanner}>
          <span className={styles.predIcon}>🔮</span>
          <div className={styles.predText}>
            <div className={styles.predLabel}>Daily Trainer Replacement Forecast</div>
            <div className={styles.predMain}>{upcoming[0]!.shoe.brand} {upcoming[0]!.shoe.name} — {upcoming[0]!.miLeft} mi remaining at {upcoming[0]!.daily} mi/day avg</div>
            <div className={styles.predSub}>Projected to hit {upcoming[0]!.maxMi} mi limit in {upcoming[0]!.daysLeft} days</div>
          </div>
          <div className={styles.predDate}>{upcoming[0]!.dateStr}</div>
        </div>
      )}

      {/* MILEAGE GRAPH CARDS */}
      <div className={styles.graphGrid}>
        {activeShoes.length===0 ? (
          <div className={styles.empty}><div>👟</div><div>No Shoes Yet</div><div>Add shoes in the Shoe Locker</div></div>
        ) : activeShoes.map(shoe => {
          const sr = runs.filter(r=>r.shoe_id===shoe.id)
          const totalMi = (shoe.start_miles||0)+sr.reduce((a,r)=>a+(r.miles||0),0)
          const pct = Math.min(100,totalMi/shoe.max_miles*100)
          const danger = pct>=85
          const sorted = [...sr].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
          const firstRun = sorted[0]
          const firstDate = firstRun ? new Date(firstRun.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : null
          return (
            <div key={shoe.id} className={styles.graphCard}>
              <div className={styles.graphCardHeader}>
                <div>
                  <div className={styles.graphName}>{shoe.brand} {shoe.name}</div>
                  {firstDate && <div className={styles.graphMeta}>📅 First run {firstDate}</div>}
                  {shoe.size && <div className={styles.graphMeta}>👟 US {shoe.size}{shoe.wide==='wide'?' · Wide':''}</div>}
                  {danger && <span className={styles.warnBadge}>⚠ Near limit</span>}
                </div>
                <div className={styles.graphRight}>
                  <BrandLogo brand={shoe.brand} size={24}/>
                  <div className={styles.graphTag} style={{color:CAT_COLORS[shoe.category],borderColor:CAT_COLORS[shoe.category]+'33'}}>{catLabel(shoe.category)}</div>
                </div>
              </div>
              <div className={styles.graphMiles}>
                <span className={styles.graphMilesNum}>{totalMi.toFixed(1)}</span>
                <span className={styles.graphMilesMax}>/ {shoe.max_miles} mi</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{width:`${pct}%`,background:danger?'var(--red)':CAT_COLORS[shoe.category]}}/>
              </div>
            </div>
          )
        })}
      </div>
      {/* SPENDING SUMMARY */}
      <div className={styles.sectionHeader} style={{marginTop:32}}>
        <div className={styles.sectionTitle}>Shoe Spending</div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-muted)',letterSpacing:'0.5px'}}>{now.getFullYear()} · {daysLeft} days left in year</div>
      </div>
      <div className={styles.spendingCard}>
        <div className={styles.spendingRow}>
          {/* Spent this year */}
          <div className={styles.spendingBlock}>
            <div className={styles.spendingBlockLabel}>Spent This Year</div>
            <div className={styles.spendingBig}>${Math.round(totalSpentThisYear).toLocaleString()}</div>
            <div className={styles.spendingBreakdown}>
              {(['daily','speed','race'] as const).map(cat => spentByCategory[cat] > 0 && (
                <div key={cat} className={styles.spendingBreakdownItem}>
                  <span style={{color:CAT_COLORS[cat]}}>{catLabel(cat)} ({countByCategory[cat]})</span>
                  <span>${Math.round(spentByCategory[cat]).toLocaleString()}</span>
                </div>
              ))}
              {totalSpentThisYear === 0 && <div style={{color:'var(--text-dim)',fontSize:11,fontStyle:'italic'}}>Add prices to your shoes to track spending</div>}
            </div>
          </div>

          <div className={styles.spendingDivider}/>

          {/* Projected remainder */}
          <div className={styles.spendingBlock}>
            <div className={styles.spendingBlockLabel}>Projected Rest of Year</div>
            <div className={styles.spendingBig} style={{color:'var(--warn)'}}>${Math.round(totalProj).toLocaleString()}</div>
            <div className={styles.spendingBreakdown}>
              {projDaily > 0 && <div className={styles.spendingBreakdownItem}><span style={{color:CAT_COLORS.daily}}>Daily ({projDailyData.count})</span><span>${Math.round(projDaily).toLocaleString()}</span></div>}
              {projSpeed > 0 && <div className={styles.spendingBreakdownItem}><span style={{color:CAT_COLORS.speed}}>Speed ({projSpeedData.count})</span><span>${Math.round(projSpeed).toLocaleString()}</span></div>}
              {projRace  > 0 && <div className={styles.spendingBreakdownItem}><span style={{color:CAT_COLORS.race}}>Race ({projRaceData.count})</span><span>${Math.round(projRace).toLocaleString()}</span></div>}
              {totalProj === 0 && <div style={{color:'var(--text-dim)',fontSize:11,fontStyle:'italic'}}>Log more runs to generate projection</div>}
            </div>
          </div>

          <div className={styles.spendingDivider}/>

          {/* Full year estimate */}
          <div className={styles.spendingBlock}>
            <div className={styles.spendingBlockLabel}>Full Year Estimate</div>
            <div className={styles.spendingBig} style={{color:'var(--race)'}}>
              ${Math.round(totalSpentThisYear + totalProj).toLocaleString()}
            </div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--text-muted)',marginTop:8}}>
              {shoesThisYear.length} shoe{shoesThisYear.length!==1?'s':''} purchased · {daysLeft} days remaining
            </div>
          </div>
        </div>
      </div>

      {/* RACE MODAL */}
      <Modal open={raceModal} onClose={()=>setRaceModal(false)} title={editingRace?'Edit Race':'Add Upcoming Race'}>
        <FormGroup><FormLabel>Race Name</FormLabel><FormInput placeholder="e.g. Chicago Marathon 2026" value={raceName} onChange={e=>setRaceName(e.target.value)}/></FormGroup>
        <FormRow>
          <FormGroup><FormLabel>Race Date</FormLabel><FormInput type="date" value={raceDate} onChange={e=>setRaceDate(e.target.value)}/></FormGroup>
          <FormGroup>
            <FormLabel>Race Type</FormLabel>
            <FormSelect value={raceType} onChange={e=>setRaceType(e.target.value)}>
              <option value="marathon">Marathon</option>
              <option value="half">Half Marathon</option>
              <option value="ten_k">10K</option>
              <option value="five_k">5K</option>
              <option value="other">Other</option>
            </FormSelect>
          </FormGroup>
        </FormRow>
        <FormGroup><FormLabel>Location (optional)</FormLabel><FormInput placeholder="e.g. Chicago, IL" value={raceLocation} onChange={e=>setRaceLocation(e.target.value)}/></FormGroup>
        <FormGroup><FormLabel>Goal Time (optional)</FormLabel><FormInput type="text" inputMode="numeric" placeholder="e.g. 2:50:00" value={raceGoal} onChange={e=>setRaceGoal(formatTimeInput(e.target.value))}/></FormGroup>
        <FormActions>
          <Btn variant="ghost" onClick={()=>setRaceModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveRace} disabled={savingRace}>{savingRace?'Saving…':editingRace?'Save Changes':'Add Race'}</Btn>
        </FormActions>
      </Modal>
    </div>
  )
}
