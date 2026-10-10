/**
 * オッズを的中確率から決定する関数たち
 *
 * オッズは的中確率と払い戻し率から決定される
 * 単勝のオッズは、オッズそのものとして広く活用される
 * それ以外の賭け方のオッズは、必要となる時のみ計算される
 */

import {
  applyCondition,
  DECK_RATIO,
  NORMAL_CONDITION,
  type Condition,
} from "./condition";
import type { BetType, Runner } from "../types/game";

// 券種ごとの払い戻し率(調子が分からない人が、平均して戻る割合)
// 本来1以上はあまり設定しないが、面白さのために極めて高い値を入れている
export const RTP_BY_TYPE: Record<BetType, number> = {
  PLACE: 0.85,
  WIN: 0.9,
  QUINELLA: 1.2,
  EXACTA: 1.8,
  TRIO: 1.8,
  TRIFECTA: 4.5,
};

// 最低限のオッズ
const MIN_ODDS = 1.1;

/**
 * 全ての調子のパターンを列挙した2次元配列を作成する関数
 *
 * 再帰処理により、[4,3,3,2,2,2,1,0] の配列とその並び替えを全部作成する
 * 並び替えの種類は、全部で 8!/2!*3! = 3360 通り
 *
 * @param remaining まだ置いていない調子の枚数
 * @returns 8 × 3360 の配列
 */
function enumeratePatterns(remaining: number[]): Condition[][] {
  // 全部置き終わったら、「空の並び」を1つだけ返す
  if (remaining.every((n) => n === 0)) return [[]];

  const result: Condition[][] = [];
  for (let level = remaining.length - 1; level >= 0; level--) {
    if (remaining[level] === 0) continue; // このレベルはもう残っていない

    const next = [...remaining];
    next[level]--; // 1枚置いた分を減らす

    for (const sub of enumeratePatterns(next)) {
      result.push([level as Condition, ...sub]);
    }
  }
  return result;
}

// すべての調子のパターンを列挙してキャッシュしておく
const ALL_PATTERNS = enumeratePatterns(DECK_RATIO);

/**
 * ある調子のパターンに基づいて、各馬の強さを計算する関数
 *
 * 基本の強さと調子のパターンの配列から、各馬の強さを計算する
 *
 * @param strengths 基本の強さの配列
 * @param pattern 調子の配列
 * @returns 各馬のそのレースの強さの配列
 */
function weightsForOneRace(
  strengths: number[],
  pattern: Condition[],
): number[] {
  return strengths.map((s, i) =>
    applyCondition(s, pattern[i] ?? NORMAL_CONDITION),
  );
}

// --- 単勝用 ---
/**
 * 調子が分からない状態(均一に全パターンの期待値として)での、各馬の1着になる確率
 *
 * ALL_PATTERNS で全パターンを試す
 *
 * @param strengths 各馬の基本の強さ
 * @returns 各馬の1着になる確率
 */
export function marginalWinProbabilities(strengths: number[]): number[] {
  // 各馬の1着になる確率の合計を加算しておく
  const totals = new Array<number>(strengths.length).fill(0);

  for (const pattern of ALL_PATTERNS) {
    const w = weightsForOneRace(strengths, pattern);
    const sum = w.reduce((a, b) => a + b, 0);
    w.forEach((x, i) => (totals[i] += x / sum));
  }
  // パターン数で割って、各馬の1着になる確率を返す
  return totals.map((t) => t / ALL_PATTERNS.length);
}

/**
 * 1位になる確率から、表示するオッズ(単勝の倍率)を決める
 *
 * 0.1刻みで丸めて、最低オッズは MIN_ODDS とする
 *
 * @param strengths 各馬の基本の強さ
 * @param rtp 払い戻し率
 * @returns 各馬の単勝のオッズ
 */
export function deriveOdds(strengths: number[], rtp: number): number[] {
  return marginalWinProbabilities(strengths).map((p) =>
    Math.max(MIN_ODDS, Math.round((rtp / p) * 10) / 10),
  );
}
// --------------

// --- 単勝以外用 ---
/**
 * その着順になる確率を計算する関数
 *
 * 調子を考慮済みの強さと着順を受け取って、それになる確率を返す
 *
 * @param weights 各馬の強さ
 * @param order 想定する着順
 * @returns その着順になる確率(小数)
 */
function orderedProbability(weights: number[], order: number[]): number {
  let remaining = weights.reduce((a, b) => a + b, 0);
  let p = 1;
  for (const i of order) {
    p *= weights[i] / remaining;
    remaining -= weights[i];
  }
  return p;
}

/**
 * 配列の並べ方をすべて列挙する関数
 *
 * 順序を考慮しない賭け方では、この関数で全パターンを足すことによって、的中確率を計算する
 *
 * @param items 並べる要素
 * @returns すべての並べ方の配列
 */
function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [
      x,
      ...rest,
    ]),
  );
}

// 計算結果のキャッシュ
// key: 賭け方|選んだ馬のID|出走馬のIDと強さ, value: 的中確率
// 重い計算なので、一度したのはもう一度やりたくない
const hitProbabilityCache = new Map<string, number>();

/**
 * 調子が分からない状態での、そのベットが的中する確率
 *
 * 単勝以外のオッズ計算用
 * ALL_PATTERNS で全パターンを試す
 *
 * @param betType 賭け方
 * @param selected 選んだ馬
 * @param field 出走馬全員
 * @returns そのベットが的中する確率
 */
export function hitProbability(
  betType: BetType,
  selected: Runner[],
  field: Runner[],
): number {
  const strengthOf = (r: Runner) => r.strength ?? 1 / r.odds;

  // 保存用のキーを先に作っておく
  const key = [
    betType,
    selected.map((r) => r.id).join(","),
    field.map((r) => `${r.id}:${strengthOf(r)}`).join(","),
  ].join("|");
  const cached = hitProbabilityCache.get(key);
  if (cached !== undefined) return cached;

  const strengths = field.map(strengthOf); // 各馬の基本の強さ
  const picked = selected.map((r) => field.findIndex((f) => f.id === r.id));
  const others = field.map((_, i) => i).filter((i) => !picked.includes(i));

  // 1つの配り方での、的中確率を計算する関数
  function probabilityFor(weights: number[]): number {
    switch (betType) {
      case "WIN":
      case "EXACTA":
      case "TRIFECTA":
        return orderedProbability(weights, picked);
      case "QUINELLA":
      case "TRIO":
        // 順序を考慮しないので、該当パターンの順列を足す
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
  // コーナーケース: 複勝で出走馬が3頭以下の場合、必ず的中する
  if (betType === "PLACE" && field.length <= 3) {
    result = 1;
  } else {
    result =
      ALL_PATTERNS.reduce(
        (sum, pattern) =>
          sum + probabilityFor(weightsForOneRace(strengths, pattern)),
        0,
      ) / ALL_PATTERNS.length;
  }

  hitProbabilityCache.set(key, result);
  return result;
}

/**
 * 的中確率と払い戻し率から、オッズを決定する関数 (単勝以外)
 *
 * 「払い戻し率 ÷ 的中確率」でオッズを計算する (0.1刻み)
 *
 * @param betType 賭け方
 * @param selected 選んだ馬
 * @param field 出走馬全員
 * @returns その賭け方のオッズ
 */
export function payoutMultiplier(
  betType: BetType,
  selected: Runner[],
  field: Runner[],
): number {
  const p = hitProbability(betType, selected, field);
  return Math.max(MIN_ODDS, Math.round((RTP_BY_TYPE[betType] / p) * 10) / 10);
}
