import { describe, it, expect } from "vitest";
import { horseStats } from "./calculateHorseStats";
import type { RaceHistory, Runner } from "../types/game";

const a: Runner = { id: "a", name: "A", odds: 1.5 };
const b: Runner = { id: "b", name: "B", odds: 3 };
const c: Runner = { id: "c", name: "C", odds: 9 };

// 新しいレースが先頭
const history: RaceHistory[] = [
  { raceNo: 3, result: [b, a, c] },
  { raceNo: 2, result: [a, b, c] },
  { raceNo: 1, result: [a, c, b] },
];

describe("horseStats", () => {
  it("馬ごとに、新しい順の着順が並ぶ", () => {
    const stats = horseStats(history, [a, b, c]);
    expect(stats[0].ranks).toEqual([2, 1, 1]);
    expect(stats[1].ranks).toEqual([1, 2, 3]);
    expect(stats[2].ranks).toEqual([3, 3, 2]);
  });

  it("平均着順・1着回数・3着以内の回数を集計する", () => {
    const [sa, sb] = horseStats(history, [a, b, c]);
    expect(sa.average).toBeCloseTo(4 / 3);
    expect(sa.wins).toBe(2);
    expect(sa.top3).toBe(3);
    expect(sb.wins).toBe(1);
  });

  it("履歴が無い場合は、平均着順がnullで回数は0", () => {
    const [s] = horseStats([], [a]);
    expect(s.ranks).toEqual([]);
    expect(s.average).toBeNull();
    expect(s.wins).toBe(0);
  });

  it("レースに含まれない馬は、そのレースを数えない", () => {
    const [s] = horseStats([{ raceNo: 1, result: [b] }], [a]);
    expect(s.ranks).toEqual([]);
  });
});
