/**
 * 確定済みの1件分のベットを、1行の簡易表示にするコンポーネント
 *
 * クリックすると編集画面を開く(onEdit)。×ボタンは削除専用
 */

import type { BetDraft } from "../types/game";
import { betTypeLabel, formatSelectedRunners } from "../logic/betRules";
import styles from "./BetSummary.module.css";

type BetSummaryProps = {
  bet: BetDraft;
  index: number;
  maxPayout: number | null; // 全部当たったときの払戻額(未成立のベットはnull)
  disabled: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

export default function BetSummary({
  bet,
  index,
  maxPayout,
  disabled,
  onEdit,
  onRemove,
}: BetSummaryProps) {
  const runnerNames = formatSelectedRunners(bet);

  return (
    <div className={styles.betSummary}>
      <button
        type="button"
        className={styles.editButton}
        disabled={disabled}
        onClick={onEdit}
      >
        <span className={styles.info}>
          <span className={styles.index}>BET{index + 1}</span>
          <span className={styles.betType}>{betTypeLabel(bet.betType)}</span>
          <span className={styles.runnerNames}>{runnerNames}</span>
        </span>

        <span className={styles.stats}>
          <span className={styles.stat}>
            <span className={styles.statLabel}>賭け金</span>
            <span className={styles.statValue}>¥{bet.betstr}</span>
          </span>
          <span className={styles.stat}>
            <span className={styles.statLabel}>最大払戻</span>
            <span className={styles.payoutValue}>
              {maxPayout === null ? "-" : `¥${maxPayout}`}
            </span>
          </span>
        </span>
      </button>
      <button
        type="button"
        className={styles.removeButton}
        disabled={disabled}
        onClick={onRemove}
        aria-label={`BET ${index + 1} を削除`}
      >
        ×
      </button>
    </div>
  );
}
