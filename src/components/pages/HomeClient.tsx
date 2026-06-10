'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Shoe, Run } from '@/lib/types'
import { computeCompositeScore, catLabel, CAT_COLORS, paceToFinishTime, paceToSeconds, secondsToPace } from '@/lib/utils'
import BrandLogo from '@/components/BrandLogo'
import styles from './HomeClient.module.css'

interface Props { shoes: Shoe[]; runs: Run[]; userName: string }

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

export default function HomeClient({ shoes, runs, userName }: Props) {
  const allMonths = getAllMonths(runs)
  const [activeMonth, setActiveMonth] = useState(() => allMonths[allMonths.length-1] ?? null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const totalMiles = runs.reduce((a,r)=>a+(r.miles||0),0)

  // Best by category
  function bestShoe(cat: string) {
    const scored = shoes.filter(s=>s.category===cat).map(s=>({
      s, score: computeCompositeScore(runs.filter(r=>r.shoe_id===s.id))
    })).filter(x=>x.score!==null).sort((a,b)=>(b.score!-a.score!))
    return scored[0] ?? null
  }

  // Most recent shoe
  const latestRun = [...runs].filter(r=>r.date&&r.shoe_id).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())[0]
  const recentShoe = latestRun ? shoes.find(s=>s.id===latestRun.shoe_id) : null

  // Predictions
  const preds = shoes.filter(s=>s.category==='daily').map(s=>predictReplacement(s,runs.filter(r=>r.shoe_id===s.id))).filter(Boolean) as ReturnType<typeof predictReplacement>[]
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

    const datasets = activeShoes.map((shoe,idx)=>{
      const color = SHOE_COLORS[idx%SHOE_COLORS.length]
      const daily = new Array(days).fill(0)
      runs.filter(r=>r.shoe_id===shoe.id&&r.date&&getMonthKey(r.date)===activeMonth)
        .forEach(r=>{ const d=new Date(r.date+'T00:00:00').getDate()-1; daily[d]+=(r.miles||0) })
      const cum: number[] = []; let sum=0
      daily.forEach(m=>{ sum+=m; cum.push(parseFloat(sum.toFixed(2))) })
      return { shoe, color, cum }
    })

    const maxV = Math.max(...datasets.map(d=>d.cum[days-1]),1)
    const yMax = Math.ceil(maxV/5)*5||10
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
    // X labels
    ctx.fillStyle='#527a52'; ctx.font='10px DM Mono,monospace'; ctx.textAlign='center'
    for(let d=0;d<days;d++) {
      if(d===0||(d+1)%7===0||d===days-1) ctx.fillText(String(d+1),xP(d),H-padB+14)
    }

    datasets.forEach(({shoe,color,cum})=>{
      // Area
      ctx.beginPath()
      cum.forEach((v,i)=>i===0?ctx.moveTo(xP(i),yP(v)):ctx.lineTo(xP(i),yP(v)))
      ctx.lineTo(xP(days-1),yP(0)); ctx.lineTo(xP(0),yP(0)); ctx.closePath()
      ctx.fillStyle=color+'18'; ctx.fill()
      // Line
      ctx.beginPath()
      cum.forEach((v,i)=>i===0?ctx.moveTo(xP(i),yP(v)):ctx.lineTo(xP(i),yP(v)))
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke()
      // Run dots
      runs.filter(r=>r.shoe_id===shoe.id&&r.date&&getMonthKey(r.date)===activeMonth).forEach(r=>{
        const d=new Date(r.date+'T00:00:00').getDate()-1
        ctx.beginPath(); ctx.arc(xP(d),yP(cum[d]),4,0,Math.PI*2)
        ctx.fillStyle=color; ctx.fill()
        ctx.strokeStyle='#050a05'; ctx.lineWidth=2; ctx.stroke()
      })
      // Shoe icon + label at endpoint
      const ex=xP(days-1), ey=yP(cum[days-1])
      ctx.font='16px serif'; ctx.textAlign='center'
      ctx.fillText('👟',ex,ey-10)
      ctx.fillStyle=color; ctx.font='bold 10px DM Mono,monospace'
      ctx.fillText(cum[days-1].toFixed(1)+' mi',ex,ey-24)
    })
  }, [activeMonth, shoes, runs])

  return (
    <div className={styles.wrap}>
      {/* GREETING */}
      <div className={styles.header}>
        <div className={styles.greeting}>HEY,<br/><span>{userName.toUpperCase()}</span>.</div>
        <div className={styles.sub}>
          {runs.length === 0 ? "NO RUNS LOGGED YET — LET'S GO." : `${runs.length} RUN${runs.length!==1?'S':''} LOGGED · ${totalMiles.toFixed(1)} TOTAL MILES`}
        </div>
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

      {/* BEST BY CATEGORY */}
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
        {shoes.length===0 ? (
          <div className={styles.empty}><div>👟</div><div>No Shoes Yet</div><div>Add shoes in the Shoe Locker</div></div>
        ) : shoes.map(shoe => {
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
    </div>
  )
}
