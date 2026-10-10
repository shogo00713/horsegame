import { describe, it, expect } from "vitest";
import {
  NORMAL_CONDITION,
  dealConditions,
  isValidConditions,
  applyCondition,
  type Condition,
} from "./condition";
import { makeFinishOrder } from "./race";
import { runners } from "../data/runners";

describe("dealConditions", () => {
  const counts = (c: Record<string, Condition>) => {
    const result = [0, 0, 0, 0, 0];
    Object.values(c).forEach((level) => result[level]++);
    return result;
  };

  it("毎回、絶不調1・不調1・普通3・好調2・絶好調1で配られる", () => {
    for (let i = 0; i < 50; i++) {
      expect(counts(dealConditions(runners))).toEqual([1, 1, 3, 2, 1]);
    }
  });

  it("全馬ぶんの調子が正しい形で作られる", () => {
    expect(isValidConditions(dealConditions(runners), runners)).toBe(true);
  });

  it("乱数によって、配られ方が変わる", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      seen.add(JSON.stringify(dealConditions(runners)));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("ゆらぎが0なら、前の調子がそのまま引き継がれる", () => {
    const previous = dealConditions(runners);
    expect(dealConditions(runners, previous, () => 0.5)).toEqual(previous);
  });

  it("前を引き継いでも、内訳は毎回同じ", () => {
    let current = dealConditions(runners);
    for (let i = 0; i < 50; i++) {
      current = dealConditions(runners, current);
      expect(counts(current)).toEqual([1, 1, 3, 2, 1]);
    }
  });

  it("前の調子が良かった馬は、ランダムより良い調子を引きやすい", () => {
    const trials = 2000;
    let carried = 0;
    let fresh = 0;
    for (let i = 0; i < trials; i++) {
      const previous = dealConditions(runners);
      const best = runners.find((r) => previous[r.id] === 4)!;
      carried += dealConditions(runners, previous)[best.id];
      fresh += dealConditions(runners)[best.id];
    }
    expect(carried / trials).toBeGreaterThan(fresh / trials + 0.3);
  });
});

describe("isValidConditions", () => {
  it("不正な形・範囲外・馬が足りないものは弾く", () => {
    expect(isValidConditions(null, runners)).toBe(false);
    expect(isValidConditions({}, runners)).toBe(false);
    const bad = { ...dealConditions(runners), "1": 9 };
    expect(isValidConditions(bad, runners)).toBe(false);
  });
});

describe("applyCondition", () => {
  it("普通なら重みは変わらない", () => {
    expect(applyCondition(0.5, NORMAL_CONDITION)).toBe(0.5);
  });

  it("調子が良いほど重みが大きく、悪いほど小さい", () => {
    const weights = [0, 1, 2, 3, 4].map((c) =>
      applyCondition(0.5, c as Condition),
    );
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
    }
  });

  it("絶不調でも重みは正のまま", () => {
    expect(applyCondition(0.001, 0)).toBeGreaterThan(0);
  });
});

