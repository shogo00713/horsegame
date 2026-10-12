# CSS「数値の指定」チートシート

このリポジトリのCSSを題材にした、数値(長さ・サイズ)の指定方法のまとめ。
「このコードのどこで使っているか」を、各所にリンクしてある。

## 0. 全体マップ

CSSの数値は、**「何を基準にするか」**で分類すると整理できる。

| 基準 | 単位 | 一言でいうと |
|---|---|---|
| 固定 | `px` | 画面に対して固定の大きさ |
| **文字の大きさ**が基準 | `em` `rem` `ch` `lh` | 文字に合わせて伸縮する |
| **画面(ビューポート)**が基準 | `vw` `vh` `dvh` `vmin` | ブラウザ窓の大きさに合わせる |
| **親・周りの要素**が基準 | `%` `fr` | 親の大きさ・余りの配分に合わせる |
| **コンテナ**が基準 | `cqw` `cqi` | 指定した親の大きさに合わせる(新しめ) |
| 単位なし | `1.6` `0` `1` | 倍率・個数・順序などの数 |
| **計算で組み合わせ** | `calc()` `min()` `max()` `clamp()` | 上のものを混ぜる |

---

## 1. 絶対長さ:`px`

```css
padding: 10px;
border: 1px solid var(--border);
```

- `px` は**画面の物理ピクセルではなく**、CSS上の基準ピクセル(約1/96インチ)。高解像度画面(Retina など)でも、`1px` は見た目ほぼ同じ太さになる。
- **向いている用途**:罫線(`border`)、細かい固定の隙間、影(`box-shadow`)。
- `cm` `mm` `in` `pt` などもあるが、画面では使わない(印刷用)。

> 注意:フォントサイズを `px` で固定すると、ユーザーがブラウザの文字サイズ設定を変えても追従しない(アクセシビリティの観点では `rem` が推奨)。

---

## 2. 文字の大きさが基準:`em` / `rem` / `ch` / `lh`

### `em`

**「その要素自身の `font-size`」の何倍か**。ただし `font-size` プロパティ自身に使うときだけは、**親の** `font-size` が基準になる。

```css
.box { font-size: 20px; padding: 1em; }   /* padding は 20px */
.box span { font-size: 1.5em; }           /* 親の 20px × 1.5 = 30px */
```

- **向いている用途**:文字の大きさに連動して余白や幅を変えたい部品(ボタンの `padding`、`letter-spacing` など)。
- **落とし穴**:`font-size` に `em` を使うと、入れ子のたびに**複利で掛かる**(1.5em の中の 1.5em は 2.25 倍)。

### `rem`

**`<html>` の `font-size`**(通常 16px)の何倍か。入れ子の影響を受けないので、文字サイズの指定に向いている。

```css
html { font-size: 16px; }
h2 { font-size: 1.5rem; }  /* 24px */
```

### `ch`

数字の「0」1文字分の幅。`max-width: 65ch` のように、**1行あたりの文字数**で幅を決めるのに便利。

> 日本語に注意:全角文字は「0」のほぼ2倍の幅なので、`ch` は日本語の文字数の目安にはならない。日本語なら `em` が素直(新しい単位 `ic` もあるが、対応状況に注意)。

### `lh`(新しめ)

その要素の `line-height` の何倍か。複数行の高さを揃えたいときに使う。

### このコードでの実例

| 書き方 | 意味 | 場所 |
|---|---|---|
| `width: 4.5em` | 文字の大きさの4.5倍(ラベルの列幅) | Tutorial / GuideContent の `dt` |
| `width: 3.5em` | オッズ列の幅(文字サイズに連動) | [EntryList.module.css:87](../src/components/EntryList.module.css) |
| `letter-spacing: 0.4em` | 字間を文字の0.4倍 | ResultPanel、BetPanel の見出し |

---

## 3. 画面(ビューポート)が基準:`vw` / `vh` ほか

