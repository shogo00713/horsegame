/**
 * 履歴を表示するモーダル
 *
 * タブで「レース別(過去のレース結果)」と「馬別(馬ごとの着順の推移)」を切り替える。
 * 馬別は、直近の着順の並びから調子を推測するための画面
 */

import { useState } from "react";
import type { RaceHistory, Runner, HorseStats } from "../types/game";
import { horseStats } from "../logic/history";
import FrameNumber from "./FrameNumber";
import styles from "./HistoryModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  history: RaceHistory[];
  runners: Runner[];
};

type Tab = "race" | "horse";

// 着順に応じた見た目のクラス(1着=金、2着=銀、3着=銅、それ以外=控えめ)
function rankTone(rank: number): string {
  if (rank === 1) return styles.toneGold;
  if (rank === 2) return styles.toneSilver;
  if (rank === 3) return styles.toneBronze;
  return styles.toneNormal;
}

function RaceTab({ history }: { history: RaceHistory[] }) {
  if (history.length === 0) {
    return <p className={styles.empty}>まだレースがありません</p>;
  }

  return (
    <div className={styles.raceList}>
      {history.map((h, index) => {
        const top = h.result.slice(0, 3);
        const rest = h.result.slice(3);
        return (
          <section key={h.raceNo} className={styles.raceCard}>
            <header className={styles.raceCardHeader}>
              <span className={styles.raceNo}>第{h.raceNo}戦</span>
              <span className={styles.raceAgo}>
                {index === 0 ? "直前" : `${index + 1}回前`}
              </span>
            </header>

            <ol className={styles.podium}>
              {top.map((r, i) => (
                <li
                  key={r.id}
                  className={`${styles.podiumItem} ${rankTone(i + 1)}`}
                >
                  <span className={styles.podiumRank}>{i + 1}着</span>
                  <span className={styles.podiumName}>{r.name}</span>
                  <span className={styles.podiumOdds}>
                    {r.odds.toFixed(1)}倍
                  </span>
                </li>
              ))}
            </ol>

            <ol className={styles.restList} start={4}>
              {rest.map((r, i) => (
                <li key={r.id} className={styles.restItem}>
                  <span className={styles.restRank}>{i + 4}</span>
                  {r.name}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function HorseCard({
  stats,
  total,
  number,
}: {
  stats: HorseStats;
  total: number;
  number: number;
}) {
  const { runner, ranks, average, wins, top3 } = stats;
  // 左が古く、右が新しい並びにする(推移を左→右で読めるように)
  const chronological = [...ranks].reverse();

  return (
    <section className={styles.horseCard}>
      <header className={styles.horseHeader}>
        <span className={styles.horseTitle}>
          <FrameNumber number={number} size="small" />
          <span className={styles.horseName}>{runner.name}</span>
        </span>
        <span className={styles.horseOdds}>{runner.odds.toFixed(1)}倍</span>
      </header>

      <dl className={styles.horseStats}>
        <div>
          <dt>平均着順</dt>
          <dd>{average === null ? "-" : average.toFixed(1)}</dd>
        </div>
        <div>
          <dt>1着</dt>
          <dd>{wins}</dd>
        </div>
        <div>
          <dt>3着以内</dt>
          <dd>{top3}</dd>
        </div>
      </dl>

      {/* 棒が高いほど上位。右端が最新のレース */}
      <div className={styles.bars} aria-label="着順の推移(右が最新)">
        {chronological.length === 0 ? (
          <span className={styles.barsEmpty}>データなし</span>
        ) : (
          chronological.map((rank, i) => (
            <div
              key={i}
              className={`${styles.bar} ${rankTone(rank)}`}
              style={{ height: `${((total + 1 - rank) / total) * 100}%` }}
              title={`${rank}着`}
            >
              <span className={styles.barLabel}>{rank}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function HorseTab({
  history,
  runners,
}: {
  history: RaceHistory[];
  runners: Runner[];
}) {
  if (history.length === 0) {
    return <p className={styles.empty}>まだレースがありません</p>;
  }

  // 並べ替えず、馬番の順に並べる(出走馬一覧と同じ並び)
  const stats = horseStats(history, runners);

  return (
    <>
      <p className={styles.hint}>
        棒が高いほど上位。右端が最新のレースです。最近の並びから調子を読もう。
      </p>
      <div className={styles.horseGrid}>
        {stats.map((s, i) => (
          <HorseCard
            key={s.runner.id}
            stats={s}
            total={runners.length}
            number={i + 1}
          />
        ))}
      </div>
    </>
  );
}

export default function HistoryModal({
  isOpen,
  onClose,
  history,
  runners,
}: Props) {
  const [tab, setTab] = useState<Tab>("race");

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.content}
        role="dialog"
        aria-label="履歴"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>履歴</h2>
            <p className={styles.subtitle}>直近{history.length}レース</p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "race"}
            className={tab === "race" ? styles.tabActive : styles.tab}
            onClick={() => setTab("race")}
          >
            レース別
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "horse"}
            className={tab === "horse" ? styles.tabActive : styles.tab}
            onClick={() => setTab("horse")}
          >
            馬別
          </button>
        </div>

        <div className={styles.body}>
          {tab === "race" ? (
            <RaceTab history={history} />
          ) : (
            <HorseTab history={history} runners={runners} />
          )}
        </div>
      </div>
    </div>
  );
}
