/**
 * 払い戻し額の計算関数たち
 *
 * 単勝は、そのまま馬のオッズで計算される
 * それ以外の賭け方では、的中確率と払い戻し率から計算される
 *
 * 画面表示用の「最大払戻額」の計算と、実際の結果に基づく「払戻額」の計算を行う
 *
 * - 単勝: 1着を当てる
 * - 複勝: 1〜3着のいずれかを当てる
 * - 馬連: 1・2着の2頭を順不同で当てる
 * - 馬単: 1・2着の2頭を順番どおりに当てる
 * - 3連複: 1〜3着の3頭を順不同で当てる
 * - 3連単: 1〜3着の3頭を順番どおりに当てる
 */

import { BetSelection, Runner } from "../types/game";
import { payoutMultiplier } from "./odds";

/**
 * オッズの総合的な計算関数
 *
 * 単勝はそのまま計算済みのオッズを返す
 * それ以外の賭け方では、的中確率と払い戻し率から計算される(odds.ts の payoutMultiplier)
 *
 * @param selection 賭け方と選んだ馬
 * @param field 出走馬全体
 * @returns オッズ (小数)
 */
function calculateOdds(selection: BetSelection, field: Runner[]): number {
  switch (selection.betType) {
    case "WIN":
      return selection.runner.odds;
    case "PLACE":
      return payoutMultiplier("PLACE", [selection.runner], field);
    case "TRIO":
    case "TRIFECTA":
    case "QUINELLA":
    case "EXACTA":
      return payoutMultiplier(selection.betType, selection.runners, field);
  }
}

/**
 * 的中した場合の払戻額(最大払戻額)を計算する
 *
 * 実際の結果に基づくものではなく、あくまで画面表示用
 *
 * @param bet 賭け金
 * @param selection 選択した賭け方と馬
 * @param field 出走馬全員
 */
export function calculateMaxPayout(
  bet: number,
  selection: BetSelection,
  field: Runner[],
): number {
  return Math.floor(calculateOdds(selection, field) * bet);
}

/**
 * 総合的な配当計算関数
 *
 * 賭け方に応じて、各賭け方の計算関数を呼び出す
 *
 * @param bet 賭け金
 * @param selection 選択した賭け方
 * @param result 結果
 * @returns 払戻額(整数)
 */
export function calculatePayout(
  bet: number,
  selection: BetSelection,
  result: Runner[],
): number {
  switch (selection.betType) {
    case "WIN":
      return calculateWinPayout(bet, selection.runner, result);
    case "PLACE":
      return calculatePlacePayout(bet, selection.runner, result);
    case "TRIO":
      return calculateTrioPayout(bet, selection.runners, result);
    case "TRIFECTA":
      return calculateTrifectaPayout(bet, selection.runners, result);
    case "QUINELLA":
      return calculateQuinellaPayout(bet, selection.runners, result);
    case "EXACTA":
      return calculateExactaPayout(bet, selection.runners, result);
  }
}

/**
 * 選択した馬と結果の一致判定(順序の考慮あり)
 *
 * @param selected 選択した馬(順序あり)
 * @param result 結果
 * @param count 一致判定したい頭数
 * @returns 一致するかどうか
 */
function isSameOrder(
  selected: Runner[],
  result: Runner[],
  count: number,
): boolean {
  const selectedIds = selected.map((r) => r.id);
  const resultIds = result.slice(0, count).map((r) => r.id);
  return selectedIds.every((id, i) => id === resultIds[i]);
}

/**
 * 順序を考慮しない一致判定
 *
 * @param selected 選択した馬(順序なし)
 * @param result 結果
 * @param count 一致判定したい頭数
 * @returns 一致するかどうか
 */
function isSameCombination(
  selected: Runner[],
  result: Runner[],
  count: number,
): boolean {
  if (selected.length !== count) return false;

  const selectedIds = selected.map((r) => r.id).sort();
  const resultIds = result
    .slice(0, count)
    .map((r) => r.id)
    .sort();
  return selectedIds.every((id, i) => id === resultIds[i]);
}

// 単勝計算
function calculateWinPayout(
  bet: number,
  selected: Runner,
  result: Runner[],
): number {
  const isHit = isSameOrder([selected], result, 1);
  return isHit
    ? calculateMaxPayout(bet, { betType: "WIN", runner: selected }, result)
    : 0;
}

// 複勝計算
function calculatePlacePayout(
  bet: number,
  selected: Runner,
  result: Runner[],
): number {
  const isHit = result.slice(0, 3).some((r) => r.id === selected.id);
  return isHit
    ? calculateMaxPayout(bet, { betType: "PLACE", runner: selected }, result)
    : 0;
}

// 3連復計算
function calculateTrioPayout(
  bet: number,
  threeSelected: [Runner, Runner, Runner],
  result: Runner[],
): number {
  const isHit = isSameCombination(threeSelected, result, 3);
  return isHit
    ? calculateMaxPayout(
        bet,
        { betType: "TRIO", runners: threeSelected },
        result,
      )
    : 0;
}

// 3連単計算
function calculateTrifectaPayout(
  bet: number,
  threeSelected: [Runner, Runner, Runner],
  result: Runner[],
): number {
  const isHit = isSameOrder(threeSelected, result, 3);
  return isHit
    ? calculateMaxPayout(
        bet,
        { betType: "TRIFECTA", runners: threeSelected },
        result,
      )
    : 0;
}

// 馬連計算
function calculateQuinellaPayout(
  bet: number,
  twoSelected: [Runner, Runner],
  result: Runner[],
): number {
  const isHit = isSameCombination(twoSelected, result, 2);
  return isHit
    ? calculateMaxPayout(
        bet,
        { betType: "QUINELLA", runners: twoSelected },
        result,
      )
    : 0;
}

// 馬単計算
function calculateExactaPayout(
  bet: number,
  twoSelected: [Runner, Runner],
  result: Runner[],
): number {
  const isHit = isSameOrder(twoSelected, result, 2);
  return isHit
    ? calculateMaxPayout(
        bet,
        { betType: "EXACTA", runners: twoSelected },
        result,
      )
    : 0;
}
