/**
 * このゲームの中で使用する型定義をまとめたファイル
 *
 * すべて Type で統一している
 * どちらで統一してもよかったのだが、フェーズにリテラル型を使用しているので、そこから全て Type に統一することとした。
 */

/**
 * ゲームの進行フェーズ
 * - BETTING: ベット受付中
 * - DRAWING: レース中
 * - PAYOUT: 払い戻し中
 */
export type Phase = "BETTING" | "DRAWING" | "PAYOUT";

/**
 * 賭け方と選択する馬の組み合わせをまとめた型
 *
 * - 単勝・複勝: 1頭の馬を選ぶ
 * - 馬連・馬単: 2頭の馬を選ぶ
 * - 3連複・3連単: 3頭の馬を選ぶ
 */
export type BetSelection =
  | { betType: "WIN" | "PLACE"; runner: Runner }
  | { betType: "QUINELLA" | "EXACTA"; runners: [Runner, Runner] }
  | { betType: "TRIO" | "TRIFECTA"; runners: [Runner, Runner, Runner] };

/**
 * 賭け方の種類だけを取り出した型
 */
export type BetType = BetSelection["betType"];

/**
 * 未確定のベットを構成していくための型
 *
 * 同時に複数のベットをすると、idが異なるベットが構成される
 *
 * - id : ベットの識別子(ランダムな文字列)
 * - betType : 賭け方の種類
 * - selectedRunners : 選択済みの馬の配列
 * - betstr : 賭け金の文字列(表示用)
 */
export type BetDraft = {
  id: string;
  betType: BetType;
  selectedRunners: Runner[];
  betstr: string;
};

/**
 * ベットとその払い戻し額をまとめた型
 *
 * 各ベットに対して、払い戻し額を計算するための一時保持を担当する
 *
 * - bet : ベットの情報
 * - payout : 払い戻し額
 */
export type BetResult = {
  bet: BetDraft;
  payout: number;
};

/**
 * 各馬の情報をまとめた型
 *
 * - id : 馬の識別子(ランダムな文字列)
 * - name : 馬の名前
 * - odds : 単勝オッズ(小数)
 * - description : 馬の説明(省略可能)
 * - strength : 馬の強さ(省略可能)
 */
export type Runner = {
  id: string;
  name: string;
  odds: number;
  description?: string;
  strength?: number;
};

/**
 * 馬の調子を表す型
 *
 * 0が絶不調で、4が絶好調
 */
export type Condition = 0 | 1 | 2 | 3 | 4;

/**
 * 各馬のIDと調子をまとめたレコード
 *
 * - key : 馬のID
 * - value : 馬の調子(0〜4)
 */
export type Conditions = Record<string, Condition>;

/**
 * 実行済みのレースの履歴をまとめた型
 *
 * - raceNo : 第n戦
 * - result : 着順の配列(先頭が1着)
 */
export type RaceHistory = {
  raceNo: number; // 第n戦
  result: Runner[]; // 着順
};

/**
 * 馬別の成績の集計
 *
 * - runner : 馬の情報
 * - ranks : 各レースでの着順(1-indexed)。新しいレースが先頭
 * - average : 平均着順 (出走がなければnull)
 * - wins : 1着の回数
 * - top3 : 3着以内の回数
 */
export type HorseStats = {
  runner: Runner;
  ranks: number[];
  average: number | null;
  wins: number;
  top3: number;
};