describe("調子の遷移(入れ替え)", () => {
  const horses = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    name: `馬${i + 1}`,
    odds: 5,
  }));
  const countsOf = (c: Record<string, Condition>) => {
    const result = [0, 0, 0, 0, 0];
    Object.values(c).forEach((level) => result[level]++);
    return result;
  };

  it("乱数がすべて入れ替わりを指す場合でも、各調子の頭数は変わらない", () => {
    const previous = dealConditions(horses);
    const next = dealConditions(horses, previous, () => 0);
    expect(countsOf(next)).toEqual(countsOf(previous));
  });

  it("1頭が1レースで動くのは、最大1段階", () => {
    for (let trial = 0; trial < 200; trial++) {
      const previous = dealConditions(horses);
      const next = dealConditions(horses, previous);
      horses.forEach((h) => {
        expect(Math.abs(next[h.id] - previous[h.id])).toBeLessThanOrEqual(1);
      });
    }
  });

  it("入れ替わりやすさは、絶好調↔好調が20%、好調↔普通が30%", () => {
    // 絶好調1頭・好調2頭の8頭で、何回も遷移させて割合を見る
    const trials = 20000;
    let topMoved = 0;
    let goodMoved = 0;
    let goodCount = 0;
    for (let i = 0; i < trials; i++) {
      const previous = dealConditions(horses);
      const next = dealConditions(horses, previous);
      horses.forEach((h) => {
        if (previous[h.id] === 4 && next[h.id] !== 4) topMoved++;
        if (previous[h.id] === 3) {
          goodCount++;
          if (next[h.id] !== 3) goodMoved++;
        }
      });
    }
    // 絶好調は20%の確率で入れ替わる
    expect(topMoved / trials).toBeGreaterThan(0.17);
    expect(topMoved / trials).toBeLessThan(0.23);
    // 好調は、上(絶好調側)と下(普通側)の両方に動くので、30%を少し超える
    expect(goodMoved / goodCount).toBeGreaterThan(0.28);
    expect(goodMoved / goodCount).toBeLessThan(0.45);
  });

  it("絶好調の馬は、平均して数レース絶好調が続く", () => {
    let current = dealConditions(horses);
    const top = horses.find((h) => current[h.id] === 4)!;
    let streak = 0;
    const trials = 5000;
    let total = 0;
    let runs = 0;
    for (let i = 0; i < trials; i++) {
      current = dealConditions(horses, current);
      if (current[top.id] === 4) {
        streak++;
      } else if (streak > 0) {
        total += streak;
        runs++;
        streak = 0;
      }
    }
    expect(runs).toBeGreaterThan(0);
    expect(total / runs).toBeGreaterThan(3);
  });
});

describe("調子が着順に与える影響(統計)", () => {
  function winRate(id: string, level: Condition, trials: number) {
    const conditions = Object.fromEntries(
      runners.map((r) => [r.id, r.id === id ? level : NORMAL_CONDITION]),
    );
    let wins = 0;
    for (let i = 0; i < trials; i++) {
      if (makeFinishOrder(runners, conditions)[0].id === id) wins++;
    }
    return wins / trials;
  }

  it("穴馬は絶好調だと勝率が大きく上がり、絶不調だと下がる", () => {
    const longshot = "8"; // 25倍
    const good = winRate(longshot, 4, 20000);
    const normal = winRate(longshot, 2, 20000);
    const bad = winRate(longshot, 0, 20000);
    expect(good).toBeGreaterThan(normal * 1.5);
    expect(bad).toBeLessThan(normal);
  });
});

describe("調子の効き(3着以内に入る確率)", () => {
  // 実際の配り方(conditionDeck)で、調子ごとに3着以内へ入った割合を数える
  function top3Rates(field: typeof runners, trials: number) {
    const entered = [0, 0, 0, 0, 0];
    const total = [0, 0, 0, 0, 0];
    for (let t = 0; t < trials; t++) {
      const conditions = dealConditions(field);
      const top3 = makeFinishOrder(field, conditions).slice(0, 3);
      field.forEach((r) => {
        total[conditions[r.id]]++;
        if (top3.some((x) => x.id === r.id)) entered[conditions[r.id]]++;
      });
    }
    return entered.map((e, i) => e / total[i]);
  }

  it("絶好調は高い確率で3着以内に入るが、確実ではない", () => {
    const rates = top3Rates(runners, 8000);
    expect(rates[4]).toBeGreaterThan(0.7);
    expect(rates[4]).toBeLessThan(0.9);
  });

  it("好調は絶好調より少し低く、絶不調はほぼ3着以内に入らない", () => {
    const rates = top3Rates(runners, 8000);
    expect(rates[3]).toBeGreaterThan(0.5);
    expect(rates[3]).toBeLessThan(rates[4]);
    expect(rates[0]).toBeLessThan(0.05);
  });
});
