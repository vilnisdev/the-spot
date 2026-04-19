import { existsSync } from 'fs'
import { join } from 'path'
import Image from 'next/image'
import LandingAuthForm from './LandingAuthForm'
import styles from './landingPage.module.css'

const features = [
  {
    title: 'Drop a Pin',
    body: 'Mark any place that matters — a hidden café, a quiet trail, a view worth returning to.',
  },
  {
    title: 'Build your Spot',
    body: 'Add photographs, audio, and notes. Each Spot becomes a living record of a place.',
  },
  {
    title: 'Share with your Network',
    body: 'Spots stay private to your Network. Only the people you trust see what you find.',
  },
]

export default function LandingPage() {
  const screenshotExists = existsSync(join(process.cwd(), 'public', 'landing-showcase.png'))

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <span className={styles.wordmark}>The Spot</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.headline}>Your field journal<br />for hidden places.</h1>
          <p className={styles.subline}>
            Drop pins. Collect spots. Share only with people you trust.
          </p>
        </div>
        <div className={styles.heroForm}>
          <LandingAuthForm />
        </div>
      </section>

      <section className={styles.features}>
        {features.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureBody}>{f.body}</p>
          </div>
        ))}
      </section>

      <section className={styles.showcase}>
        <div className={styles.showcaseInner}>
          <div className={styles.screenshotWrap}>
            {screenshotExists ? (
              <Image
                src="/landing-showcase.png"
                alt="The Spot — map view with an open spot card"
                fill
                className={styles.screenshot}
                priority={false}
              />
            ) : (
              <div className={styles.screenshotPlaceholder} aria-hidden="true" />
            )}
          </div>
          <p className={styles.showcaseCaption}>
            Every pin is a story. Every network is a circle of trust.
          </p>
        </div>
      </section>
    </div>
  )
}
