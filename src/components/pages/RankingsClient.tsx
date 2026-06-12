'use client'
import type { Shoe, Run } from '@/lib/types'
import { computeCompositeScore, catLabel, CAT_COLORS, paceToSeconds, secondsToPace } from '@/lib/utils'
import styles from './RankingsClient.module.css'

interface Props { shoes: Shoe[]; runs: Run[] }

const RANK_COLORS = ['gold','silver','bronze']
const RANK_LABELS: Record<string,string> = { gold:'#ffd700', silver:'#aaa', bronze:'#cd7f32' }

export default function RankingsClient({ shoes, runs }: Props) {
  const cats = ['daily','speed','race'] as const
  const catNames = { daily:'🏃 Daily Trainers', speed:'⚡ Speed / Carbon', race:'🏆 Race Day' }

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>SHOE<br/>RANKINGS</div>
      <div className={styles.sub}>Composite score: pace efficiency 40% · heart rate 35% · comfort 25%</div>

      <div className={styles.grid}>
        {cats.map(cat => {
          const scored = shoes.filter(s=>s.category===cat).map(shoe => {
            const sr = runs.filter(r=>r.shoe_id===shoe.id)
            const score = computeCompositeScore(sr)
            const pRuns = sr.filter(r=>r.pace)
            const hRuns = sr.filter(r=>r.hr)
            const cRuns = sr.filter(r=>r.comfort)
            const avgPace = pRuns.length ? pRuns.reduce((a,r)=>a+(paceToSeconds(r.pace)||0),0)/pRuns.length : null
            const avgHr   = hRuns.length ? Math.round(hRuns.reduce((a,r)=>a+(r.hr||0),0)/hRuns.length) : null
            const avgComf = cRuns.length ? (cRuns.reduce((a,r)=>a+(r.comfort||0),0)/cRuns.length).toFixed(1) : null
            const totalMi = (shoe.start_miles||0)+sr.reduce((a,r)=>a+(r.miles||0),0)
            const costPerMi = shoe.price && totalMi > 0 ? (shoe.price/totalMi).toFixed(2) : null
            return { shoe, score, count:sr.length, avgPace, avgHr, avgComf, costPerMi }
          }).filter(x=>x.score!==null).sort((a,b)=>(b.score!-a.score!))

          return (
            <div key={cat} className={styles.col}>
              <div className={styles.colHeader}>
                <div className={styles.dot} style={{background:CAT_COLORS[cat],boxShadow:`0 0 8px ${CAT_COLORS[cat]}88`}}/>
                <div className={styles.colTitle}>{catNames[cat]}</div>
              </div>
              {scored.length===0 ? (
                <div className={styles.empty}>No scored shoes yet.<br/>Log runs to see rankings.</div>
              ) : scored.map((item,i) => (
                <div key={item.shoe.id} className={styles.item}>
                  <div className={styles.rank} style={{color:i<3?RANK_LABELS[RANK_COLORS[i]]:'var(--text-dim)'}}>{i+1}</div>
                  <div className={styles.info}>
                    <div className={styles.name}>{item.shoe.brand} {item.shoe.name}</div>
                    <div className={styles.meta}>{item.count} runs · {secondsToPace(item.avgPace)}/mi · {item.avgHr||'—'} bpm · {item.avgComf||'—'}/10{item.costPerMi ? ` · $${item.costPerMi}/mi` : ''}</div>
                  </div>
                  <div className={styles.score} style={{color:CAT_COLORS[cat]}}>{item.score}</div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
