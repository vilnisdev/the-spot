'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './pageNav.module.css'

const LINKS = [
  { href: '/', label: 'Map' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
]

export default function PageNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      {LINKS.map((link, i) => (
        <Fragment key={link.href}>
          {i > 0 && <span className={styles.divider}>·</span>}
          {pathname === link.href ? (
            <span className={styles.current}>{link.label}</span>
          ) : (
            <Link href={link.href} className={styles.link}>{link.label}</Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
