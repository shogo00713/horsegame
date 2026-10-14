import { describe, it, expect } from "vitest";
import { marginalWinProbabilities, deriveOdds, RTP_BY_TYPE } from "./calculateOdds";
import { runners } from "../data/runners";
import { makeFinishOrder } from "./determineRaceResults";
import { dealConditions } from "./updateHorseCondition";

const strengths = runners.map((r) => r.strength!);

describe("marginalWinProbabilities", () => {
  it("全馬の合計は1", () => {
    const sum = marginalWinProbabilities(strengths).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("強い馬ほど勝率が高い", () => {
    const p = marginalWinProbabilities(strengths);
    expect(p[0]).toBeGreaterThan(p[3]);
    expect(p[3]).toBeGreaterThan(p[7]);
  });
});

describe("deriveOdds", () => {
  it("強い馬ほどオッズが低い", () => {
    const odds = deriveOdds(strengths, 0.8);
    expect(odds[0]).toBeLessThan(odds[3]);
    expect(odds[3]).toBeLessThan(odds[7]);
  });

  it("払い戻し率が高いほど、オッズも高い", () => {
    const low = deriveOdds(strengths, 0.7);
    const high = deriveOdds(strengths, 0.9);
    low.forEach((o, i) => expect(high[i]).toBeGreaterThanOrEqual(o));
  });
});

describe("馬データのオッズ", () => {
  it("調子が分からないとき、どの馬の単勝も期待値がほぼ同じ(単勝の払い戻し率)", () => {
    const p = marginalWinProbabilities(strengths);
    runners.forEach((r, i) => {
      // オッズは0.1刻みに丸めているので、少し誤差を許す
      expect(p[i] * r.odds).toBeGreaterThan(RTP_BY_TYPE.WIN - 0.05);
      expect(p[i] * r.odds).toBeLessThan(RTP_BY_TYPE.WIN + 0.05);
    });
  });

  it("実際にレースを回したときの1着率が、計算上の勝率に近い", () => {
    const p = marginalWinProbabilities(strengths);
    const trials = 20000;
    const wins = new Array(runners.length).fill(0);
    for (let i = 0; i < trials; i++) {
      const winner = makeFinishOrder(runners, dealConditions(runners))[0];
      wins[runners.findIndex((r) => r.id === winner.id)]++;
    }
    wins.forEach((w, i) => {
      expect(Math.abs(w / trials - p[i])).toBeLessThan(0.02);
    });
  });
});

describe("調子が分からない人の期待値(単勝)", () => {
  // 全馬の単勝を1回ずつ買い続けたと仮定して、実際に戻ってくる割合を測る
  function realizedWinEv(field: typeof runners, trials: number) {
    const payout = new Array<number>(field.length).fill(0);
    for (let t = 0; t < trials; t++) {
      const winner = makeFinishOrder(field, dealConditions(field))[0];
      const index = field.findIndex((r) => r.id === winner.id);
      payout[index] += field[index].odds;
    }
    return payout.map((p) => p / trials);
  }

  it("8頭: どの馬の単勝も、払い戻し率に近い(±0.2)", () => {
    realizedWinEv(runners, 60000).forEach((ev) => {
      expect(Math.abs(ev - RTP_BY_TYPE.WIN)).toBeLessThan(0.2);
    });
  });
});
