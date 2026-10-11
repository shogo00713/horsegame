/**
 * 競馬ゲーム全体の進行を管理するカスタムフック
 *
 * go() で1回のレースが進行する
 * accept() でレース結果を確定し、次のレースに進む
 */

import { useEffect, useRef, useState } from "react";
import { runners } from "../data/runners";
import type {
  BetType,
  Phase,
  Runner,
  RaceHistory,
  Bet,
  BetResult,
  Conditions,
} from "../types/game";
import { makeFinishOrder } from "../logic/race";
import { calculatePayout } from "../logic/payout";
import { MAX_HISTORY } from "../logic/history";
import { DRAW_DURATION_MS } from "../logic/drawAnimation";
import { dealConditions, isValidConditions } from "../logic/condition";
import {
  maxSelectable,
  buildBetSelection,
  canResetMoney,
  totalBetAmount,
  canSubmitBets,
  validateBetRules,
} from "../logic/betRules";

// 最大のベット件数
const MAX_BETS = 5;

// 空のベットを1件作る
function createEmptyBet(): Bet {
  return {
    id: crypto.randomUUID(),
    betType: "WIN",
    selectedRunners: [],
    betstr: "300",
  };
}

// --- 保存データの読み込み系 ---

/**
 * localStorage から過去のレース結果を読み込む関数
 *
 * @returns 過去のレース結果
 */
