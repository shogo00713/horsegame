/**
 * 払い戻し結果を表示するパネル
 *
 * PAYOUTフェーズのときだけ表示される(App.tsx側で制御)
 * ベットごとの的中/はずれと、合計の払い戻し額を表示する
 *
 * BETパネルと見た目を揃えるため、常にmaxBets件ぶんの固定スロットを表示する
 * (ベットしなかった分は空の点線スロットのまま)
 */

import type { BetResult } from "../types/game";
import { betTypeLabel, formatSelectedRunners } from "../logic/checkBetRules";
import styles from "./PayoutPanel.module.css";

const acceptButtonText = (payout: number) => {
  return payout > 0 ? `¥${payout} 受け取る` : "次に進む";
};

// 親コンポーネントから渡されるprops
type PayoutPanelProps = {
  betResults: BetResult[];
  payout: number;
  maxBets: number;
  onAccept: () => void;
};

export default function PayoutPanel({
  betResults,
  payout,
  maxBets,
  onAccept,
}: PayoutPanelProps) {
  return (
    <div className={styles.payoutPanel}>
      <div className={styles.resultList}>
        {Array.from({ length: maxBets }, (_, index) => {
          const result = betResults[index];

          if (!result) {
            return <div key={`empty-${index}`} className={styles.emptySlot} />;
          }

          const { bet, payout: betPayout } = result;
          const runnerNames = formatSelectedRunners(bet);
          const isHit = betPayout > 0;

          return (
            <div key={bet.id} className={styles.betResultRow}>
              <span>{index + 1}</span>
              <div className={styles.betResultDetail}>
                <span className={styles.betType}>
                  {betTypeLabel(bet.betType)}
                </span>
                <span className={styles.runnerNames}>{runnerNames}</span>
              </div>
              <span className={isHit ? styles.hit : styles.miss}>
                {isHit ? "的中" : "はずれ"}
              </span>
              <span className={styles.betPayout}>¥{betPayout}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>払戻合計</span>
        <span className={styles.totalValue}>¥{payout}</span>
      </div>

      <button className={styles.acceptButton} onClick={onAccept}>
        {acceptButtonText(payout)}
      </button>
    </div>
  );
}
