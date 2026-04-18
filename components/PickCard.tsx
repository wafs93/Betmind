'use client'

import { Pick, OddsTier, TIER_CONFIGS } from '@/lib/types'
import styles from './PickCard.module.css'

interface Props {
  pick: Pick
  tier: OddsTier
  index: number
}

export default function PickCard({ pick, tier, index }: Props) {
  const config = TIER_CONFIGS[tier]

  return (
    <div className={styles.card} style={{ animationDelay: `${index * 80}ms` }}>
      <div className={styles.accent} style={{ background: config.color }} />
      <div className={styles.header}>
        <div>
          <div className={styles.match}>{pick.match}</div>
          <div className={styles.league}>{pick.league}</div>
        </div>
        <div
          className={styles.oddsBadge}
          style={{ background: config.bgColor, color: config.textColor }}
        >
          {pick.individual_odds.toFixed(2)}
        </div>
      </div>
      <div className={styles.selection}>
        Pick: <span>{pick.selection}</span>
      </div>
      <div className={styles.reasoning}>{pick.reasoning}</div>
      <div className={styles.confRow}>
        <span className={styles.confLabel}>confidence</span>
        <div className={styles.confBar}>
          <div
            className={styles.confFill}
            style={{ width: `${pick.confidence}%`, background: config.color }}
          />
        </div>
        <span className={styles.confVal} style={{ color: config.color }}>
          {pick.confidence}%
        </span>
      </div>
    </div>
  )
}
