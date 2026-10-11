## はじめに

実際に画面が立ち上がるまでのコードがどこなのかをまとめる

## 1. `index.html`

コードの中身は次

```
<!doctype html>
<html lang="ja">
  <head>
    ....
    <title>horsegame</title>
    <script type="module" src="/src/index.tsx"></script>
  </head>

  <body>
    <noscript>JavaScriptを有効にしてください</noscript>
    <div id="root"></div>
  </body>
</html>
```

- `<script>` で使用する `index.tsx` の位置が示されている
- その後の body の `<div id="root"></div>` で、実際に画面が構成されることとなる

## 2. `index.tsx`

コードの中身は次

```
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- 最初に、 `import "./index.css"` で、 CSS をimportしている
- 前半部分では、 `index.html` から `#root` を探し出してきて、そこを React の描画先と指定している
- 後半部分では、 `<App />` 以下で実際に画面を構成する

## 3. `App.tsx` と全体の構成

`<App />` 以降は、役割ごとに次のように分かれている

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "fontFamily": "Hiragino Sans, Noto Sans JP, Yu Gothic, Meiryo, sans-serif",
    "fontSize": "15px",
    "primaryColor": "#f5f5f5",
    "primaryTextColor": "#111111",
    "primaryBorderColor": "#222222",
    "lineColor": "#9a9a9a",
    "textColor": "#111111",
    "edgeLabelBackground": "#ffffff"
  },
  "flowchart": { "htmlLabels": false, "padding": 30, "nodeSpacing": 40, "rankSpacing": 70 }
}}%%
flowchart TD
    index["`**index.tsx**
起動してAppを描画`"]
    App["`**App.tsx**
画面の組み立て役
モーダル開閉だけ自分で持つ`"]

    subgraph hooks["hooks/：状態と更新ロジック"]
        HG["`**useHorseGame**
ゲームのstate
お金・フェーズ・ベット
結果・調子・履歴
更新関数go・acceptなど`"]
        TH["`**useTheme**
ライト・ダーク切替`"]
        TU["`**useTutorial**
チュートリアルの開閉`"]
    end

    comp["`**components/**
Header・ResultPanel
BetPanel・PayoutPanel
各モーダル など
stateは持たず表示だけ`"]

    subgraph lower["計算・データ・保存"]
        LG["`**logic/**
純粋な計算だけ
race・payout・odds
condition・betRules
history・drawAnimation`"]
        data["`**data/**
runners：馬のデータ
guide：ガイド文`"]
        ls[("`**localStorage**
履歴・調子・テーマ`")]
    end

    index -->|"描画"| App
    App -->|"呼び出す"| hooks
    hooks -->|"state と関数を返す"| App
    App -->|"props で配る"| comp
    comp -.->|"ボタン操作で関数を呼ぶ"| HG

    HG -->|"着順・払い戻し・調子"| LG
    HG -->|"馬を読む"| data
    data -->|"単勝オッズ計算"| LG
    comp -->|"表示用の計算"| LG
    comp -->|"ガイド文"| data
    hooks <-->|"保存・復元"| ls

    classDef entry fill:#111111,stroke:#111111,color:#ffffff,stroke-width:2px
    classDef hook fill:#ffffff,stroke:#111111,color:#111111,stroke-width:2px
    classDef view fill:#ececec,stroke:#111111,color:#111111,stroke-width:2px
    classDef calc fill:#d4d4d4,stroke:#111111,color:#111111,stroke-width:2px
    classDef store fill:#bdbdbd,stroke:#111111,color:#111111,stroke-width:2px
    class index,App entry
    class HG,TH,TU hook
    class comp view
    class LG,data calc
    class ls store

    style hooks fill:#4a4a4a,stroke:#cfcfcf,color:#ffffff,stroke-width:2px
    style lower fill:#6b6b6b,stroke:#cfcfcf,color:#ffffff,stroke-width:2px
```

- `App` が起点になり、 `hooks` を呼び出して、得られた state を `components` に配る
- **state は `hooks` が持つ**。ゲームの進行に関わるものは `useHorseGame` に集まっている (実際には、呼び出した `App` の state として React に管理される)
- **`logic` は state を持たない、純粋な計算だけ**を行う。 `hooks` からも `components` からも呼ばれる
- **`components` は、 state を直接変えない**。 `App` から渡された関数を呼ぶだけで、実際の更新は `useHorseGame` が行う
- 流れは「`hooks` → `App` → `components`」の一方向で、ボタン操作などは破線の向きで `useHorseGame` に戻る
