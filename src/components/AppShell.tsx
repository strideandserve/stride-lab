'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import styles from './AppShell.module.css'

const TABS = [
  { id: 'home',     href: '/app',          icon: '🏠', label: 'Home'     },
  { id: 'locker',   href: '/app/locker',   icon: '👟', label: 'Locker'   },
  { id: 'rankings', href: '/app/rankings', icon: '🏆', label: 'Rankings' },
  { id: 'races',    href: '/app/races',    icon: '🏁', label: 'Races'    },
]

export default function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const supabase   = createClient()
  const importRef  = useRef<HTMLInputElement>(null)
  const mImportRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  async function exportData() {
    const { data: shoes } = await supabase.from('shoes').select('*')
    const { data: runs   } = await supabase.from('runs').select('*')
    const blob = new Blob([JSON.stringify({ shoes, runs }, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `stridelab-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg('Importing...')

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not logged in')
      const userId = session.user.id

      const shoes = (data.shoes || [])
      const runs  = (data.runs  || [])

      // Map old shoe IDs to new UUIDs
      const shoeIdMap: Record<string, string> = {}

      for (const shoe of shoes) {
        const newShoe = {
          user_id:     userId,
          name:        shoe.name        || shoe.name,
          brand:       shoe.brand       || 'Unknown',
          category:    shoe.category,
          max_miles:   shoe.max_miles   ?? shoe.maxMiles   ?? 350,
          start_miles: shoe.start_miles ?? shoe.startMiles ?? 0,
          size:        shoe.size        ?? null,
          wide:        shoe.wide        || 'standard',
          added_date:  shoe.added_date  || shoe.addedDate  || new Date().toISOString().split('T')[0],
        }
        const { data: inserted, error } = await supabase.from('shoes').insert(newShoe).select('id').single()
        if (error) { console.error('Shoe insert error:', error); continue }
        shoeIdMap[shoe.id] = inserted.id
      }

      let runCount = 0
      for (const run of runs) {
        const newShoeId = shoeIdMap[run.shoe_id || run.shoeId]
        if (!newShoeId) continue
        const newRun = {
          user_id:     userId,
          shoe_id:     newShoeId,
          miles:       run.miles,
          date:        run.date,
          pace:        run.pace        || null,
          hr:          run.hr          || null,
          comfort:     run.comfort     ?? 7.5,
          elevation:   run.elevation   ?? null,
          temp:        run.temp        ?? null,
          humidity:    run.humidity    ?? null,
          location:    run.location    || null,
          notes:       run.notes       || null,
          finish_time: run.finish_time || run.finishTime || null,
          is_race:     run.is_race     ?? run.isRace     ?? false,
          race_name:   run.race_name   || run.raceName   || null,
          race_type:   run.race_type   || run.raceType   || null,
        }
        const { error } = await supabase.from('runs').insert(newRun)
        if (!error) runCount++
      }

      setImportMsg(`✓ Imported ${shoes.length} shoes & ${runCount} runs`)
      setTimeout(() => { setImportMsg(null); router.refresh() }, 2500)
    } catch (err) {
      console.error(err)
      setImportMsg('Import failed — check file format')
      setTimeout(() => setImportMsg(null), 3000)
    }

    setImporting(false)
    if (e.target) e.target.value = ''
  }

  return (
    <div className={styles.shell}>
      {/* TOP NAV — desktop */}
      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => router.push('/app')}>
          STRIDE<span>LAB</span>
        </div>
        <div className={styles.navLinks}>
          {TABS.map(t => (
            <div key={t.id}
              className={`${styles.navLink} ${pathname === t.href ? styles.active : ''}`}
              onClick={() => router.push(t.href)}>
              {t.label}
            </div>
          ))}
          <div className={styles.navDivider} />
          <button className={styles.dataBtn} onClick={exportData}>⬇ Export</button>
          <label className={`${styles.dataBtn} ${styles.importBtn}`}>
            {importing ? '...' : '⬆ Import'}
            <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImport} />
          </label>
          <button className={styles.dataBtn} onClick={signOut}>Sign Out</button>
        </div>
      </nav>

      {/* IMPORT STATUS TOAST */}
      {importMsg && (
        <div className={styles.importToast}>
          {importMsg}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {children}
      </main>

      {/* BOTTOM TAB BAR — mobile */}
      <nav className={styles.bottomNav}>
        {TABS.map(t => (
          <div key={t.id}
            className={`${styles.tabItem} ${pathname === t.href ? styles.tabActive : ''}`}
            onClick={() => router.push(t.href)}>
            <span className={styles.tabIcon}>{t.icon}</span>
            <span className={styles.tabLabel}>{t.label}</span>
          </div>
        ))}
        <label className={styles.tabItem}>
          <span className={styles.tabIcon}>⬆</span>
          <span className={styles.tabLabel}>{importing ? '...' : 'Import'}</span>
          <input ref={mImportRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImport} />
        </label>
        <div className={styles.tabItem} onClick={exportData}>
          <span className={styles.tabIcon}>⬇</span>
          <span className={styles.tabLabel}>Export</span>
        </div>
      </nav>
    </div>
  )
}
