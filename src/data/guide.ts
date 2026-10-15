/**
 * あそびかたの説明文
 *
 * 初回説明(チュートリアル)と、メニューの「あそびかた」で同じ内容を使う
 */

import type { IconName } from "../components/Icon";

export type GuideStep = {
  icon: IconName;
  title: string;
  body: string[];
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    icon: "play",
    title: "ゲームの流れ",
    body: [
      "① BET: 賭ける馬と金額を決める",
      "② レース: 順位が決まるのを見守る",
      "③ 払い戻し: 当たった分のお金を受け取る",
      "これを繰り返して、所持金を増やそう！",
    ],
  },
  {
    icon: "ticket",
    title: "BETのしかた",
    body: [
      "右の「＋」の枠をタップして、1口ぶんのベットを作ります。",
      "券種 → 馬 → 賭け金の順に選んで「確定」。最大5口まで同時に賭けられます。",
      "準備ができたら「BETする」を押すと、レースがスタート！",
    ],
  },
  {
    icon: "coins",
    title: "オッズと払い戻し",
    body: [
      "馬の右に出ているオッズが高いほど、当たりにくい「大穴」です。",
      "当たると、賭け金 × オッズが戻ってきます。",
      "券種や組み合わせによってオッズは変わります。右の「最大払戻」で、全部当たったときの金額を確認できます。",
    ],
  },
  {
    icon: "history",
    title: "調子を読もう",
    body: [
      "馬には、見えない「調子」があります。絶好調の馬は、高い確率で3着以内に入ります。",
      "調子は少しずつ入れ替わるので、好調な馬は数レース続くことが多いです。",
      "ヘッダーの「履歴」の馬別グラフで、最近の着順から調子を読み取ろう！",
    ],
  },
];

// 券種ごとの説明(「あそびかた」と初回説明で表示する)
export const BET_TYPE_GUIDE: { name: string; description: string }[] = [
  { name: "単勝", description: "1着になる馬を当てる" },
  { name: "複勝", description: "3着以内に入る馬を当てる" },
  { name: "馬連", description: "1着と2着の2頭を、順番は問わず当てる" },
  { name: "馬単", description: "1着と2着の2頭を、順番どおりに当てる" },
  { name: "3連複", description: "1〜3着の3頭を、順番は問わず当てる" },
  { name: "3連単", description: "1〜3着の3頭を、順番どおりに当てる" },
];
