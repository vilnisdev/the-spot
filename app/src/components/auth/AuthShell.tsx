import Link from 'next/link'
import styles from './authShell.module.css'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.wordmark}>Coppice</Link>
      <div className={styles.cardWrap}>{children}</div>
    </main>
  )
}