| 単位 | 意味 |
|---|---|
| `1vw` | 画面幅の1% |
| `1vh` | 画面高さの1% |
| `vmin` / `vmax` | 縦横のうち小さい/大きいほうの1% |
| **`svh` / `lvh` / `dvh`** | スマホのアドレスバーを考慮した高さ(後述) |

```css
.app { min-height: 100vh; }          /* 画面いっぱい */
.dialog { max-height: 88vh; }        /* 画面の88%まで */
```

### 落とし穴

- **`100vw` はスクロールバーの幅を含む**ため、縦スクロールがあると、ぴったり `100vw` の要素は**横にはみ出す**ことがある。幅いっぱいなら `100%` が無難。
- **スマホの `100vh` 問題**:アドレスバーが出ている状態といない状態で、画面の高さが変わる。`100vh` は「アドレスバーが隠れた状態」の高さなので、**バーが出ているとはみ出す**ことがある。
  - `svh`:バーが出ている状態(小さいほう)
  - `lvh`:バーが隠れた状態(大きいほう。`vh` と同じ)
  - **`dvh`**:今の状態に追従する(おすすめ。ただし変動する)

---

## 4. 親が基準:`%`

**「何の何%か」はプロパティごとに違う**。ここが一番の落とし穴。

| プロパティ | `%` の基準 |
|---|---|
| `width` / `max-width` | 親(包含ブロック)の**幅** |
| `height` | 親の**高さ**(ただし親の高さが確定している場合のみ) |
| `padding` / `margin` | 親の**幅**(縦方向でも、幅が基準) |
| `font-size` | 親の `font-size` |
| `line-height` | その要素自身の `font-size` |
| `top` / `left` など(`position` 指定時) | 位置の基準になる親の高さ/幅 |
| **`transform: translate()`** | **その要素自身**の幅/高さ |
| `border-radius` | その要素自身の幅/高さ |
| `flex-basis` | flex コンテナの主軸方向の長さ |

### 落とし穴

1. **`height: 100%` は、親の高さが「確定」していないと効かない**(`auto` 扱いになる)。親が `height: auto` のままだと無視される。→ [HistoryModal.module.css:209](../src/components/HistoryModal.module.css) の `height: calc(100% - 28px)` を理解する鍵。
2. **`padding` の `%` は縦でも「幅」基準**。この性質を使って縦横比を保つ昔のテクニックがあったが、今は `aspect-ratio` を使う。
3. **`top: 50%` と `translateY(-50%)` の組み合わせ**は、「親の高さの50%の位置に置き、自分の高さの半分だけ戻す」という上下中央のテクニック(基準が違うので、両方必要)。→ [RunnerRow.module.css:41](../src/components/RunnerRow.module.css)

---

## 5. 単位なしの数

| 場所 | 例 | 意味 |
|---|---|---|
| `line-height` | `1.6` | **文字サイズの倍率**(推奨の書き方) |
| `flex` | `1 1 0` | 伸びる比率・縮む比率・基準サイズ |
| `opacity` | `0.5` | 0〜1 |
| `z-index` | `100` | 重なり順(整数) |
| `font-weight` | `500` | 太さ(100〜900) |
| `order` | `3` | 並び順 |
| **`0`** | `margin: 0` | **長さのゼロだけは、単位を省略できる** |

### 落とし穴

- **`line-height: 1.6`(単位なし)と `line-height: 160%` や `1.6em` は、継承の仕方が違う**。単位なしは「倍率」がそのまま子に継承され、子が自分の `font-size` に対して計算し直す。`%` や `em` は、**親で計算された px の値**が子に継承されるので、子の文字が大きいと行間が足りなくなる。→ [index.css:49](../src/index.css) は単位なしで正しい書き方。
- `0` は単位を省略できるが、**時間(`0s`)や `calc()` の中では省略できない**(`calc(0 + 10px)` は無効、`calc(0px + 10px)` が正しい)。