function loadHistory(): RaceHistory[] {
  try {
    const saved = localStorage.getItem("horse-race-history");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * localStorage から現在のレース番号を読み込む関数
 *
 * レース番号自体が生きるところはあまりないが、履歴で表示する用にまだ置いている
 *
 * @returns 現在のレース番号 (整数)
 */
function loadRaceNo(): number {
  const saved = localStorage.getItem("horse-race-no");
  return saved ? Number(saved) : 1;
}

/**
 * localStorage から各馬の調子を引き継いで読み込む関数
 *
 * 調子の形式が不正 or 初回の場合は、dealConditions() で新しく調子を配り直す
 *
 * @returns 各馬の調子を、馬のIDごとにまとめた形
 */
function loadConditions(): Conditions {
  try {
    const saved = localStorage.getItem("horse-conditions");
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (isValidConditions(parsed, runners)) return parsed;
  } catch {
    // 壊れたデータは無視して作り直す
  }
  return dealConditions(runners);
}

// ------------------------------

export function useHorseGame() {
  // --- ゲームの状態を保持するstateたち (めちゃ重要!!!!!!!) ---
  const [money, setMoney] = useState(5000);
  const [phase, setPhase] = useState<Phase>("BETTING");
  const [payout, setPayout] = useState(0);
  const [betResults, setBetResults] = useState<BetResult[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [result, setResult] = useState<Runner[]>([]);
  const [previousResult, setPreviousResult] = useState<Runner[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [raceHistory, setRaceHistory] = useState<RaceHistory[]>(loadHistory);
  const [raceNo, setRaceNo] = useState<number>(loadRaceNo);
  const [conditions, setConditions] = useState<Conditions>(loadConditions);

  useEffect(
    () => () => {
      if (drawTimerRef.current) clearTimeout(drawTimerRef.current);
    },
    [],
  );
  // ----------------------------------------------------

  // --- ベットに関する操作の関数たち ---
  /**
   * 新たにベットを1件追加する関数
   *
   * @returns 作成したベットのID (0~最大サイズ-1)
   */
  function addBet(): string | null {
    if (bets.length >= MAX_BETS) return null;
    const newBet = createEmptyBet();
    setBets((prev) => [...prev, newBet]);
    return newBet.id;
  }

  /**
   * ベットを1件削除する関数
   *
   * @param id 削除するベットのID
   */
  function removeBet(id: string) {
    setBets((prev) => prev.filter((b) => b.id !== id));
  }

  /**
   * 指定したベットの賭け方を変更する関数
   *
   * @param id 変更するベットのID
   * @param nextBetType 変更先の賭け方
   */
  function changeBetType(id: string, nextBetType: BetType) {
    setBets((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, betType: nextBetType, selectedRunners: [] } : b,
      ),
    );
  }

  /**
   * 指定したベットの賭け金額を変更する関数
   *
   * @param id 変更するベットのID
   * @param value 変更先の賭け金額
   */
  function changeBetAmount(id: string, value: string) {
    setBets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, betstr: value } : b)),
    );
  }

  /**
   * 指定したベットの、選択中の馬を切り替える関数
   *
   * @param id 変更するベットのID
   * @param runner 選択する馬
   */
  function toggleRunner(id: string, runner: Runner) {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;

        const exists = b.selectedRunners.some((r) => r.id === runner.id);

        // 選ばれていたら → 解除
        if (exists) {
          return {
            ...b,
            selectedRunners: b.selectedRunners.filter(
              (r) => r.id !== runner.id,
            ),
          };
        }

        const max = maxSelectable(b.betType);

        // 1頭 → 押したやつをそのまま選択
        if (max === 1) {
          return { ...b, selectedRunners: [runner] };
        }

        // まだ選択できる数未満なら → 追加
        if (b.selectedRunners.length < max) {
          return { ...b, selectedRunners: [...b.selectedRunners, runner] };
        }

        // 選択できる数すでに選ばれていたら → 何もしない
        return b;
      }),
    );
  }
  // ---------------------------------

  /**
   * 所持金をリセットする関数
   *
   * フェーズがBETTINGで、所持金が500円以下のときのみ有効(canResetMoney() で検証)
   *
   * @returns なし
   */
  function resetMoney() {
    if (canResetMoney(phase, money)) {
      if (window.confirm("所持金を2000円にリセットします。よろしいですか？")) {
        setTimeout(() => {
          setMoney(2000);
        }, 2000);
      }
    }
  }

  /**
   * 実際の1レースの進行を行う関数
   *
   * BETするのボタンを押した瞬間から動き出して、その結果の確定までを時系列で行う
   *
   * @returns なし (内部での状態の更新がすべて)
   */
  function go() {
    // ----- 抽選前 -----
    if (phase !== "BETTING") return;

    // すでにベットは確定、その全額を計算
    const total = totalBetAmount(bets);

    // 入力のエラーチェック
    setErrorMessage("");
    const error = validateBetRules(bets, total, money);
    if (error) {
      setErrorMessage(error);
      return;
    }

    // ----- 抽選中 -----
    // 結果と払い戻しはここで確定させておく(画面側は演出としてゆっくり見せるだけ)
    setPhase("DRAWING");
    setMoney((prev) => prev - total);

    setPreviousResult(result);
    const finishOrder = makeFinishOrder(runners, conditions);
    setResult(finishOrder);

    // ベットごとに払い戻しを計算する
    const results: BetResult[] = bets.map((bet) => {
      const selection = buildBetSelection(bet.betType, bet.selectedRunners);
      const betPayout = calculatePayout(
        Number(bet.betstr),
        selection,
        finishOrder,
      );
      return { bet, payout: betPayout };
    });
    setBetResults(results);
    setPayout(results.reduce((sum, r) => sum + r.payout, 0));

    // 抽選演出のアニメーション
    drawTimerRef.current = setTimeout(() => {
      drawTimerRef.current = null;
      setPhase("PAYOUT");
    }, DRAW_DURATION_MS);
  }

  function skipDrawing() {
    if (phase !== "DRAWING") return;
    if (drawTimerRef.current) {
      clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    setPhase("PAYOUT");
  }

  /**
   * レース結果を確定し、次のレースに進む関数
   *
   * @returns なし (内部での状態の更新がすべて)
   */
  function accept() {
    // 新しい履歴を作成
    const newHistory: RaceHistory = {
      raceNo,
      result, // 今のレース結果
    };

    // 直近 MAX_HISTORY レース分だけ保持
    const updated = [newHistory, ...raceHistory].slice(0, MAX_HISTORY);

    setRaceHistory(updated);
    setRaceNo((n) => n + 1);

    // localStorage に保存
    localStorage.setItem("horse-race-history", JSON.stringify(updated));
    localStorage.setItem("horse-race-no", String(raceNo + 1));

    // 次のレースに向けて、各馬の調子を配り直す
    const nextConditions = dealConditions(runners, conditions);
    setConditions(nextConditions);
    localStorage.setItem("horse-conditions", JSON.stringify(nextConditions));

    // 次のレースの準備
    setMoney((prev) => prev + payout);
    setPhase("BETTING");
    setPayout(0);
    setBetResults([]);
    setBets([]);
  }

  return {
    runners,
    money,
    phase,
    payout,
    bets,
    betResults,
    result,
    previousResult,
    conditions,
    errorMessage,
    raceHistory,
    canResetMoney: canResetMoney(phase, money),
    canSubmit: canSubmitBets(bets, money),
    totalBetAmount: totalBetAmount(bets),
    maxBets: MAX_BETS,
    addBet,
    removeBet,
    changeBetType,
    changeBetAmount,
    toggleRunner,
    go,
    skipDrawing,
    accept,
    resetMoney,
  };
}
