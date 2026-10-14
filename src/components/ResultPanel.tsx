/**
 * 着順を表示するコンポーネント
 *
 * phaseに応じて表示内容が変わる
 *  - BETTING: 出走馬一覧(枠番・馬名・オッズ。前回3位以内の馬には印が付く)
 *  - DRAWING: 抽選演出(順位枠の上を馬名のプレートが動く)
 *  - PAYOUT: 着順を表示
 */

import { useEffect, useState } from "react";
import type { Phase, Runner } from "../types/game";
import {
  createRaceScript,
  progressAt,
  SETTLE_PROGRESS,
} from "../logic/controlRaceAnimation";
import EntryList from "./EntryList";
import styles from "./ResultPanel.module.css";

// 親コンポーネントから渡されるprops
type ResultPanelProps = {
  phase: Phase;
  runners: Runner[];
  result: Runner[];
  betMarks: Record<string, number[]>; // 馬のID → その馬を選んでいるBETの番号
  maxBets?: number; // BETの最大件数(印の列の数)
  onSkip: () => void;
};

// BET1〜BETnの印を、番号ごとに決まった列へ並べる(縦に見て、どのBETか分かるように)
// 選んでいないBETの列は、空のまま幅だけ確保する
function BetMarkSlots({
  marks,
  count,
  className,
}: {
  marks: number[];
  count: number;
  className: string;
}) {
  return (
    <span className={styles.markSlots}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={styles.markSlot}>
          {marks.includes(i + 1) && (
            <span className={className}>BET{i + 1}</span>
          )}
        </span>
      ))}
    </span>
  );
}

export default function ResultPanel({
  phase,
  runners,
  result,
  betMarks,
  maxBets = 5,
  onSkip,
}: ResultPanelProps) {
  // 抽選演出用: レースの進捗(0〜1)と、その時点の順位順の並び
  // 結果(result)は既に確定していて、ここでは途中経過の見せ方だけを変える
  const [progress, setProgress] = useState(0);
  const [drawOrder, setDrawOrder] = useState<Runner[] | null>(null);

  useEffect(() => {
    if (phase !== "DRAWING") return;
    const orderAt = createRaceScript(result);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const p = progressAt(Date.now() - startedAt);
      setProgress(p);
      setDrawOrder(orderAt(p));
    }, 100);
    return () => {
      clearInterval(timer);
      setDrawOrder(null);
      setProgress(0);
    };
  }, [phase, result]);

  const isDrawing = phase === "DRAWING";
  const isBetting = phase === "BETTING";

  // 選んだ馬をハイライトする用のID

  return (
    <div className={styles.resultPanel}>
      {isBetting && <EntryList runners={runners} lastResult={result} />}

      {isDrawing && (
        <div
          className={styles.raceProgress}
          role="progressbar"
          aria-label="レースの進行"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span className={styles.raceProgressLabel}>スタート</span>
          <div className={styles.raceProgressTrack}>
            <div
              className={styles.raceProgressFill}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className={styles.raceProgressLabel}>ゴール</span>
        </div>
      )}

      {!isBetting && (
        <div className={styles.finishLines}>
          {/* 今回の着順を表示する部分 */}
          {runners.map((runner, i) => {
            const rank = i + 1;
            const rowMarks =
              phase === "PAYOUT" ? (betMarks[result?.[i]?.id] ?? []) : [];
            const isSelected = rowMarks.length > 0;
            // 演出中は、名前はプレート側に出すので、枠の中は空にしておく
            const shownName =
              phase === "PAYOUT"
                ? (result?.[i]?.name ?? "-")
                : isDrawing
                  ? ""
                  : "-";

            return (
              <div
                key={runner.id}
                data-testid="finish-line"
                className={
                  isSelected
                    ? `${styles.finishLine} ${styles.finishLineSelected}`
                    : styles.finishLine
                }
              >
                <span
                  className={`${styles.finishRank} ${styles[`finishRank${rank}`] ?? ""}`}
                >
                  {rank}位:
                </span>
                <span
                  className={`${styles.finishName} ${styles[`finishName${rank}`] ?? ""}`}
                >
                  {shownName}
                </span>
                {phase === "PAYOUT" && (
                  <BetMarkSlots
                    marks={rowMarks}
                    count={maxBets}
                    className={styles.rowTag}
                  />
                )}
              </div>
            );
          })}

          {/* 演出中: 名前入りのプレートが、固定の順位枠の上を移動する */}
          {isDrawing &&
            drawOrder?.map((runner, rank) => {
              const marks = betMarks[runner.id] ?? [];
              const isMine = marks.length > 0;
              const isSettled = progress >= SETTLE_PROGRESS;
              return (
                <div
                  key={runner.id}
                  data-testid="runner-plate"
                  data-rank={rank + 1}
                  className={[
                    styles.plate,
                    isMine && styles.plateMine,
                    isSettled && styles.plateSettled,
                    isSettled && rank === 0 && styles.plateWinner,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    transform: `translateY(calc(${rank} * (var(--row-h) + var(--row-gap))))`,
                  }}
                >
                  <span>{runner.name}</span>
                  <BetMarkSlots
                    marks={marks}
                    count={maxBets}
                    className={styles.plateTag}
                  />
                </div>
              );
            })}
        </div>
      )}

      {isDrawing && (
        <button type="button" className={styles.skipButton} onClick={onSkip}>
          結果へスキップ
        </button>
      )}
    </div>
  );
}
