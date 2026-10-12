/**
 * Betする画面を構成するコンポーネント
 *
 * 普段は、最大件数ぶんの「固定スロット」を表示する(空きは＋、埋まっていれば簡易表示)。
 * スロットをクリックすると、パネルの中身がその場で編集画面(BetEditor)に差し替わる。
 * 画面全体を覆うモーダルにはしない(左側のレース画面を隠さないため)。
 */

import { useState } from "react";
import type {
  BetType,
  Phase,
  Runner,
  BetDraft,
  Conditions,
} from "../types/game";
import styles from "./BetPanel.module.css";
import BetSummary from "./BetSummary";
import BetEditor from "./BetEditor";
import Icon from "./Icon";
import { isValidBet, buildBetSelection } from "../logic/betRules";
import { calculateMaxPayout } from "../logic/payout";

// 親コンポーネントから渡されるprops
type BetPanelProps = {
  bets: BetDraft[];
  phase: Phase;
  runners: Runner[];
  conditions?: Conditions; // デバッグ表示用(開発時のみ使う)
  maxBets: number;
  totalBetAmount: number;
  submitBlockReason: string | null; // 「BETする」を押せない理由(押してよければ null)

  onAddBet: () => string | null;
  onRemoveBet: (id: string) => void;
  onChangeBetType: (id: string, betType: BetType) => void;
  onChangeBetAmount: (id: string, value: string) => void;
  onToggleRunner: (id: string, runner: Runner) => void;
  onSubmit: () => void;
};

export default function BetPanel({
  bets,
  phase,
  runners,
  conditions,
  maxBets,
  totalBetAmount,
  submitBlockReason,
  onAddBet,
  onRemoveBet,
  onChangeBetType,
  onChangeBetAmount,
  onToggleRunner,
  onSubmit,
}: BetPanelProps) {
  // 今編集中のベットのID(nullなら通常のスロット一覧を表示)
  const [editingBetId, setEditingBetId] = useState<string | null>(null);

  const isNotBetting = phase !== "BETTING";
  const isSubmitDisabled = isNotBetting || submitBlockReason !== null;
  // 押せない理由は、ベット受付中だけ見せる(抽選中は所持金が減っているため、理由として不適切)
  const submitHint = isNotBetting ? null : submitBlockReason;
  const editingBet = bets.find((b) => b.id === editingBetId) ?? null;

  function handleAddClick() {
    const newId = onAddBet();
    if (newId) setEditingBetId(newId);
  }

  function handleConfirm() {
    setEditingBetId(null);
  }

  function handleClose() {
    // 未成立(馬未選択など)の新規ベットは、閉じるときに削除する
    if (editingBet && !isValidBet(editingBet)) {
      onRemoveBet(editingBet.id);
    }
    setEditingBetId(null);
  }

  // 編集中は、パネルの中身を丸ごと編集画面に差し替える
  if (editingBet) {
    return (
      <div className={styles.betPanel}>
        <BetEditor
          bet={editingBet}
          runners={runners}
          conditions={conditions}
          onChangeBetType={(betType) => onChangeBetType(editingBet.id, betType)}
          onChangeBetAmount={(value) => onChangeBetAmount(editingBet.id, value)}
          onToggleRunner={(runner) => onToggleRunner(editingBet.id, runner)}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className={styles.betPanel}>
      <div className={styles.header}>
        <div className={styles.mainTitle}>
          <Icon name="ticket" /> BET
        </div>
        <p className={styles.guide}>
          ＋の枠をタップ → 券種・馬・金額を選んで「確定」→
          最後に「BETする」でレース開始！
        </p>
      </div>

      <div className={styles.slotList}>
        {Array.from({ length: maxBets }, (_, index) => {
          const bet = bets[index];

          if (bet) {
            const selection = buildBetSelection(
              bet.betType,
              bet.selectedRunners,
            );
            const amount = Number(bet.betstr);
            return (
              <BetSummary
                key={bet.id}
                bet={bet}
                index={index}
                maxPayout={
                  selection && amount > 0
                    ? calculateMaxPayout(amount, selection, runners)
                    : null
                }
                disabled={isNotBetting}
                onEdit={() => setEditingBetId(bet.id)}
                onRemove={() => onRemoveBet(bet.id)}
              />
            );
          }

          return (
            <button
              key={`empty-${index}`}
              type="button"
              className={styles.emptySlot}
              disabled={isNotBetting}
              onClick={handleAddClick}
            >
              ＋
              <span className={styles.emptyHint} aria-hidden="true">
                タップしてBETを追加
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.row}>
        <span>合計BET額</span>
        <span>¥{totalBetAmount}</span>
      </div>

      {/* 空のときも高さは確保しておく(理由の出入りでレイアウトが動かないように) */}
      <p className={styles.submitHint} aria-live="polite">
        {submitHint}
      </p>

      <button
        className={styles.betPanelSubmitButton}
        disabled={isSubmitDisabled}
        onClick={onSubmit}
      >
        {!isSubmitDisabled && <Icon name="play" />}{" "}
        {totalBetAmount > 0 ? `¥${totalBetAmount} でBETする` : "BETする"}
      </button>
    </div>
  );
}
