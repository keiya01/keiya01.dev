---
layout: blog/entry
title: ブログの構成について
description: ブログの構成について備忘録的にまとめてみます。
date: 2021-12-19
modified: 2021-12-19
tags:
  - architecture
entryId: architecture
---

## Overview

今回作成したブログでは読み込む JavaScript を自分で制御できるような構成にしてみました。  
自分で制御できるため、フレームワーク独自の最適化やハイドレーションに悩まされることなく開発できました。

## 技術選定

今回作成したブログでは JavaScript の使用を自分で制御できるような形の構成にしてみました。  
Next.js や Gatsby を使うとどうしてもライブラリ依存の JavaScript がブラウザ側で読み込まれてしまいます。今回のケースではライブラリが提供する最適化は不要(必要であれば自分で実装したい)なため Next.js のようなライブラリは使用しませんでした。

主に使っている技術は以下の通りです。

- 11ty
- TypeScript
- esbuild
- vanilla-extract
- web-components
- lint 系(eslint, prettier)

できるだけ packages を使わずに最小構成で作ることを目的としました。

## Static Generation

本ブログでは Static Generation でページを生成しており、11ty を使っています。  
11ty が一番カスタマイズしやすそうと思い選びましたが、ESM に対応していなかったり型がなかったりカスタマイズしづらい部分もあるので、後々 Rust とかで置き換えたいなと考えています。

## 開発環境周り

今回は 11ty を使用しているのでマークアップを JavaScript を使って書くことができます。[common-tags](https://www.npmjs.com/package/common-tags)という Template Literal で HTML を書くことができる package を使ってマークアップを書いています。
記事面のマークアップは以下のような書き方になります。

```ts
import { html } from "common-tags";

import { EleventyData, EleventyProps } from "../../../types/eleventy";
import { getFormattedDate } from "../../../utils/date";
import { TagList } from "../../components/entry/TagList";

import * as style from "./entry.css";

export const data: EleventyData = {
  layout: "global",
  // このページで読み込むリソースを指定する
  publics: ["css/prism.min.css"],
};

export const render = ({
  title,
  content,
  page,
  tags,
}: EleventyProps): string => {
  return html`
    <main>
      <article>
        <header>
          <h1 class="${style.title}">${title}</h1>
          <time datetime="${page.date}">${getFormattedDate(page.date)}</time>
          ${/* UpperCamelCaseでコンポーネント関数を定義 */}
          <div class="${style.tagList}">${TagList({ tags })}</div>
        </header>
        <section class="${style.content}">${content}</section>
      </article>
    </main>
  `;
};
```

スタイリングは[vanilla-extract](https://vanilla-extract.style/)を使用しており型安全にスタイルを適用しています。

```ts
import { style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

export const title = style({
  margin: "0 0 10px",
  fontSize: 35,
  color: vars.color_base,
  "@media": {
    "screen and (max-width: 375px)": {
      fontSize: 30,
    },
  },
});

/* ... */
```

`theme.css`で各スタイルを CSS variables として定義しています。これによりダークモードとの切り替えも簡単にできました。

11ty は TypeScript や vanilla-extract をサポートしていないので、自分でいい感じにする必要があります。  
基本的には esbuild で各ページごとのバンドルを作成し、[11ty の layout](https://www.11ty.dev/docs/layouts/)としてビルド結果のファイルを指定する形になります。  
dist にあるバンドルを[addLayoutAlias](https://www.11ty.dev/docs/layouts/#layout-aliasing)を使って使って自然な形で layout を指定できるように alias を設定します。

vanilla-extract で生成された css も意識せずに自動で layout ごと読み込んで欲しいです。  
また css ファイルには hash を含めてキャッシュを効率化したいので、esbuild から manifest.json を生成します。  
manifest.json からビルド結果の css ファイルを取得し、layout ごと default で読み込むようにします。

JavaScript を使って動的なコンポーネントを作りたい場合は WebComponents を使います。また計測スクリプトなども別で定義する仕組みがあります。

スクリプトは global なバンドルと各ページごとのバンドルに分けて作られます。

仕組み的にはあらかじめエントリーポイントを決めておき、使用する module を import します。  
以下の例では`pages/`配下のファイルをエントリーポイントとして、`entry.ts`で使用する module を import している例です。

```ts
// pages/entry.ts

import * from "../components/example-component.ts";
import * from "../features/ad.ts";
import * from "../features/webVitals.ts";
```

esbuild に各ページのエントリーポイントを指定してそれぞれのページごとにバンドルします。

JavaScript のバンドルもファイル名に hash を含めたいので manifest.json から hash 値付きのファイル名を取得し、ページごとに自動で読み込むようにしています。

## インフラ周り

インフラは Cloudflare Pages を使用しています。`_headers`を置けば Header も自由に設定できたりするのでかなり便利です。

アナリティクス系もついてくるので今はそれを利用しています。  
後々は Firebase Performance の導入や CSP のレポートを送る仕組みを作ったりしようかなと考えています。

## Edge Workers

Cloudflare Workers を使って OG 画像を生成しています。
詳しくは[Cloudflare Workers で OG 画像を生成する](https://blog.keiya01.dev/entry/og-image-in-workers/)を参照してください。

## Performance

サイトの規模自体がかなり小さいのでパフォーマンスは良いです。
[WebPageTest で計測してみた](https://www.webpagetest.org/result/211219_AiDc6K_b1b50ca42aca57f6cc174067f5e9e60f/)感じだと以下のような感じでした。

- LCP: 0.651s
- First Byte: 0.258s
- CLS: 0
- TBT: 0

特に特別なことをしていないので今後に期待という感じです。

## まとめ

まだまだ調整したいところはありますが、一旦リリースできてよかったです。
技術選定的には新しめの技術ですが 11ty だけ、いにしえ感があるので 11ty のようなシンプルな感じで新しいフレームワークがあれば教えてください。
