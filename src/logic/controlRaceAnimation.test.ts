import { describe, it, expect } from "vitest";
import {
  createRaceScript,
  progressAt,
  DRAW_DURATION_MS,
  SETTLE_PROGRESS,
} from "./controlRaceAnimation";
import type { Runner } from "../types/game";

const mk = (id: string): Runner => ({ id, name: id, odds: 1 });
const result = ["a", "b", "c", "d", "e", "f", "g", "h"].map(mk);

const ids = (rs: Runner[]) => rs.map((r) => r.id);

describe("progressAt", () => {
  it("経過時間に比例し、0〜1に収まる", () => {
    expect(progressAt(0)).toBe(0);
    expect(progressAt(DRAW_DURATION_MS / 2)).toBe(0.5);
    expect(progressAt(DRAW_DURATION_MS * 3)).toBe(1);
    expect(progressAt(-100)).toBe(0);
  });
});

describe("createRaceScript", () => {
  it("どの時点でも、全員が1回ずつ含まれる", () => {
    const orderAt = createRaceScript(result);
    for (let p = 0; p <= 1; p += 0.05) {
      expect(ids(orderAt(p)).sort()).toEqual(ids(result).sort());
    }
  });

  it("収束後(SETTLE_PROGRESS以降)は、必ず結果どおりの順位になる", () => {
    for (let trial = 0; trial < 20; trial++) {
      const orderAt = createRaceScript(result);
      expect(ids(orderAt(SETTLE_PROGRESS))).toEqual(ids(result));
      expect(ids(orderAt(0.95))).toEqual(ids(result));
      expect(ids(orderAt(1))).toEqual(ids(result));
    }
  });

  it("序盤〜中盤では、最終順位と違う並びになる(順位が前後する)", () => {
    let differed = false;
    for (let trial = 0; trial < 20 && !differed; trial++) {
      const orderAt = createRaceScript(result);
      differed = ids(orderAt(0.3)).join() !== ids(result).join();
    }
    expect(differed).toBe(true);
  });

  it("同じ乱数なら同じ台本になる", () => {
    const seq = () => {
      let x = 0.123;
      return () => (x = (x * 9301 + 49297) % 233280) / 233280;
    };
    const a = createRaceScript(result, seq());
    const b = createRaceScript(result, seq());
    expect(ids(a(0.4))).toEqual(ids(b(0.4)));
  });

  it("元の配列は変更しない", () => {
    const copy = [...result];
    createRaceScript(result)(0.2);
    expect(result).toEqual(copy);
  });
});
