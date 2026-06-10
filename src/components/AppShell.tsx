'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import styles from './AppShell.module.css'

const TABS = [
  { id: 'home',     href: '/app',          icon: '🏠', label: 'Home'     },
  { id: 'locker',   href: '/app/locker',   icon: '👟', label: 'Locker'   },
  { id: 'rankings', href: '/app/rankings', icon: '🏆', label: 'Rankings' },
  { id: 'races',    href: '/app/races',    icon: '🏁', label: 'Races'    },
]

export default function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

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
          <button className={styles.dataBtn} onClick={signOut}>Sign Out</button>
        </div>
      </nav>

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
        <div className={styles.tabItem} onClick={exportData}>
          <span className={styles.tabIcon}>⚙️</span>
          <span className={styles.tabLabel}>Export</span>
        </div>
      </nav>
    </div>
  )
}
