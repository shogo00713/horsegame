import { describe, it, expect } from "vitest";
import { calculatePayout, calculateMaxPayout } from "./payout";
import { hitProbability, payoutMultiplier, RTP_BY_TYPE } from "./odds";
import { runners as field } from "../data/runners";
import type { BetType, Runner } from "../types/game";

// 実際の出走馬(8頭)を使う。配当は的中確率から決まるため、全員が揃っている必要がある
const [phoenix, storm, thunder, nova, nightmare, skyline, express, shikkoku] =
  field;

// 着順を作るヘルパー(指定した馬を上位に、残りは元の順で並べる)
function finishWith(...top: Runner[]): Runner[] {
  return [...top, ...field.filter((r) => !top.includes(r))];
}

describe("calculatePayout - WIN", () => {
  it("選んだ馬が1着なら bet * odds を払い戻す", () => {
    const payout = calculatePayout(
      300,
      { betType: "WIN", runner: phoenix },
      finishWith(phoenix),
    );
    expect(payout).toBe(Math.floor(300 * phoenix.odds));
  });

  it("選んだ馬が1着でなければ0を返す", () => {
    const payout = calculatePayout(
      300,
      { betType: "WIN", runner: phoenix },
      finishWith(storm, phoenix),
    );
    expect(payout).toBe(0);
  });
});

describe("calculatePayout - PLACE", () => {
  it("選んだ馬が3着以内(1着でなくても)なら、的中確率から決まる倍率で払い戻す", () => {
    const payout = calculatePayout(
      300,
      { betType: "PLACE", runner: phoenix },
      finishWith(storm, thunder, phoenix), // phoenixは3着
    );
    expect(payout).toBe(
      Math.floor(payoutMultiplier("PLACE", [phoenix], field) * 300),
    );
  });

  it("選んだ馬が4着以下なら0を返す", () => {
    const payout = calculatePayout(
      300,
      { betType: "PLACE", runner: phoenix },
      finishWith(storm, thunder, nova, phoenix), // phoenixは4着
    );
    expect(payout).toBe(0);
  });
});

describe("calculatePayout - TRIO", () => {
  it("順番が違っても、同じ組み合わせなら当たる", () => {
    const selected: [Runner, Runner, Runner] = [thunder, phoenix, storm];
    const payout = calculatePayout(
      300,
      { betType: "TRIO", runners: selected },
      finishWith(phoenix, storm, thunder),
    );
    expect(payout).toBe(
      Math.floor(payoutMultiplier("TRIO", selected, field) * 300),
    );
  });

  it("選んだ組み合わせが違えば0を返す", () => {
    const payout = calculatePayout(
      300,
      { betType: "TRIO", runners: [phoenix, storm, thunder] },
      finishWith(phoenix, storm, nova),
    );
    expect(payout).toBe(0);
  });
});

describe("calculatePayout - TRIFECTA", () => {
  it("選んだ順番通りに着順が決まれば当たる", () => {
    const selected: [Runner, Runner, Runner] = [phoenix, storm, thunder];
    const payout = calculatePayout(
      300,
      { betType: "TRIFECTA", runners: selected },
      finishWith(phoenix, storm, thunder),
    );
    expect(payout).toBe(
      Math.floor(payoutMultiplier("TRIFECTA", selected, field) * 300),
    );
  });

  it("同じ3頭でも、着順が違えば0を返す", () => {
    const payout = calculatePayout(
      300,
      { betType: "TRIFECTA", runners: [phoenix, storm, thunder] },
      finishWith(storm, phoenix, thunder),
    );
    expect(payout).toBe(0);
  });
});

describe("calculatePayout - QUINELLA", () => {
  it("順番が違っても、同じ組み合わせなら当たる", () => {
    const selected: [Runner, Runner] = [storm, phoenix];
    const payout = calculatePayout(
      300,
      { betType: "QUINELLA", runners: selected },
      finishWith(phoenix, storm),
    );
    expect(payout).toBe(
      Math.floor(payoutMultiplier("QUINELLA", selected, field) * 300),
    );
  });

  it("選んだ組み合わせが違えば0を返す", () => {
    const payout = calculatePayout(
      300,
      { betType: "QUINELLA", runners: [phoenix, storm] },
      finishWith(phoenix, thunder, storm),
    );
    expect(payout).toBe(0);
  });
});

describe("calculatePayout - EXACTA", () => {
  it("選んだ順番通りに1着・2着が決まれば当たる", () => {
    const selected: [Runner, Runner] = [phoenix, storm];
    const payout = calculatePayout(
      300,
      { betType: "EXACTA", runners: selected },
      finishWith(phoenix, storm),
    );
    expect(payout).toBe(
      Math.floor(payoutMultiplier("EXACTA", selected, field) * 300),
    );
  });

  it("同じ2頭でも、順番が逆なら0を返す", () => {
    const payout = calculatePayout(
      300,
      { betType: "EXACTA", runners: [phoenix, storm] },
      finishWith(storm, phoenix),
    );
    expect(payout).toBe(0);
  });
});

