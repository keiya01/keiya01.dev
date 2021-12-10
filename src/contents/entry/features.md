---
layout: blog/entry
title: このブログの機能について
description: コンテンツ表示のための機能についてまとめています。
date: 2021-07-31
tags:
  - blog
ogImageName: features
---

## タイトルです。

説明文を記載します。

## リストです

- これ
- this
  - deep
- あれ
  - deep
- there

### サブタイトルです。

ここで `コード` を表示します。
ここで**太文字**を表示します
ここで~~文字を消し~~ます。

> HTML の `<blockquote>` 要素 (HTML ブロック引用要素) は、内包する要素の文字列が引用文であることを示します。
> <cite>[\<blockquote\>: ブロック引用要素](https://developer.mozilla.org/ja/docs/Web/HTML/Element/blockquote)</cite>

上記の記述は引用文です。

#### サブサブタイトルです。

説明文です。

## コードブロック

コードブロックは [prismjs](https://prismjs.com/) で行っています。
CSS は `public/css` 配下に格納してそれを配信しています。

```js
const fn = () => console.log("Hello World");
```

## 画像を表示します。

画像は 1 枚の `png` or `jpeg` を `public/contents/blog_filename` 配下に置きます。

ビルドタイムで配下にある画像たちを `webp` や `AVIF` 形式に変換します。

[11ty-img](https://www.11ty.dev/docs/plugins/image/)でやっても良かったのですが、ビルドのたびに画像の変換処理が走るのは重くなりそうなので、自前で一度だけビルドするようにします。

下の方法で行います。

- 初回のビルドで `public/contents/blog_filename` 配下の画像を `webp` や `AVIF` へ変換します。
- 変換されたファイルは `public/contents/blog_filename` に格納されます。
- 2 回目以降はこれらの画像の存在を確認し、存在していれば画像のビルドをスキップします。

### 花火の画像です。

画像の埋め込みはマクロでやってもいいな。

横長の画像です。

::: picture size=883x252 description="Lighthouse のスコアが全て 100 点" src="/public/contents/features/hanabi.png" :::

正方形の画像です。

::: picture size=883x711 description="Lighthouse のスコアが全て 100 点" src="/public/contents/features/hanabi_all.png" :::