---

## 6. グリッド専用:`fr` ほか

### `fr`(fraction)

グリッドで、**固定サイズなどを引いた余りを、比率で分ける**単位。

```css
grid-template-columns: 200px 1fr 2fr;  /* 200px固定、残りを 1:2 */
```

### 重要:`1fr` は `minmax(auto, 1fr)` の略

最小値が `auto`(中身の幅)なので、**中身が長いとカラムが突き破られる**。これを避けるのが `minmax(0, 1fr)`。

```css
grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);  /* App.module.css:13 */
```

### トラックのよく使う関数

| 書き方 | 意味 |
|---|---|
| `repeat(4, 1fr)` | 1frを4つ |
| `minmax(220px, 1fr)` | 最小220px、最大1fr |
| `repeat(auto-fill, minmax(200px, 1fr))` | **メディアクエリなしの自動レスポンシブ**(幅に収まる分だけ列を作る) |

---

## 7. キーワード(数値ではないが、サイズを決める)

| 値 | 意味 |
|---|---|
| `auto` | 状況に応じて自動(プロパティごとに挙動が違う) |
| `min-content` | 中身が折り返せるだけ折り返した最小幅 |
| `max-content` | 中身が折り返さずに並んだ最大幅 |
| `fit-content` | `max-content` だが、親の幅を超えない |
| `stretch` | 余白を除いて、親いっぱいに広げる |

---

## 8. 計算で組み合わせる:`calc()` `min()` `max()` `clamp()`

### `calc()` ― 異なる単位を混ぜる

```css
height: calc(100% - 28px);                       /* HistoryModal.module.css:209 */
height: calc(var(--row-h) - 12px);               /* ResultPanel.module.css:157 */
```

**ルール**

- `+` と `-` は**前後にスペースが必須**。`calc(100%-28px)` は無効。
- `*` の片側、`/` の右側は、**単位なしの数**でなければならない(`px * px` は不可)。
- 単位なしの数を長さに変えたいときは `calc(var(--n) * 1px)`。
- `calc()` の中の `var()` は使える。

### `min()` / `max()` ― 小さいほう・大きいほうを採用

```css
width: min(1280px, 100%);    /* 1280px を上限に、狭い画面では100% */
height: min(900px, 92vh);    /* HistoryModal.module.css:15-16 */
```

- `width: min(1280px, 100%)` は、`width: 100%; max-width: 1280px` と同じ意味を、1行で書いたもの。
- 中で `calc` 抜きで計算もできる(`min(100% - 32px, 600px)`)。

### `clamp(最小, 好み, 最大)` ― 範囲に収める

```css
padding: clamp(12px, 2vw, 24px);              /* App.module.css:3 */
font-size: clamp(22px, 2.4vw, 30px);          /* Header.module.css:21 */
```

- 意味は `max(最小, min(好み, 最大))`。
- **「小さい画面では12px、大きい画面では24px、その間は画面幅に比例」**という**流体サイズ**が、メディアクエリなしで書ける。
- 真ん中(好み)に `vw` を使うのが定番。

> アクセシビリティの注意:`vw` だけだと、ブラウザの拡大(ズーム)で文字が大きくならないことがある。推奨は、`rem` を混ぜる書き方。
> ```css
> font-size: clamp(1rem, 0.8rem + 1vw, 1.5rem);
> ```

### 組み合わせの実例(このコードの中で一番高度)

```tsx
// ResultPanel.tsx:213
transform: `translateY(calc(${rank} * (var(--row-h) + var(--row-gap))))`
```

**単位なしの数(順位) × (長さ + 長さ)** という計算を、CSS変数を使って組み立てている。JS が `rank` だけを渡し、CSS が実際の長さを計算する分業。

---

## 9. コンテナ基準:`cqw` / `cqi`(新しめ)

```css
.card-wrapper { container-type: inline-size; }
.card h2 { font-size: clamp(1rem, 5cqi, 2rem); }  /* 親(コンテナ)の幅の5% */
```

