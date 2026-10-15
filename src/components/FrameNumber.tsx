/**
 * 枠番(1〜8)の色付きの番号
 */

import styles from "./FrameNumber.module.css";

type FrameNumberProps = {
  number: number;
  size?: "normal" | "small";
};

export default function FrameNumber({
  number,
  size = "normal",
}: FrameNumberProps) {
  return (
    <span
      className={[
        styles.frame,
        styles[`frame${number}`],
        size === "small" && styles.small,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {number}
    </span>
  );
}
