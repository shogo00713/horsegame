/**
 * 装飾用のインラインSVGアイコン(汎用的なものだけの最小セット)
 * 色は currentColor を使うので、親のcolorに追従する
 */

import styles from "./Icon.module.css";

const PATHS = {
  // チケット(BET)
  ticket: "M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3v3zM13 6v12",
  // 鉛筆(編集)
  pencil: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
  // コイン(払戻)
  coins:
    "M12 11c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 8v4c0 1.7 3.6 3 8 3s8-1.3 8-3V8M4 12v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4",
  // 時計(履歴)
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  // 月(ダークモードへ)
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  // 太陽(ライトモードへ)
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  // 円形の矢印(リセット)
  refresh: "M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12A9 9 0 0 1 18.5 5.8L21 8M21 3v5h-5M3 21v-5h5",
  // メニュー(三本線)
  menu: "M4 6h16M4 12h16M4 18h16",
  // チェック
  check: "M5 12l5 5L20 7",
  // 再生(スタート)
  play: "M6 4l14 8-14 8V4z",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = "1em",
}: {
  name: IconName;
  size?: string | number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: "-0.125em", flexShrink: 0 }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function HorseIcon() {
  return <span className={styles.horse} aria-hidden="true" />;
}
