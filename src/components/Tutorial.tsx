/**
 * 初回に表示する、ゲームの流れの説明のモーダル
 *
 * ステップ式で「次へ」「戻る」がある
 * いつでも「スキップ」で閉じられる
 */

import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { GUIDE_STEPS, BET_TYPE_GUIDE } from "../data/guide";
import styles from "./Tutorial.module.css";

type TutorialProps = {
  onClose: () => void;
};

export default function Tutorial({ onClose }: TutorialProps) {
  const [index, setIndex] = useState(0);
  const step = GUIDE_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === GUIDE_STEPS.length - 1;

  return (
    <Modal
      title="競馬ゲームへようこそ！"
      onClose={onClose}
      width={700}
      footer={
        <>
          {/* 進行度合いを示すドット */}
          <div
            className={styles.dots}
            aria-label={`${index + 1} / ${GUIDE_STEPS.length}`}
          >
            {GUIDE_STEPS.map((s, i) => (
              <span
                key={s.title}
                className={i === index ? styles.dotActive : styles.dot}
              />
            ))}
          </div>

          {/* 「戻る」「次へ」「スキップ」「はじめる」ボタン */}
          <div className={styles.footer}>
            {isFirst ? (
              <button type="button" className={styles.skip} onClick={onClose}>
                スキップ
              </button>
            ) : (
              <button type="button" onClick={() => setIndex(index - 1)}>
                戻る
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                className={styles.primary}
                onClick={onClose}
              >
                <Icon name="check" />
                はじめる
              </button>
            ) : (
              <button
                type="button"
                className={styles.primary}
                onClick={() => setIndex(index + 1)}
              >
                次へ
              </button>
            )}
          </div>
        </>
      }
    >
      <div className={styles.step}>
        <div className={styles.icon}>
          <Icon name={step.icon} size={32} />
        </div>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <div className={styles.lines}>
          {step.body.map((line) => (
            <p key={line} className={styles.line}>
              {line}
            </p>
          ))}
        </div>

        {/* BETのしかたのステップでは、券種のちがいも一緒に見せる */}
        {step.icon === "ticket" && (
          <dl className={styles.types}>
            {BET_TYPE_GUIDE.map((t) => (
              <div key={t.name} className={styles.type}>
                <dt>{t.name}</dt>
                <dd>{t.description}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Modal>
  );
}
