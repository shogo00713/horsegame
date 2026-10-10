/**
 * 馬の「調子」を決定・遷移させる関数たち
 *
 * 調子とは画面には出さない隠しパラメータ
 * 各レースごとに、隣り合う調子の馬どうしが入れ替わる形でゆっくり遷移する
 * 同じ調子は数レース続くことが多いので、連続した過去の着順から「最近調子が良さそう」と推測できる
 *
 * 調子は5段階 (0: 絶不調 〜 4: 絶好調)
 */

import type { Runner } from "../types/game";

// 馬の調子の種類・段階数・デフォルト値
export type Condition = 0 | 1 | 2 | 3 | 4;
export const CONDITION_LEVELS = 5;
export const NORMAL_CONDITION: Condition = 2; // デフォルトは2

// 調子の割合、絶不調1・不調1・普通3・好調2・絶好調1
export const DECK_RATIO = [1, 1, 3, 2, 1];

// 隣り合う調子の入れ替わりやすさ(1レースあたり)
// 添字は下側の調子: [絶不調↔不調 20%, 不調↔普通 30%, 普通↔好調 30%, 好調↔絶好調 20%]
export const SWAP_PROBABILITY = [0.2, 0.3, 0.3, 0.2];

// 調子による強さの倍率
// 絶不調0.05倍・不調0.2倍・普通1倍・好調5倍・絶好調8倍
export const MULTIPLIERS = [0.05, 0.2, 1, 5, 8];
export const MIN_WEIGHT = 1e-6; // 絶不調でも重みは正のままにするための最小値

// 全馬ぶんの調子を、馬のIDごとにまとめた形
export type Conditions = Record<string, Condition>;

// 表示名(デバッグ表示用)
export const CONDITION_LABELS = ["絶不調", "不調", "普通", "好調", "絶好調"];

/**
 * 調子の割合から、良い順に調子を並べた配列(デッキ)をつくる関数
 *
 * 今のそのままなら、 [4,3,3,2,2,1,1,0] のような配列になる
 *
 * @param counts 調子ごとの頭数
 * @returns 調子の配列(良い順)
 */
export function buildDeck(counts: number[]): Condition[] {
  const deck: Condition[] = [];
  for (let level = counts.length - 1; level >= 0; level--) {
    for (let i = 0; i < counts[level]; i++) {
      deck.push(level as Condition);
    }
  }
  return deck;
}

/**
 * 最初のレースの前に、ランダムに調子を配る関数
 *
 * @param runners
 * @param random 固定の乱数
 * @returns <馬ID, 調子> の形のオブジェクト
 */
function dealRandomConditions(
  runners: Runner[],
  random: () => number,
): Conditions {
  // 調子のデッキを作る(先頭から良い順になっている)
  const deck = buildDeck(DECK_RATIO);

  // Fisher–Yates シャッフル
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return Object.fromEntries(runners.map((r, i) => [r.id, deck[i]]));
}

/**
 * 全馬の調子を決める総合関数
 *
 * 初回はランダムに調子を配る
 * 2回目以降は、前のレースの調子から「入れ替え」で次の調子にする
 *
 * @param runners 馬の配列
 * @param previous 前のレースの調子 (初回は undefined)
 * @param random 固定の乱数
 * @returns <馬ID, 調子> の形のオブジェクト
 */
export function dealConditions(
  runners: Runner[],
  previous?: Conditions,
  random: () => number = Math.random,
): Conditions {
  // 初回はランダムに配る
  if (!previous) return dealRandomConditions(runners, random);

  const next: Conditions = { ...previous };
  const swapped = new Set<string>(); // 今回すでに入れ替わった馬(連続で動かさない)

  // 上の調子から順に、隣の調子との入れ替えを行う
  for (let upper = CONDITION_LEVELS - 1; upper >= 1; upper--) {
    const lower = upper - 1;
    const probability = SWAP_PROBABILITY[lower];

    for (const runner of runners) {
      if (next[runner.id] !== upper || swapped.has(runner.id)) continue;
      if (random() >= probability) continue;

      // 下側の調子で、まだ動いていない馬から1頭を選んで入れ替える
      const candidates = runners.filter(
        (r) => next[r.id] === lower && !swapped.has(r.id),
      );
      if (candidates.length === 0) continue;
      const partner = candidates[Math.floor(random() * candidates.length)];

      next[runner.id] = lower as Condition;
      next[partner.id] = upper as Condition;
      swapped.add(runner.id);
      swapped.add(partner.id);
    }
  }

  return next;
}

/**
 * 調子を掛けて、各レースの馬の強さを決定する関数
 *
 * 基本の強さ × 調子の倍率 で、着順を決めるときの重みになる
 *
 * @param baseWeight 基本の強さ
 * @param condition 調子
 * @returns 今回のレースの強さ(重み)
 */
export function applyCondition(
  baseWeight: number,
  condition: Condition,
): number {
  return Math.max(MIN_WEIGHT, baseWeight * MULTIPLIERS[condition]);
}

/**
 * 与えられた調子が、正しい調子の形式をしているかを判定する関数
 *
 * 調子は、localStorage から復元するので、外部から与えられた値が正しいかを別途判定する必要がある
 *
 * @param value 調子の形式をしているはずのもの
 * @param runners 馬のデータ
 * @returns boolean (正しい形式ならtrue)
 */
export function isValidConditions(
  value: unknown,
  runners: Runner[],
): value is Conditions {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return runners.every((r) => {
    const c = record[r.id];
    return (
      typeof c === "number" &&
      Number.isInteger(c) &&
      c >= 0 &&
      c < CONDITION_LEVELS
    );
  });
}
