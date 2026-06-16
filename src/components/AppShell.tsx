'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { FormGroup, FormLabel, FormInput, FormSelect, FormRow, FormActions, Btn } from '@/components/Form'
import type { Profile } from '@/lib/types'
import styles from './AppShell.module.css'

const TABS = [
  { id: 'home',     href: '/app',           icon: '🏠', label: 'Home'     },
  { id: 'locker',   href: '/app/locker',    icon: '👟', label: 'Locker'   },
  { id: 'training', href: '/app/training',  icon: '📋', label: 'Training' },
  { id: 'rankings', href: '/app/rankings',  icon: '🏆', label: 'Rankings' },
  { id: 'races',    href: '/app/races',     icon: '🏁', label: 'Races'    },
  { id: 'majors',   href: '/app/majors',    icon: '⭐', label: 'Majors'   },
]

export default function AppShell({ children, userName, profile }: { children: React.ReactNode; userName: string; profile: Profile }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const supabase   = createClient()
  const importRef  = useRef<HTMLInputElement>(null)
  const mImportRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  // ── RUNNER PROFILE (height, weight, age, gender — used for race percentiles)
  const profileIncomplete = !profile?.birth_year || !profile?.gender
  const [profileModal, setProfileModal] = useState(profileIncomplete)
  const [pBirthYear, setPBirthYear] = useState(profile?.birth_year ? String(profile.birth_year) : '')
  const [pGender, setPGender]       = useState<string>(profile?.gender ?? '')
  const [pHeight, setPHeight]       = useState(profile?.height_in ? String(profile.height_in) : '')
  const [pWeight, setPWeight]       = useState(profile?.weight_lb ? String(profile.weight_lb) : '')
  const [savingProfile, setSavingProfile] = useState(false)

  async function saveProfile() {
    if (!pBirthYear || !pGender) return
    setSavingProfile(true)
    await supabase.from('profiles').update({
      birth_year: parseInt(pBirthYear),
      gender: pGender,
      height_in: pHeight ? parseFloat(pHeight) : null,
      weight_lb: pWeight ? parseFloat(pWeight) : null,
    }).eq('id', profile.id)
    setSavingProfile(false)
    setProfileModal(false)
    router.refresh()
  }

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
          <button className={styles.dataBtn} onClick={()=>setProfileModal(true)}>⚙ Profile</button>
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
        <div className={styles.tabItem} onClick={()=>setProfileModal(true)}>
          <span className={styles.tabIcon}>⚙</span>
          <span className={styles.tabLabel}>Profile</span>
        </div>
      </nav>

      {/* RUNNER PROFILE MODAL */}
      <Modal open={profileModal} onClose={()=>{ if (!profileIncomplete) setProfileModal(false) }} title="Your Runner Profile">
        <div className={styles.profileIntro}>
          Used to show how your race times compare to other runners of your age and gender —
          you&apos;ll see this on the Race Log as percentile rankings for the Marathon, Half, 10K, and 5K.
        </div>
        <FormRow>
          <FormGroup>
            <FormLabel>Birth Year</FormLabel>
            <FormInput type="number" placeholder="1992" value={pBirthYear} onChange={e=>setPBirthYear(e.target.value)}/>
          </FormGroup>
          <FormGroup>
            <FormLabel>Gender</FormLabel>
            <FormSelect value={pGender} onChange={e=>setPGender(e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </FormSelect>
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup>
            <FormLabel>Height (inches, optional)</FormLabel>
            <FormInput type="number" step="0.1" placeholder="70" value={pHeight} onChange={e=>setPHeight(e.target.value)}/>
          </FormGroup>
          <FormGroup>
            <FormLabel>Weight (lbs, optional)</FormLabel>
            <FormInput type="number" step="0.1" placeholder="165" value={pWeight} onChange={e=>setPWeight(e.target.value)}/>
          </FormGroup>
        </FormRow>
        <FormActions>
          {!profileIncomplete && <Btn variant="ghost" onClick={()=>setProfileModal(false)}>Cancel</Btn>}
          <Btn variant="primary" onClick={saveProfile} disabled={savingProfile || !pBirthYear || !pGender}>
            {savingProfile ? 'Saving…' : 'Save'}
          </Btn>
        </FormActions>
      </Modal>
    </div>
  )
}
