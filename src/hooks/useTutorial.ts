/**
 * 初回説明(チュートリアル)の表示状態を管理するカスタムフック
 *
 * 初めてアクセスしたときだけ自動で開く
 * この画面を「見た」という印は localStorage に残す
 */

import { useState } from "react";

const STORAGE_KEY = "horse-tutorial-seen";

/**
 * localStorage に「チュートリアルを見た」という印があるかどうかを返す関数
 *
 * 入力は localstorage から
 * @returns boolean - チュートリアルを見たかどうか
 */
function hasSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * 初回説明(チュートリアル)の表示状態を管理するカスタムフック
 *
 * @returns isOpen - チュートリアルが開いているかどうか
 * @returns open - チュートリアルを開く関数
 * @returns close - チュートリアルを閉じる関数
 */
export function useTutorial() {
  // 初期値は、これまでに見たことがないかで決まる
  const [isOpen, setIsOpen] = useState(() => !hasSeen());

  function open() {
    setIsOpen(true);
  }

  // 閉じる際に、 localStorage に「チュートリアルを見た」という印を残す
  function close() {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // 保存できなくても、画面は閉じる
      // まあまた出ても良いから
    }
  }

  return { isOpen, open, close };
}
