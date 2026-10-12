import { describe, it, expect } from "vitest";
import {
  maxSelectable,
  isOrderedBetType,
  buildBetSelection,
  canResetMoney,
  isValidBet,
  totalBetAmount,
  validateBetRules,
} from "./betRules";
import type { Runner, BetDraft } from "../types/game";

const phoenix: Runner = { id: "phoenix", name: "フェニックス", odds: 1.2 };
const storm: Runner = { id: "storm", name: "ストームエッジ", odds: 2.0 };
const thunder: Runner = { id: "thunder", name: "サンダーボルト", odds: 3.0 };

// テスト用のベットを簡単に作るヘルパー
function makeBet(overrides: Partial<BetDraft> = {}): BetDraft {
  return {
    id: "bet-1",
    betType: "WIN",
    selectedRunners: [phoenix],
    betstr: "300",
    ...overrides,
  };
}

describe("canResetMoney", () => {
  it("BETTING中かつ500円以下ならtrue", () => {
    expect(canResetMoney("BETTING", 500)).toBe(true);
    expect(canResetMoney("BETTING", 0)).toBe(true);
  });
  it("500円を超えていればfalse", () => {
    expect(canResetMoney("BETTING", 501)).toBe(false);
  });
  it("BETTING中でなければfalse", () => {
    expect(canResetMoney("DRAWING", 100)).toBe(false);
  });
});

describe("maxSelectable", () => {
  it("単勝・複勝は1頭", () => {
    expect(maxSelectable("WIN")).toBe(1);
    expect(maxSelectable("PLACE")).toBe(1);
  });
  it("馬連・馬単は2頭", () => {
    expect(maxSelectable("QUINELLA")).toBe(2);
    expect(maxSelectable("EXACTA")).toBe(2);
  });
  it("3連複・3連単は3頭", () => {
    expect(maxSelectable("TRIO")).toBe(3);
    expect(maxSelectable("TRIFECTA")).toBe(3);
  });
});

describe("isOrderedBetType", () => {
  it("3連単・馬単は着順を当てる必要がある", () => {
    expect(isOrderedBetType("TRIFECTA")).toBe(true);
    expect(isOrderedBetType("EXACTA")).toBe(true);
  });
  it("それ以外は組み合わせだけでよい", () => {
    expect(isOrderedBetType("WIN")).toBe(false);
    expect(isOrderedBetType("TRIO")).toBe(false);
    expect(isOrderedBetType("QUINELLA")).toBe(false);
  });
});

describe("isValidBet", () => {
  it("金額が入力済みで、必要な頭数を選んでいれば成立", () => {
    expect(
      isValidBet(
        makeBet({ betType: "WIN", selectedRunners: [phoenix], betstr: "300" }),
      ),
    ).toBe(true);
  });
  it("金額が0円以下なら不成立", () => {
    expect(isValidBet(makeBet({ betstr: "0" }))).toBe(false);
  });
  it("選んだ頭数が賭け方と合っていなければ不成立", () => {
    // QUINELLAはmax=2頭必要なのに1頭しか選んでいない
    expect(
      isValidBet(makeBet({ betType: "QUINELLA", selectedRunners: [phoenix] })),
    ).toBe(false);
  });
});

describe("totalBetAmount", () => {
  it("全件の金額を合計する", () => {
    const bets = [makeBet({ betstr: "300" }), makeBet({ betstr: "500" })];
    expect(totalBetAmount(bets)).toBe(800);
  });
  it("ベットが無ければ0", () => {
    expect(totalBetAmount([])).toBe(0);
  });
});

describe("validateBetRules", () => {
  it("1件以上・全件成立・合計が所持金以内なら、理由は無い(null)", () => {
    const bets = [makeBet({ betstr: "300" }), makeBet({ betstr: "500" })];
    expect(validateBetRules(bets, 1000)).toBeNull();
  });

  it("ベットが1件も無ければ、追加を促す理由が返る", () => {
    expect(validateBetRules([], 1000)).toBe(
      "ベットを1件以上追加してください。",
    );
  });

  it("1件でも不成立(馬・金額未入力)なベットがあれば、未入力の理由が返る", () => {
    const bets = [
      makeBet({ betstr: "300" }),
      makeBet({ selectedRunners: [] }), // 馬を選んでいない
    ];
    expect(validateBetRules(bets, 1000)).toBe(
      "馬の選択か金額が未入力のベットがあります。",
    );
  });

  it("金額が0円のベットがあれば、未入力の理由が返る", () => {
    const bets = [makeBet({ betstr: "0" })];
    expect(validateBetRules(bets, 1000)).toBe(
      "馬の選択か金額が未入力のベットがあります。",
    );
  });

  it("1件ずつは所持金以内でも、合計で所持金を超えていれば、所持金不足の理由が返る", () => {
    const bets = [makeBet({ betstr: "600" }), makeBet({ betstr: "600" })];
    expect(validateBetRules(bets, 1000)).toBe("所持金が不足しています。");
  });

  it("合計がちょうど所持金と同じなら、理由は無い(null)", () => {
    const bets = [makeBet({ betstr: "500" }), makeBet({ betstr: "500" })];
    expect(validateBetRules(bets, 1000)).toBeNull();
  });

  it("同じ組み合わせ(同じ馬・同じ賭け方)の重複は禁止しない", () => {
    const bets = [
      makeBet({ betType: "WIN", selectedRunners: [phoenix], betstr: "300" }),
      makeBet({ betType: "WIN", selectedRunners: [phoenix], betstr: "300" }),
    ];
    expect(validateBetRules(bets, 1000)).toBeNull();
  });
});

describe("buildBetSelection", () => {
  it("WIN: 1頭だけの runner を持つ形になる", () => {
    expect(buildBetSelection("WIN", [phoenix])).toEqual({
      betType: "WIN",
      runner: phoenix,
    });
  });
  it("EXACTA: 選んだ順番のまま runners に入る(着順を区別するため)", () => {
    expect(buildBetSelection("EXACTA", [storm, phoenix])).toEqual({
      betType: "EXACTA",
      runners: [storm, phoenix],
    });
  });
  it("TRIO: 3頭の runners を持つ形になる", () => {
    expect(buildBetSelection("TRIO", [phoenix, storm, thunder])).toEqual({
      betType: "TRIO",
      runners: [phoenix, storm, thunder],
    });
  });
});
