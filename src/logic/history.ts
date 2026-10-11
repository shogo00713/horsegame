/**
 * レース履歴から、馬別の成績を集計する関数
 *
 * 純粋に各履歴として残しているレースから、馬ごとの成績を集計する
 */

import type { RaceHistory, Runner, HorseStats } from "../types/game";

// 履歴として残すレース数の上限
export const MAX_HISTORY = 20;

/**
 * レース履歴から、馬別の成績を集計する関数
 *
 * @param history レースの履歴
 * @param runners 各馬
 * @returns 馬ごとの成績
 */
export function horseStats(
  history: RaceHistory[],
  runners: Runner[],
): HorseStats[] {
  return runners.map((runner) => {
    const ranks = history
      .map((h) => h.result.findIndex((r) => r.id === runner.id) + 1)
      .filter((rank) => rank > 0);

    return {
      runner,
      ranks,
      average:
        ranks.length > 0
          ? ranks.reduce((sum, r) => sum + r, 0) / ranks.length
          : null,
      wins: ranks.filter((r) => r === 1).length,
      top3: ranks.filter((r) => r <= 3).length,
    };
  });
}
