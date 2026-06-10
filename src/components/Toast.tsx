'use client'
import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

interface ToastMsg { message: string; type: 'success' | 'error'; id: number }

let addToast: (msg: string, type?: 'success' | 'error') => void = () => {}

export function toast(msg: string, type: 'success' | 'error' = 'success') {
  addToast(msg, type)
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  useEffect(() => {
    addToast = (message, type = 'success') => {
      const id = Date.now()
      setToasts(t => [...t, { message, type, id }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
    }
  }, [])

  return (
    <div className={styles.wrap}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>{t.message}</div>
      ))}
    </div>
  )
}
