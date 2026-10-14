/**
 * 出走馬一覧(ベット受付中に表示する)
 *
 * 枠番・馬名・一言紹介・オッズを並べる。
 * 前回のレースで3位以内に入った馬には、「前回1位」などの印が付く
 */

import type { Runner } from "../types/game";
import FrameNumber from "./FrameNumber";
import styles from "./EntryList.module.css";
import { HorseIcon } from "./Icon";

type EntryListProps = {
  runners: Runner[];
  lastResult: Runner[]; // 前回のレースの着順(まだ無ければ空)
};

// 前回の着順(1〜3位)に応じた印の色
const TONE_CLASS = [styles.toneGold, styles.toneSilver, styles.toneBronze];

export default function EntryList({ runners, lastResult }: EntryListProps) {
  return (
    <div className={styles.list} data-testid="entry-list">
      <div className={styles.head}>
        <span className={styles.headFrame}>枠番</span>
        <span className={styles.headName}>馬名</span>
        <span className={styles.headOdds}>オッズ</span>
      </div>

      {runners.map((runner, i) => {
        const lastRank = lastResult.findIndex((r) => r.id === runner.id) + 1;

        return (
          <div key={runner.id} data-testid="entry-row" className={styles.row}>
            <FrameNumber number={i + 1} />
            <HorseIcon />
            <div className={styles.info}>
              <span className={styles.name}>{runner.name}</span>
              {runner.description && (
                <span className={styles.description}>{runner.description}</span>
              )}
            </div>
            {lastRank >= 1 && lastRank <= 3 && (
              <span
                className={`${styles.lastRank} ${TONE_CLASS[lastRank - 1]}`}
              >
                前回{lastRank}位
              </span>
            )}
            <span className={styles.odds}>{runner.odds.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
