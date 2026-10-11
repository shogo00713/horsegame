/**
 * ダークモード切り替えを行う、その情報を保持するためのカスタムフック
 */

import { useState, useEffect } from "react";

type Theme = "light" | "dark";

/**
 * ダークモード切り替えを行う、その情報を保持するためのカスタムフック
 *
 * @returns theme - 現在のテーマ(light/dark)
 * @returns toggleTheme - テーマを切り替える関数
 */
export function useTheme() {
  // テーマ切り替えの状態を保持するフック
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  // テーマの更新情報を localStorage に保存する部分
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 実際にテーマを切り替える関数
  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return { theme, toggleTheme };
}