describe("calculateMaxPayout", () => {
  it("WIN: 着順に関わらず、的中した場合の払戻額を返す", () => {
    expect(
      calculateMaxPayout(300, { betType: "WIN", runner: phoenix }, field),
    ).toBe(Math.floor(300 * phoenix.odds));
  });

  it("TRIO: calculatePayoutが的中したときと同じ金額になる", () => {
    const selected: [Runner, Runner, Runner] = [thunder, phoenix, storm];
    const hitPayout = calculatePayout(
      300,
      { betType: "TRIO", runners: selected },
      finishWith(phoenix, storm, thunder),
    );
    expect(
      calculateMaxPayout(300, { betType: "TRIO", runners: selected }, field),
    ).toBe(hitPayout);
  });
});

describe("配当の設計(的中確率と払い戻し率)", () => {
  it("的中しにくい組み合わせほど、配当が高い", () => {
    const easy = payoutMultiplier("QUINELLA", [phoenix, storm], field);
    const hard = payoutMultiplier("QUINELLA", [express, shikkoku], field);
    expect(hard).toBeGreaterThan(easy);
  });

  it("順番まで当てる券種は、順不同の券種より配当が高い", () => {
    const pair: [Runner, Runner] = [phoenix, storm];
    expect(payoutMultiplier("EXACTA", pair, field)).toBeGreaterThan(
      payoutMultiplier("QUINELLA", pair, field),
    );
    const trio: [Runner, Runner, Runner] = [phoenix, storm, thunder];
    expect(payoutMultiplier("TRIFECTA", trio, field)).toBeGreaterThan(
      payoutMultiplier("TRIO", trio, field),
    );
  });

  it("複勝は単勝より配当が低い(当たりやすいため)", () => {
    expect(payoutMultiplier("PLACE", [nova], field)).toBeLessThan(nova.odds);
  });

  it("確率の関係: 馬連 = 馬単(順→逆)の合計、3連複 = 3連単の6通りの合計", () => {
    const quinella = hitProbability("QUINELLA", [storm, nova], field);
    const exacta =
      hitProbability("EXACTA", [storm, nova], field) +
      hitProbability("EXACTA", [nova, storm], field);
    expect(quinella).toBeCloseTo(exacta, 10);
  });

  it("券種ごとの期待値が、設定した払い戻し率に近い", () => {
    const cases: [BetType, Runner[]][] = [
      ["PLACE", [phoenix]],
      ["PLACE", [shikkoku]],
      ["QUINELLA", [phoenix, storm]],
      ["QUINELLA", [nightmare, skyline]],
      ["EXACTA", [storm, thunder]],
      ["TRIO", [phoenix, nova, express]],
      ["TRIFECTA", [thunder, nova, nightmare]],
    ];
    for (const [betType, selected] of cases) {
      const p = hitProbability(betType, selected, field);
      const multiplier = payoutMultiplier(betType, selected, field);
      const rtp = RTP_BY_TYPE[betType];
      // 倍率は0.1刻みに丸めているので、少し誤差を許す
      expect(p * multiplier).toBeGreaterThan(rtp * 0.9);
      expect(p * multiplier).toBeLessThan(rtp * 1.1);
    }
  });

  it("配当に上限は無く、当たりにくい組み合わせは非常に高い配当になる", () => {
    expect(
      payoutMultiplier("TRIFECTA", [shikkoku, express, skyline], field),
    ).toBeGreaterThan(1000);
  });
});

// 調子が分からない人の期待値が、設定した払い戻し率を超えて「想定外に得」にならないことを見張る
describe("ハック対策: 調子が分からない人の期待値の上限", () => {
  // 券種ごとの払い戻し率に、丸めなどの誤差ぶん(20%)を足した値を上限にする。
  // 払い戻し率が低い券種は、最低倍率(1.1倍)の影響があるので、下限として1.2を使う
  const MAX_BLIND_EV = 1.2;
  const maxBlindEv = (betType: BetType) =>
    Math.max(MAX_BLIND_EV, RTP_BY_TYPE[betType] * 1.2);

  // n頭の組み合わせ(順不同)・順列をすべて作る
  function combinations(items: Runner[], n: number): Runner[][] {
    if (n === 0) return [[]];
    return items.flatMap((x, i) =>
      combinations(items.slice(i + 1), n - 1).map((rest) => [x, ...rest]),
    );
  }
  function ordered(items: Runner[], n: number): Runner[][] {
    if (n === 0) return [[]];
    return items.flatMap((x) =>
      ordered(
        items.filter((y) => y !== x),
        n - 1,
      ).map((rest) => [x, ...rest]),
    );
  }

  const allBets: [BetType, Runner[]][] = [
    ...field.map((r): [BetType, Runner[]] => ["PLACE", [r]]),
    ...field.map((r): [BetType, Runner[]] => ["WIN", [r]]),
    ...combinations(field, 2).map((c): [BetType, Runner[]] => ["QUINELLA", c]),
    ...ordered(field, 2).map((c): [BetType, Runner[]] => ["EXACTA", c]),
    ...combinations(field, 3).map((c): [BetType, Runner[]] => ["TRIO", c]),
    ...ordered(field, 3).map((c): [BetType, Runner[]] => ["TRIFECTA", c]),
  ];

  it("すべての賭け方で、期待値が上限を超えない", () => {
    for (const [betType, selected] of allBets) {
      const p = hitProbability(betType, selected, field);
      const multiplier =
        betType === "WIN"
          ? selected[0].odds
          : payoutMultiplier(betType, selected, field);
      expect(p * multiplier).toBeLessThan(maxBlindEv(betType));
    }
  });
});
