import { describe, expect, it } from "vitest";
import { makeFinishOrder, pickWinnerByOdds } from "./determineRaceResults";
import type { Runner } from "../types/game";

const runners: Runner[] = [
  { id: "phoenix", name: "フェニックス", odds: 1.2 },
  { id: "storm", name: "ストームエッジ", odds: 2.0 },
];

describe("makeFinishOrder", () => {
  it("着順が正しく決定されること", () => {
    const result = makeFinishOrder(runners);

    // 返却される着順の配列の長さが元の馬の数と同じであること
    expect(result).toHaveLength(runners.length);

    // 返却される着順の配列に重複がないこと
    const uniqueIds = new Set(result.map((r) => r.id));
    expect(uniqueIds.size).toBe(result.length);
  });

  it("全ての馬がちょうど1回ずつ含まれる(欠けている馬がいない)", () => {
    const result = makeFinishOrder(runners);

    const resultIds = result.map((r) => r.id).sort();
    const runnerIds = runners.map((r) => r.id).sort();
    expect(resultIds).toEqual(runnerIds);
  });

  it("オッズが極端に低い(人気の)馬は、高確率で1着になる", () => {
    // ランダム性を確認するため、明確に差がつくオッズで固定する
    const favorite: Runner = { id: "favorite", name: "本命", odds: 1.0 };
    const underdog: Runner = { id: "underdog", name: "大穴", odds: 100.0 };
    const pair = [favorite, underdog];

    const trials = 200;
    let favoriteWins = 0;
    for (let i = 0; i < trials; i++) {
      const result = makeFinishOrder(pair);
      if (result[0].id === favorite.id) favoriteWins++;
    }

    // オッズ差が極端なので、ほとんどの試行で本命が1着になるはず
    // (統計的なテストなので、ごく低確率の失敗はあり得るが、閾値を90%に
    //  設定することでその確率を実質無視できるレベルに抑えている)
    expect(favoriteWins).toBeGreaterThan(trials * 0.9);
  });
});

describe("pickWinnerByOdds", () => {
  it("poolに1頭しかいなければ、その馬を返す", () => {
    const weighted = runners.map((r) => ({ runner: r, weight: 1 / r.odds }));
    const onlyPhoenix = [runners[0]];

    const winner = pickWinnerByOdds(onlyPhoenix, weighted);

    expect(winner.id).toBe(runners[0].id);
  });

  it("常にpool内の馬を返す(poolから外れた馬は選ばれない)", () => {
    const extraRunners: Runner[] = [
      ...runners,
      { id: "thunder", name: "サンダーボルト", odds: 3.0 },
    ];
    const weighted = extraRunners.map((r) => ({
      runner: r,
      weight: 1 / r.odds,
    }));
    const pool = runners;

    for (let i = 0; i < 50; i++) {
      const winner = pickWinnerByOdds(pool, weighted);
      expect(pool.some((r) => r.id === winner.id)).toBe(true);
    }
  });
});
