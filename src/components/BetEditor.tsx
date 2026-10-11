/**
 * 1件分のベットを作成・編集する画面
 *
 * モーダルではなく、BetPanelの中身をその場で丸ごとこれに差し替える形で使う
 * (左側のレース画面を隠さないようにするため)
 *
 * 「閉じる」: 中身が未成立(馬未選択など)な新規ベットは削除し、
 *            既に成立しているベットの場合はそのまま(編集内容を保持して)閉じる
 */

import type { BetType, Runner, Bet, Conditions } from "../types/game";
import { isOrderedBetType, isValidBet, betTypeLabel } from "../logic/betRules";
import styles from "./BetEditor.module.css";
import RunnerRow from "./RunnerRow";
import { CONDITION_LABELS } from "../logic/condition";
import Icon from "./Icon";

// 賭け金の定額ボタン
const AMOUNT_PRESETS = [
  { value: 1000, label: "1,000円" },
  { value: 5000, label: "5,000円" },
  { value: 10000, label: "1万円" },
];

const BET_TYPES: BetType[] = [
  "WIN",
  "PLACE",
  "QUINELLA",
  "EXACTA",
  "TRIO",
  "TRIFECTA",
];

type BetEditorProps = {
  bet: Bet;
  runners: Runner[];
  conditions?: Conditions; // デバッグ表示用(開発時のみ使う)
  onChangeBetType: (betType: BetType) => void;
  onChangeBetAmount: (value: string) => void;
  onToggleRunner: (runner: Runner) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function BetEditor({
  bet,
  runners,
  conditions,
  onChangeBetType,
  onChangeBetAmount,
  onToggleRunner,
  onConfirm,
  onClose,
}: BetEditorProps) {
  const isConfirmDisabled = !isValidBet(bet);
  const isPresetAmount = AMOUNT_PRESETS.some(
    (p) => String(p.value) === bet.betstr,
  );

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <span className={styles.title}>
          <Icon name="pencil" /> 馬券を作ろう
        </span>
        <span className={styles.guide}>
          ① 券種を選ぶ → ② 馬を選ぶ → ③ 金額を決めて「確定」！
        </span>
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="bet-type-label">
          ① 券種を選ぶ
        </span>
        <div
          className={styles.typeRow}
          role="radiogroup"
          aria-labelledby="bet-type-label"
        >
          {BET_TYPES.map((betType) => {
            const isActive = betType === bet.betType;
            return (
              <button
                key={betType}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={
                  isActive
                    ? `${styles.typeButton} ${styles.typeButtonActive}`
                    : styles.typeButton
                }
                onClick={() => onChangeBetType(betType)}
              >
                {betTypeLabel(betType)}
              </button>
            );
          })}
        </div>
      </div>

      <span className={styles.label}>② 馬を選ぶ</span>
      <div className={styles.runnerList}>
        {runners.map((r) => {
          const index = bet.selectedRunners.findIndex((s) => s.id === r.id);
          const isSelected = index !== -1;
          const badge =
            isSelected && isOrderedBetType(bet.betType)
              ? String(index + 1)
              : null;

          return (
            <RunnerRow
              key={r.id}
              runner={r}
              frameNumber={runners.indexOf(r) + 1}
              isSelected={isSelected}
              selectionBadge={badge}
              debugLabel={
                import.meta.env.DEV && conditions
                  ? CONDITION_LABELS[conditions[r.id]]
                  : null
              }
              disabled={false}
              onClick={() => onToggleRunner(r)}
            />
          );
        })}
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="bet-amount-label">
          ③ 賭け金を決める
        </span>
        <div
          className={styles.amountGroup}
          role="group"
          aria-labelledby="bet-amount-label"
        >
          {AMOUNT_PRESETS.map((preset) => {
            const isActive = bet.betstr === String(preset.value);
            return (
              <button
                key={preset.value}
                type="button"
                aria-pressed={isActive}
                className={
                  isActive
                    ? `${styles.amountButton} ${styles.amountButtonActive}`
                    : styles.amountButton
                }
                onClick={() => onChangeBetAmount(String(preset.value))}
              >
                {preset.label}
              </button>
            );
          })}

          {/* 好きな額を入力する(定額ボタンを選んでいるときは空にしておく) */}
          <label
            className={
              isPresetAmount
                ? styles.customAmount
                : `${styles.customAmount} ${styles.customAmountActive}`
            }
          >
            <input
              type="text"
              inputMode="numeric"
              placeholder="好きな額"
              aria-label="好きな額"
              value={isPresetAmount ? "" : bet.betstr}
              onChange={(e) => onChangeBetAmount(e.target.value)}
            />
            <span className={styles.yen}>円</span>
          </label>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose}>
          やめる
        </button>
        <button
          type="button"
          className={styles.confirmButton}
          disabled={isConfirmDisabled}
          onClick={onConfirm}
        >
          確定
        </button>
      </div>
    </div>
  );
}
