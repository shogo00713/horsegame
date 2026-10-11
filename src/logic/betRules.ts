/**
 * 賭け方に応じて、判定が変わる部分をまとめた関数たち
 *
 * 賭け方に応じて、選ぶ必要のある馬の頭数や、着順を当てる必要があるかどうかなどが変わる
 * それらを賭け方を引数として判定する関数がまとめてある
 */

import type { BetType, BetSelection, Runner, Phase, Bet } from "../types/game";

/**
 * 所持金リセットボタンを押してもいいかどうかを判定する
 *
 * @param phase - 現在のフェーズがBETTING
 * @param money - 現在の所持金が500円以下
 * @returns boolean
 */
export function canResetMoney(phase: Phase, money: number): boolean {
  return phase === "BETTING" && money <= 500;
}

/**
 * 賭け方ごとに選ぶ必要のある馬の頭数を返す
 *
 * WIN, PLACE: 1頭
 * QUINELLA, EXACTA: 2頭
 * TRIO, TRIFECTA: 3頭
 *
 * @param betType
 * @returns 整数 (1~3)
 */
export function maxSelectable(betType: BetType): number {
  switch (betType) {
    case "WIN":
    case "PLACE":
      return 1;
    case "QUINELLA":
    case "EXACTA":
      return 2;
    case "TRIO":
    case "TRIFECTA":
      return 3;
  }
}

/**
 * 着順も当てる必要がある賭け方かどうかを判定する
 *
 * TRIFECTA, EXACTA のみ True
 *
 * @param betType
 * @returns boolean
 */
export function isOrderedBetType(betType: BetType): boolean {
  return betType === "TRIFECTA" || betType === "EXACTA";
}

/**
 * 正しいベットの形式をしているかを総合的に判定する関数
 *
 * 次の2つの条件を満たしている場合に True
 * - 選んだ馬の数が正しいか
 * - 金額が1円以上か
 *
 * @param bet 賭け方とその金額
 * @returns boolean
 */
export function isValidBet(bet: Bet): boolean {
  const amount = Number(bet.betstr);
  return (
    amount > 0 && bet.selectedRunners.length === maxSelectable(bet.betType)
  );
}

/**
 * ベット金額の合計を計算する関数
 *
 * @param bets 各賭けの配列
 * @returns 整数
 */
export function totalBetAmount(bets: Bet[]): number {
  return bets.reduce((sum, bet) => sum + Number(bet.betstr), 0);
}

/**
 * 選択したベットが正しいかどうかを総合的に判定する関数
 *
 * @param bets 選んだベットの配列
 * @param total ベットの合計金額
 * @param money 所持金額
 * @returns エラーメッセージ、またはnull
 */
export function validateBetRules(
  bets: Bet[],
  total: number,
  money: number,
): string | null {
  // 入力のエラーチェック
  if (bets.length === 0) {
    return "ベットを1件以上追加してください。";
  }
  if (!bets.every(isValidBet)) {
    return "馬の選択か金額が未入力のベットがあります。";
  }
  if (total > money) {
    return "所持金が不足しています。";
  }
  return null;
}

/**
 * ベットボタンを押していいかどうかを判定する関数
 *
 * 次の条件を全て満たすことが必要
 * * ベットが1件以上
 * * 全てが正しいベットの形式(馬の数・金額が正しい)をしている
 * * 合計金額が所持金を超えていない
 *
 * @param bets 各賭けの配列
 * @param money 所持金
 * @returns boolean
 */
export function canSubmitBets(bets: Bet[], money: number): boolean {
  return (
    bets.length > 0 && bets.every(isValidBet) && totalBetAmount(bets) <= money
  );
}

/**
 * 賭け方 + 選択済みの馬から、払い戻し計算用の BetSelection を組み立てる
 *
 * 払い戻しを計算するための、ベット情報をまとめたオブジェクトを生成する
 *
 * @param betType 賭け方
 * @param selectedRunners 選択済みの馬
 * @returns BetSelection (払い戻し計算用のベット情報(ベットの種類と選んだ馬を含む))
 */
export function buildBetSelection(
  betType: BetType,
  selectedRunners: Runner[],
): BetSelection {
  switch (betType) {
    case "WIN":
    case "PLACE":
      return { betType, runner: selectedRunners[0] };
    case "TRIO":
    case "TRIFECTA":
      return {
        betType,
        runners: selectedRunners as [Runner, Runner, Runner],
      };
    case "QUINELLA":
    case "EXACTA":
      return {
        betType,
        runners: selectedRunners as [Runner, Runner],
      };
  }
}

/**
 * 賭け方の日本語表示を返す関数
 *
 * @param betType 賭け方
 * @returns 文字列
 */
export function betTypeLabel(betType: BetType): string {
  switch (betType) {
    case "WIN":
      return "単勝";
    case "PLACE":
      return "複勝";
    case "TRIO":
      return "3連複";
    case "TRIFECTA":
      return "3連単";
    case "QUINELLA":
      return "馬連";
    case "EXACTA":
      return "馬単";
  }
}

/**
 * 選んだ馬の名前表示用の文字列を作る関数
 *
 * 着順が関係あるなら「1. 馬名 → 2. 馬名」の形
 * 着順が関係ないなら「馬名 / 馬名」の形
 *
 * @param bet 賭け方と選択済みの馬の情報
 * @returns 文字列
 */
export function formatSelectedRunners(bet: Bet): string {
  if (isOrderedBetType(bet.betType)) {
    return bet.selectedRunners.map((r, i) => `${i + 1}. ${r.name}`).join(" → ");
  }
  return bet.selectedRunners.map((r) => r.name).join(" / ");
}
