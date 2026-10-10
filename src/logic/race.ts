/**
 * レースの順位確定関数たち
 *
 * 各レースでは、各馬の強さに基づいて着順を決定する
 * 強さをベースに1頭ずつピックする方式で馬が選ばれる
 */

import { Runner } from "../types/game";
import { applyCondition, NORMAL_CONDITION, type Conditions } from "./condition";

/**
 * ランダムに1頭の馬を選ぶ関数
 *
 * 重みに応じてランダムに1頭の馬を選ぶ
 * Math.random() に基づくランダム選出
 *
 * @param pool
 * @param weighted
 * @returns
 */
export function pickWinnerByOdds(
  pool: Runner[],
  weighted: { runner: Runner; weight: number }[],
): Runner {
  // pool に残っている馬だけから重みを抽出する
  const poolWeighted = weighted.filter((w) =>
    pool.some((r) => r.id === w.runner.id),
  );
  // 重みの合計を計算しそこまでの値から乱数を生成し、該当範囲の馬を選ぶ
  const total = poolWeighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;

  for (const w of poolWeighted) {
    r -= w.weight;
    if (r <= 0) return w.runner;
  }
  return poolWeighted[poolWeighted.length - 1].runner;
}

/**
 * レースの着順を決定する関数
 *
 * 馬に重みをつけた後、ランダムに1頭ずつ選んで着順を決定する
 *
 * 重みはオッズの逆数をもとに、調子(conditions)で補正する。
 * 調子は表示用のオッズには影響しない(払い戻しはオッズどおり)。
 * conditions を省略した場合は全馬「普通」として扱う
 *
 * @param runners
 * @param conditions 馬のIDと調子
 * @returns
 */
export function makeFinishOrder(
  runners: Runner[],
  conditions: Conditions = {},
): Runner[] {
  // 各馬に重みを付ける(strength、無ければオッズの逆数 → 調子で補正)
  const baseWeights = runners.map((r) => r.strength ?? 1 / r.odds);
  const weighted = runners.map((r, i) => ({
    runner: r,
    weight: applyCondition(
      baseWeights[i],
      conditions[r.id] ?? NORMAL_CONDITION,
    ),
  }));

  let pool = [...runners];
  const finish: Runner[] = [];

  while (pool.length > 0) {
    const winner = pickWinnerByOdds(pool, weighted);
    finish.push(winner);
    pool = pool.filter((r) => r.id !== winner.id);
  }
  return finish;
}
