import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BetEditor from "./BetEditor";
import type { Runner, BetDraft } from "../types/game";

const runners: Runner[] = [
  { id: "phoenix", name: "フェニックス", odds: 1.2 },
  { id: "storm", name: "ストームエッジ", odds: 2.0 },
];

function renderEditor(overrides: Partial<BetDraft> = {}) {
  const props = {
    bet: {
      id: "bet-1",
      betType: "WIN",
      selectedRunners: [],
      betstr: "300",
      ...overrides,
    } as BetDraft,
    runners,
    onChangeBetType: vi.fn(),
    onChangeBetAmount: vi.fn(),
    onToggleRunner: vi.fn(),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };
  render(<BetEditor {...props} />);
  return props;
}

describe("BetEditor - 券種", () => {
  it("6つの券種が横に並ぶボタンとして表示され、選択中のものだけ選択状態になる", () => {
    renderEditor({ betType: "QUINELLA" });

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "馬連" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "単勝" })).not.toBeChecked();
  });

  it("券種のボタンを1回押すだけで、券種が切り替わる", async () => {
    const props = renderEditor();

    await userEvent.click(screen.getByRole("radio", { name: "3連単" }));

    expect(props.onChangeBetType).toHaveBeenCalledWith("TRIFECTA");
  });
});

describe("BetEditor - 賭け金", () => {
  it("定額ボタン(500円・5,000円・1万円)で金額を選べる", async () => {
    const props = renderEditor();

    await userEvent.click(screen.getByRole("button", { name: "500円" }));
    await userEvent.click(screen.getByRole("button", { name: "5,000円" }));
    await userEvent.click(screen.getByRole("button", { name: "1万円" }));

    expect(props.onChangeBetAmount.mock.calls).toEqual([
      ["500"],
      ["5000"],
      ["10000"],
    ]);
  });

  it("定額と同じ金額のときは、そのボタンが選択状態になり、好きな額の欄は空になる", () => {
    renderEditor({ betstr: "5000" });

    expect(screen.getByRole("button", { name: "5,000円" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("textbox", { name: "好きな額" })).toHaveValue("");
  });

  it("定額以外の金額のときは、好きな額の欄にその金額が入っている", () => {
    renderEditor({ betstr: "300" });

    expect(screen.getByRole("textbox", { name: "好きな額" })).toHaveValue(
      "300",
    );
    ["500円", "5,000円", "1万円"].forEach((name) =>
      expect(screen.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "false",
      ),
    );
  });

  it("好きな額の欄に入力すると、その値で金額が変わる", async () => {
    const props = renderEditor({ betstr: "" });

    await userEvent.type(
      screen.getByRole("textbox", { name: "好きな額" }),
      "7",
    );

    expect(props.onChangeBetAmount).toHaveBeenCalledWith("7");
  });
});
