'use client'
import { useRouter } from 'next/navigation'
import type { MajorMarathon } from '@/lib/majors'
import styles from './MajorDetailClient.module.css'

interface Props { major: MajorMarathon }

export default function MajorDetailClient({ major }: Props) {
  const router = useRouter()

  return (
    <div className={styles.wrap}>
      {/* BACK */}
      <button className={styles.back} onClick={() => router.push('/app/majors')}>
        ← Back to Majors
      </button>

      {/* HEADER */}
      <div className={styles.header} style={{ borderLeftColor: major.color }}>
        <div className={styles.flag}>{major.flag}</div>
        <div>
          <div className={styles.title}>{major.name}</div>
          <div className={styles.subtitle}>{major.city}, {major.country}</div>
        </div>
      </div>

      <div className={styles.tagline}>
        Beyond the lottery and qualifying times — every way to get to the start line.
      </div>

      {/* ALTERNATIVE ENTRY METHODS */}
      {major.alternativeEntries.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>Other Ways In</div>
          <div className={styles.entryGrid}>
            {major.alternativeEntries.map((alt, i) => (
              <div key={i} className={styles.entryCard}>
                <div className={styles.entryCardTop}>
                  <div className={styles.entryName}>{alt.name}</div>
                  {alt.guaranteed
                    ? <div className={styles.guaranteedBadge}>⚡ Guaranteed Entry</div>
                    : <div className={styles.notGuaranteedBadge}>Not guaranteed</div>
                  }
                </div>
                <div className={styles.entryDesc}>{alt.description}</div>
                <a
                  href={alt.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.entryLink}
                >
                  Official source ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CHARITY */}
      {major.charity && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>🎗 Run for Charity</div>

          {/* STATS ROW */}
          {(major.charity.spotsApprox || major.charity.numPartners || major.charity.minFundraisingUSD) && (
            <div className={styles.charityStats}>
              {major.charity.spotsApprox && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>~{major.charity.spotsApprox.toLocaleString()}</div>
                  <div className={styles.charityStatLabel}>Charity Spots</div>
                </div>
              )}
              {major.charity.numPartners && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>{major.charity.numPartners}</div>
                  <div className={styles.charityStatLabel}>Partner Orgs</div>
                </div>
              )}
              {major.charity.minFundraisingUSD && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>${major.charity.minFundraisingUSD.toLocaleString()}</div>
                  <div className={styles.charityStatLabel}>Min. Fundraising (USD)</div>
                </div>
              )}
              {major.charity.maxFundraisingUSD && major.charity.maxFundraisingUSD !== major.charity.minFundraisingUSD && (
                <div className={styles.charityStat}>
                  <div className={styles.charityStatVal}>~${major.charity.maxFundraisingUSD.toLocaleString()}</div>
                  <div className={styles.charityStatLabel}>Typical Ask (USD)</div>
                </div>
              )}
            </div>
          )}

          <div className={styles.charityCard}>
            <div className={styles.charitySection}>
              <div className={styles.charityLabel}>How It Works</div>
              <div className={styles.charityText}>{major.charity.fundraisingNote}</div>
            </div>
            <div className={styles.charitySection}>
              <div className={styles.charityLabel}>How to Apply</div>
              <div className={styles.charityText}>{major.charity.applicationNote}</div>
            </div>
            <a
              href={major.charity.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.charityLink}
            >
              View charity partners ↗
            </a>
          </div>
        </section>
      )}

      {/* FOOTER NOTE */}
      <div className={styles.footer}>
        All entry information sourced from official race websites. Dates, fees, and requirements
        change year to year — always verify directly with the race before applying.
        <a href={major.entryUrl} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
          Official {major.name} entry site ↗
        </a>
      </div>
    </div>
  )
}
