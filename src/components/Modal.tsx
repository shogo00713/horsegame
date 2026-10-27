/**
 * 画面の中央に出るダイアログの共通部品
 *
 * 閉じるボタンか、背景のクリックか、Escキーで閉じる
 */

import { useEffect, type ReactNode } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number; // ダイアログの最大幅(px)
};

export default function Modal({
  title,
  onClose,
  children,
  footer,
  width = 700,
}: ModalProps) {
  useEffect(() => {
    // Escキーが押されるか見張る
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // モーダルを出している時は、見張り役を置く
    window.addEventListener("keydown", handleKeyDown);
    // モーダルを閉じたら、見張り役を外す
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );
}
