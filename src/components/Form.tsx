import styles from './Form.module.css'

export function FormGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.group}>{children}</div>
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className={styles.label}>{children}</label>
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.input} {...props} />
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props
  return <select className={styles.select} {...rest}>{children}</select>
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}

export function Btn({
  children, variant = 'ghost', type = 'button', disabled, onClick, style
}: {
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'danger' | 'accent'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`${styles.btn} ${styles[variant]}`}>
      {children}
    </button>
  )
}