画面幅ではなく、**部品が置かれた親の幅**で調整できる。同じ部品をサイドバーにもメインにも置く場合に、本領を発揮する。

---

## 10. 数値を使うその他の単位(参考)

| 種類 | 単位 | 使いどころ |
|---|---|---|
| 時間 | `s` `ms` | `transition: 0.7s`、`160ms` |
| 角度 | `deg` `turn` `rad` | `rotate(45deg)` |
| 割合 | `%` | `opacity: 50%`、`rgb(0 0 0 / 55%)` |

---

## 11. 使い分けの目安

| やりたいこと | 向いている書き方 |
|---|---|
| 罫線の太さ | `1px` |
| 文字サイズ | `rem`、または `clamp(rem, ..., rem)` |
| 文字に連動する余白・幅 | `em` |
| ページ全体の最低の高さ | `min-height: 100dvh` |
| 横幅いっぱい + 上限あり | `width: min(1280px, 100%)` |
| 画面幅に応じて滑らかに変わる大きさ | `clamp()` |
| 余りを比率で分ける | `fr`(`minmax(0, 1fr)` で安全に) |
| 列数を自動で変える | `repeat(auto-fill, minmax(○px, 1fr))` |
| 行間 | 単位なし(`1.6`) |
| 上下左右中央(絶対配置) | `top: 50%` + `transform: translateY(-50%)` |
| メディアクエリの閾値 | `px`、または `em` |

> メディアクエリの中では、`em` も `rem` も「ブラウザの初期のフォントサイズ(通常16px)」が基準になる(CSSで `html { font-size }` を変えても影響されない)。

---

## 12. よくある落とし穴まとめ

1. **`%` の基準はプロパティごとに違う**(`padding` の縦も幅基準、`translate` は自分自身基準)。
2. **`height: 100%` は、親の高さが確定していないと効かない**。
3. **`100vw` はスクロールバーを含む**。幅いっぱいは `100%`。
4. **スマホの `100vh` は、アドレスバーでずれる** → `dvh`。
5. **`em` を `font-size` に入れ子で使うと複利になる** → `rem`。
6. **`1fr` は `minmax(auto, 1fr)`** で、中身で突き破られる → `minmax(0, 1fr)`。
7. **`calc` の `+` `-` はスペース必須**。`0` は `0px` と単位を付ける。
8. **`line-height` は単位なし**が安全。
9. **`vw` だけの文字サイズは、ブラウザのズームに追従しない** → `rem` を混ぜる。
10. **`clamp` の最小 > 最大のときは、最小が勝つ**。

---

## このコードで実物を見られる場所

| 話題 | 場所 |
|---|---|
| `clamp` + `vw` で流体サイズ | [App.module.css:3](../src/App.module.css)、[Header.module.css:21](../src/components/Header.module.css)、[BetPanel.module.css:80](../src/components/BetPanel.module.css) |
| `minmax(0, 1fr)` | [App.module.css:13](../src/App.module.css) |
| `min()` で上限つき幅 | [HistoryModal.module.css:15](../src/components/HistoryModal.module.css) |
| `calc` で%とpxを混ぜる | [HistoryModal.module.css:209](../src/components/HistoryModal.module.css) |
| `calc` + CSS変数 | [ResultPanel.module.css:157](../src/components/ResultPanel.module.css)、[ResultPanel.tsx:213](../src/components/ResultPanel.tsx) |
| `em` で列幅 | [EntryList.module.css:87](../src/components/EntryList.module.css) |
| `top: 50%` + `translate` | [RunnerRow.module.css:41](../src/components/RunnerRow.module.css) |
| 単位なしの `line-height` | [index.css:49](../src/index.css) |
| `vh`(スマホで要注意) | [App.module.css:2](../src/App.module.css)、[Modal.module.css:16](../src/components/Modal.module.css) |
