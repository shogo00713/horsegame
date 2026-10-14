/**
 * 抽選時の順位確定アニメーションを制御する関数たち
 *
 * 結果自体はベットボタンを押した時点で確定しているが、演出として「途中で順位が入れ替わる」ように見せる
 * 面白いから
 */

import type { Runner } from "../types/game";

// 演出全体の長さ (ms)
export const DRAW_DURATION_MS = 7000;

// 進捗がここを超えると、順位の入れ替わりは止まり最終順位で固定されるようになる (0~1)
export const SETTLE_PROGRESS = 0.9;

/**
 * 経過時間を受け取り、レース全体の進行度(0~1)を返す関数
 * 
 * 時間はパラメータで設定できるので、一応切り出している
 * 
 * @param elapsedMs 経過した時間 (ms)
 * @returns 進行度 (0~1)
 */
export function progressAt(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / DRAW_DURATION_MS));
}

/**
 * ある値 x に対して、それを 0~1 の範囲に収める関数
 * @param x なんらかの値
 * @returns 0~1 の範囲に収めた値
 */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * 最終順位までのアニメーションを制御する関数
 * 
 * 順位のアニメーションは、経過中において、その経過度合を入力すると、その時点での順位を返す「関数」として構成する
 * 何度もその関数を呼び出すことで、レースの進行に応じて順位が変化するように見せることができる
 * 
 * その関数内では、基本的に「進行度合いを引数として、ランダムに馬のスコアをつける → そのスコアが高い順に並べる」という処理を行う
 * 馬のスコアは、終盤になるにつれて最終順位に収束するようにしている
 * 途中では、ランダムな位相を持ったsinカーブを使用して、周期的かつランダムな遷移を実現している
 * 
 * @param result 最終順位の配列
 * @returns 進行度(0~1)を渡すとその時点の順位順の馬を返す「関数」
 */
export function createRaceScript(
  result: Runner[],
): (progress: number) => Runner[] {

  const n = result.length;

  const horses = result.map((runner, rank) => ({
    runner,
    finalScore: n - rank,
    // sin 用のランダムな周波数と位相
    waves: Array.from({ length: 3 }, () => ({
      freq: 0.5 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
    })),
  }));

  return (progress) => {
  
    const p = clamp01(progress); // 進捗度合い
    const pace = p * p * (3 - 2 * p); // 最終順位の成分の作用(pが1に近づくと急激に1に近づく)
    const settle = clamp01(p / SETTLE_PROGRESS); // 全体の進捗のうち、最終順位確定までの割合
    const wobble = n * 0.2 * (1 - settle * settle); // 揺れの大きさ(sinの振幅)で、終盤になると急激に0になる

    return horses
      .map((h) => {

        // スコアのゆらぎのとなる sin の部分
        // 3つの sin 波を平均して、ランダムな揺れを作る
        const noise =
          h.waves.reduce(
            (sum, w) => sum + Math.sin(w.freq * Math.PI * 2 * p + w.phase),
            0,
          ) / h.waves.length;
        
        // 最終的なスコアを計算 (最終順位の成分 + sinのゆらぎの成分)
        return { h, score: h.finalScore * pace + noise * wobble };
      })
      .sort((a, b) => b.score - a.score || b.h.finalScore - a.h.finalScore)
      .map(({ h }) => h.runner);
  };
}
