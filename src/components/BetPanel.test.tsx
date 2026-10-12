import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BetPanel from "./BetPanel";
import type { Runner, BetDraft } from "../types/game";

// テスト用の馬データ
const runners: Runner[] = [
  { id: "phoenix", name: "フェニックス", odds: 1.2 },
  { id: "storm", name: "ストームエッジ", odds: 2.0 },
];

function makeBet(overrides: Partial<BetDraft> = {}): BetDraft {
  return {
    id: "bet-1",
    betType: "WIN",
    selectedRunners: [],
    betstr: "300",
    ...overrides,
  };
}

// 共通のprops初期値 + 上書き用ヘルパー
function renderBetPanel(
  overrides: Partial<ComponentProps<typeof BetPanel>> = {},
) {
  const props: ComponentProps<typeof BetPanel> = {
    bets: [],
    phase: "BETTING",
    runners,
    maxBets: 5,
    totalBetAmount: 0,
    canSubmit: false,
    onAddBet: () => "bet-1",
    onRemoveBet: () => {},
    onChangeBetType: () => {},
    onChangeBetAmount: () => {},
    onToggleRunner: () => {},
    onSubmit: () => {},
    ...overrides,
  };
  return render(<BetPanel {...props} />);
}

describe("BetPanel", () => {
  it("初期状態(ベット0件)では、maxBets件ぶんの空きスロット(＋)が表示される", () => {
    renderBetPanel({ bets: [], maxBets: 5 });

    expect(screen.getAllByRole("button", { name: "＋" })).toHaveLength(5);
  });

  it("追加済みのベットは、簡易表示(1行)で表示される(残りは空きスロットのまま)", () => {
    renderBetPanel({
      bets: [
        makeBet({
          betType: "WIN",
          selectedRunners: [runners[0]],
          betstr: "300",
        }),
      ],
      maxBets: 5,
    });

    expect(screen.getByText("単勝")).toBeInTheDocument();
    expect(screen.getByText("フェニックス")).toBeInTheDocument();
    expect(screen.getByText("¥300")).toBeInTheDocument();
    // 残り4つは空きスロットのまま
    expect(screen.getAllByRole("button", { name: "＋" })).toHaveLength(4);
  });

  it("空きスロットを押すと onAddBet が呼ばれ、編集画面が開く", async () => {
    const onAddBet = vi.fn(() => "bet-1");
    // onAddBetは本物のフックと違い、実際にbetsへ追加はしてくれない(ただのモック)ので、
    // 返すIDに対応するベットをあらかじめbetsに含めておく
    renderBetPanel({ bets: [makeBet({ id: "bet-1" })], onAddBet });

    await userEvent.click(screen.getAllByRole("button", { name: "＋" })[0]);

    expect(onAddBet).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "確定" })).toBeInTheDocument();
  });

  it("既に追加済みのベットをクリックしても編集画面が開く(onAddBetは呼ばれない)", async () => {
    const onAddBet = vi.fn(() => "bet-1");
    renderBetPanel({
      bets: [makeBet({ id: "bet-1", selectedRunners: [runners[0]] })],
      onAddBet,
    });

    await userEvent.click(screen.getByText("単勝"));

    expect(onAddBet).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "確定" })).toBeInTheDocument();
  });

  it("BETTING中かつcanSubmitならBETするボタンは有効化される", () => {
    renderBetPanel({ canSubmit: true });

    expect(screen.getByRole("button", { name: "BETする" })).toBeEnabled();
  });

  it("BETTING中でなければBETするボタンは無効化される", () => {
    renderBetPanel({ canSubmit: true, phase: "DRAWING" });

    expect(screen.getByRole("button", { name: "BETする" })).toBeDisabled();
  });

  it("canSubmitがfalseならBETするボタンは無効化される", () => {
    renderBetPanel({ canSubmit: false });

    expect(screen.getByRole("button", { name: "BETする" })).toBeDisabled();
  });

  it("合計金額がある場合、BETするボタンに金額が表示される", () => {
    renderBetPanel({ canSubmit: true, totalBetAmount: 800 });

    expect(
      screen.getByRole("button", { name: "¥800 でBETする" }),
    ).toBeInTheDocument();
  });

  it("各ベットの枠に、賭け金と最大払戻額が表示される", () => {
    renderBetPanel({
      bets: [
        makeBet({
          betType: "WIN",
          selectedRunners: [runners[0]],
          betstr: "300",
        }),
      ],
    });

    expect(screen.getByText("賭け金")).toBeInTheDocument();
    expect(screen.getByText("¥300")).toBeInTheDocument();
    expect(screen.getByText("最大払戻")).toBeInTheDocument();
    // 300円 × オッズ1.2倍
    expect(screen.getByText("¥360")).toBeInTheDocument();
  });

  it("馬を選んでいない(不成立の)ベットの最大払戻は「-」になる", () => {
    renderBetPanel({
      bets: [makeBet({ selectedRunners: [] })],
    });

    expect(screen.getByText("最大払戻")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("BETするボタンで onSubmit が呼ばれる", async () => {
    const onSubmit = vi.fn();
    renderBetPanel({ canSubmit: true, onSubmit });

    await userEvent.click(screen.getByRole("button", { name: "BETする" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("削除ボタンで onRemoveBet がベットIDと一緒に呼ばれる", async () => {
    const onRemoveBet = vi.fn();
    renderBetPanel({
      bets: [makeBet({ id: "bet-1" }), makeBet({ id: "bet-2" })],
      onRemoveBet,
    });

    const removeButtons = screen.getAllByRole("button", { name: /削除/ });
    await userEvent.click(removeButtons[0]);

    expect(onRemoveBet).toHaveBeenCalledWith("bet-1");
  });

  it("編集画面で「やめる」を押すと、未成立(馬未選択)の新規ベットは削除される", async () => {
    const onAddBet = vi.fn(() => "bet-1");
    const onRemoveBet = vi.fn();
    renderBetPanel({
      bets: [makeBet({ id: "bet-1", selectedRunners: [] })], // 未成立
      onAddBet,
      onRemoveBet,
    });

    await userEvent.click(screen.getAllByRole("button", { name: "＋" })[0]);
    await userEvent.click(screen.getByRole("button", { name: "やめる" }));

    expect(onRemoveBet).toHaveBeenCalledWith("bet-1");
  });

  it("編集画面で「やめる」を押しても、成立済みのベットは削除されない", async () => {
    const onRemoveBet = vi.fn();
    renderBetPanel({
      bets: [makeBet({ id: "bet-1", selectedRunners: [runners[0]] })], // 成立済み
      onRemoveBet,
    });

    await userEvent.click(screen.getByText("単勝")); // 編集画面を開く
    await userEvent.click(screen.getByRole("button", { name: "やめる" }));

    expect(onRemoveBet).not.toHaveBeenCalled();
  });

  it("編集画面で「確定」を押すと、編集画面が閉じてスロット一覧に戻る", async () => {
    renderBetPanel({
      bets: [makeBet({ id: "bet-1", selectedRunners: [runners[0]] })],
    });

    await userEvent.click(screen.getByText("単勝"));
    await userEvent.click(screen.getByRole("button", { name: "確定" }));

    expect(
      screen.queryByRole("button", { name: "確定" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("単勝")).toBeInTheDocument(); // 簡易表示に戻っている
  });
});
