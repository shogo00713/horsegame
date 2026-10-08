/**
 * オッズと配当を、勝率・的中確率の「近似」から決めるロジック
 *
 * 調子で勝率が大きく変わるが、全パターンは数えない。
 * 固定の乱数で作った調子の配り方を何千通りか試して、その平均を取る。
 * 頭数が多くても軽く、調子が分からない人の期待値は、ほぼ払い戻し率に近くなる
 */

import { conditionDeck, applyCondition, type Condition } from "./condition";
import type { BetType, Runner } from "../types/game";

// 券種ごとの払い戻し率(調子が分からない人が、平均して戻る割合)
// 1を超えてもよい。手堅い券種は低く、当たりにくい券種は高くして、券種ごとの個性を出す
export const RTP_BY_TYPE: Record<BetType, number> = {
  PLACE: 0.85,
  WIN: 0.9,
  QUINELLA: 1.2,
  EXACTA: 1.8,
  TRIO: 1.8,
  TRIFECTA: 4.5,
};

const MIN_ODDS = 1.1;

// ----- 調子の配り方をサンプリングして、確率を求める -----
// 調子の全パターンは多すぎて数えられないので、固定の乱数でランダムに作った
// パターンの平均を取る(毎回同じ結果になる)

// 固定のシードから、毎回同じ並びの乱数を作る
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 調子の配り方を、ランダムに count 通り作る
function samplePatterns(horseCount: number, count: number): Condition[][] {
  const random = seededRandom(20240601);
  const base = conditionDeck(horseCount);
  return Array.from({ length: count }, () => {
    const deck = [...base];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  });
}

// 1つの配り方での、各馬の重み
function weightsFor(strengths: number[], pattern: Condition[]): number[] {
  return strengths.map((s, i) => applyCondition(s, pattern[i] ?? 2));
}

const WIN_SAMPLES = 20000;
const COMBO_SAMPLES = 3000;

/** 調子が分からない状態での、各馬の1着になる確率(サンプリングによる近似) */
export function marginalWinProbabilities(strengths: number[]): number[] {
  const totals = new Array<number>(strengths.length).fill(0);

  for (const pattern of samplePatterns(strengths.length, WIN_SAMPLES)) {
    const w = weightsFor(strengths, pattern);
    const sum = w.reduce((a, b) => a + b, 0);
    w.forEach((x, i) => (totals[i] += x / sum));
  }

  return totals.map((t) => t / WIN_SAMPLES);
}

/**
 * 強さから、表示するオッズ(単勝の倍率)を決める
 *
 * @param strengths 各馬の基本の強さ
 * @param rtp 払い戻し率(0.9なら、賭け金の平均90%が戻る)
 */
export function deriveOdds(strengths: number[], rtp: number): number[] {
  return marginalWinProbabilities(strengths).map((p) =>
    Math.max(MIN_ODDS, Math.round((rtp / p) * 10) / 10),
  );
}

// 着順の確率(重み付きで1頭ずつ選ぶ方式)で、指定した順に上位を占める確率
function orderedProbability(weights: number[], order: number[]): number {
  let remaining = weights.reduce((a, b) => a + b, 0);
  let p = 1;
  for (const i of order) {
    p *= weights[i] / remaining;
    remaining -= weights[i];
  }
  return p;
}

// 配列の並べ方をすべて列挙する
function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [
      x,
      ...rest,
    ]),
  );
}

// 計算結果のキャッシュ(画面の再描画のたびに計算し直さないため)
const hitProbabilityCache = new Map<string, number>();

/**
 * 調子が分からない状態での、そのベットが的中する確率(近似)
 *
 * @param betType 賭け方
 * @param selected 選んだ馬
 * @param field 出走馬全員
 */
export function hitProbability(
  betType: BetType,
  selected: Runner[],
  field: Runner[],
): number {
  const strengthOf = (r: Runner) => r.strength ?? 1 / r.odds;
  const key = [
    betType,
    selected.map((r) => r.id).join(","),
    field.map((r) => `${r.id}:${strengthOf(r)}`).join(","),
  ].join("|");
  const cached = hitProbabilityCache.get(key);
  if (cached !== undefined) return cached;

  const strengths = field.map(strengthOf);
  const picked = selected.map((r) => field.findIndex((f) => f.id === r.id));
  const others = field.map((_, i) => i).filter((i) => !picked.includes(i));

  // 1つの配り方での、的中確率
  function probabilityFor(weights: number[]): number {
    switch (betType) {
      case "WIN":
      case "EXACTA":
      case "TRIFECTA":
        return orderedProbability(weights, picked);
      case "QUINELLA":
      case "TRIO":
        return permutations(picked).reduce(
          (sum, order) => sum + orderedProbability(weights, order),
          0,
        );
      case "PLACE": {
        // 3着以内に入る = 1着か、2着か、3着になる確率の合計
        const me = picked[0];
        let p = orderedProbability(weights, [me]);
        for (const a of others) {
          p += orderedProbability(weights, [a, me]);
          for (const b of others) {
            if (a !== b) p += orderedProbability(weights, [a, b, me]);
          }
        }
        return p;
      }
    }
  }

  let result: number;
  if (betType === "PLACE" && field.length <= 3) {
    result = 1;
  } else {
    const patterns = samplePatterns(field.length, COMBO_SAMPLES);
    result =
      patterns.reduce(
        (sum, pattern) => sum + probabilityFor(weightsFor(strengths, pattern)),
        0,
      ) / patterns.length;
  }

  hitProbabilityCache.set(key, result);
  return result;
}

/**
 * 的中確率から決めた、そのベットの配当倍率(賭け金に対する倍率)
 *
 * 券種ごとの払い戻し率になるように、「払い戻し率 ÷ 的中確率」とする(0.1刻み)。
 * 上限は設けない(当たりにくい組み合わせは、非常に高い配当になる)
 */
export function payoutMultiplier(
  betType: BetType,
  selected: Runner[],
  field: Runner[],
): number {
  const p = hitProbability(betType, selected, field);
  return Math.max(MIN_ODDS, Math.round((RTP_BY_TYPE[betType] / p) * 10) / 10);
}
