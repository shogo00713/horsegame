import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DRAW_DURATION_MS } from "../logic/controlRaceAnimation";
import ResultPanel from "./ResultPanel";
import type { Runner } from "../types/game";

// テスト用の馬データ
const runners: Runner[] = [
  {
    id: "phoenix",
    name: "フェニックス",
    odds: 1.2,
    description: "圧倒的なスピードで駆け抜ける本命馬",
  },
  { id: "storm", name: "ストームエッジ", odds: 2.0 },
];

// テスト用の着順データ
const result: Runner[] = [
  {
    id: "phoenix",
    name: "フェニックス",
    odds: 1.2,
    description: "圧倒的なスピードで駆け抜ける本命馬",
  },
  { id: "storm", name: "ストームエッジ", odds: 2.0 },
];

describe("ResultPanel", () => {
  it("BETTINGフェーズの場合、出走馬一覧(枠番・馬名・一言紹介・オッズ)が表示される", () => {
    render(
      <ResultPanel
        phase="BETTING"
        runners={runners}
        result={[]}
        betMarks={{}}
        onSkip={() => {}}
      />,
    );

    expect(screen.queryByText("着順")).toBeNull();
    expect(screen.queryByText("前回結果")).toBeNull();

    const rows = screen.getAllByTestId("entry-row");
    expect(rows).toHaveLength(runners.length);
    expect(rows[0]).toHaveTextContent("フェニックス");
    expect(rows[0]).toHaveTextContent("圧倒的なスピード");
    expect(rows[0]).toHaveTextContent("1.2");
    expect(rows[1]).toHaveTextContent("ストームエッジ");
    expect(rows[1]).toHaveTextContent("2.0");
  });

  it("BETTINGフェーズでは、前回3位以内の馬に「前回n位」の印が付く", () => {
    render(
      <ResultPanel
        phase="BETTING"
        runners={runners}
        result={[runners[1], runners[0]]} // 前回は storm が1着、phoenix が2着
        betMarks={{}}
        onSkip={() => {}}
      />,
    );

    const [phoenixRow, stormRow] = screen.getAllByTestId("entry-row");
    expect(phoenixRow).toHaveTextContent("前回2位");
    expect(stormRow).toHaveTextContent("前回1位");
  });

  it("前回のレースが無ければ、印は付かない", () => {
    render(
      <ResultPanel
        phase="BETTING"
        runners={runners}
        result={[]}
        betMarks={{}}
        onSkip={() => {}}
      />,
    );

    expect(screen.queryByText(/前回/)).toBeNull();
  });

  describe("DRAWINGフェーズ(抽選演出)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function renderDrawing(onSkip = () => {}) {
      render(
        <ResultPanel
          phase="DRAWING"
          runners={runners}
          result={result}
          betMarks={{}}
          onSkip={onSkip}
        />,
      );
    }

    it("演出中は、名前入りのプレートが順位ごとに表示される", () => {
      renderDrawing();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const plates = screen.getAllByTestId("runner-plate");
      expect(plates).toHaveLength(runners.length);
      expect(plates.map((p) => p.dataset.rank).sort()).toEqual(["1", "2"]);
    });

    it("演出の終盤は、プレートが結果どおりの順位に収まる", () => {
      renderDrawing();

      act(() => {
        vi.advanceTimersByTime(DRAW_DURATION_MS - 100);
      });

      const byRank = Object.fromEntries(
        screen
          .getAllByTestId("runner-plate")
          .map((p) => [p.dataset.rank, p.textContent]),
      );
      expect(byRank["1"]).toContain("フェニックス");
      expect(byRank["2"]).toContain("ストームエッジ");
    });

    it("自分がBETした馬のプレートには、BETの番号の印が付く", () => {
      render(
        <ResultPanel
          phase="DRAWING"
          runners={runners}
          result={result}
          betMarks={{ storm: [1, 3] }}
          onSkip={() => {}}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const plates = screen.getAllByTestId("runner-plate");
      const marked = plates.filter((p) => p.textContent?.includes("BET"));
      expect(marked).toHaveLength(1);
      expect(marked[0]).toHaveTextContent("ストームエッジ");
      // 複数のベットで選んでいれば、番号がすべて付く
      expect(marked[0]).toHaveTextContent("BET1");
      expect(marked[0]).toHaveTextContent("BET3");
    });

    it("スキップボタンで onSkip が呼ばれる", async () => {
      vi.useRealTimers();
      const onSkip = vi.fn();
      renderDrawing(onSkip);

      await userEvent.click(
        screen.getByRole("button", { name: "結果へスキップ" }),
      );

      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });
});
