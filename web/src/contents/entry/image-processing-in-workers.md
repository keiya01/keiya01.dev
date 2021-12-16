---
layout: blog/entry
title: Cloudflare Workers で画像処理を試す
description: Cloudflare Workers で OG 画像の生成や Squoosh を使った画像処理を試します。
date: 2021-12-17
modified: 2021-12-17
tags:
  - worker
  - image processing
ogImageName: image-processing-in-workers
---

## Overview

この記事では Cloudflare Workers 上で OG 画像の生成を試してみます。

Edge で実行できることで、オリジンサーバーへの負荷を軽減したり、地理的に近いところにリクエストが飛ぶので RTT が小さくなります。  
また、Static Generation を行なっている場合、OG 画像の生成や画像の事前処理はとても重い作業なのでビルド時間が長くなってしまいます。これを Edge 上で行うことによってビルド時間の短縮につながります。さらに CDN Edge の場合、計算結果をキャッシュできるため、事前に Build した場合と比べて 2 回目以降のリクエストの処理スピードはそこまで変わらないはずです。

## Cloudflare Workers とは

簡単に言えば CDN Edge で JavaScript などの独自の処理を書くことができるプラットフォームです。  
インターフェースは Service Worker に似ています。

Edge 上で JavaScript のような言語を動かせることで、地理的に近いところから任意の処理を実行できます。  
これにより、通信時間が削減されたり、自動的に負荷が分散されるのでパフォーマンスが非常に良いのが特徴です。

詳しい解説はいろいろなところに乗っているのでここではしません。詳しく知りたい方は以下の記事を参照してみてください。

- [Cloudflare Workers それは Frontend / Node.js が CDN Edge Side まで拡張されるもの](https://mizchi.dev/202009122126-cloudflare-workers)
- [Cloudflare Workers を軽く使ってみてこれがサーバーレス（ラムダ/FaaS）のスタンダードになってほしいなと思った](https://scrapbox.io/nwtgck/Cloudflare_Workers%E3%82%92%E8%BB%BD%E3%81%8F%E4%BD%BF%E3%81%A3%E3%81%A6%E3%81%BF%E3%81%A6%E3%81%93%E3%82%8C%E3%81%8C%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%E3%83%AC%E3%82%B9%EF%BC%88%E3%83%A9%E3%83%A0%E3%83%80%2FFaaS%EF%BC%89%E3%81%AE%E3%82%B9%E3%82%BF%E3%83%B3%E3%83%80%E3%83%BC%E3%83%89%E3%81%AB%E3%81%AA%E3%81%A3%E3%81%A6%E3%81%BB%E3%81%97%E3%81%84%E3%81%AA%E3%81%A8%E6%80%9D%E3%81%A3%E3%81%9F)

## 料金について

[Cloudflare Workers の料金](https://www.cloudflare.com/ja-jp/plans/developer-platform/#overview)を見るとかなり安いことがわかります。

主要なものだけ取り上げています。 Free Plan では以下の制限で使用できます。

- 1 日あたり 10 万件のリクエストを含む
- リクエストあたりの CPU 時間：10 ミリ秒以内(リクエストなどの非同期処理は含まない)
- 最小遅延は最初のリクエスト後
- script size: 1 MB

詳細は[公式ドキュメント](https://developers.cloudflare.com/workers/platform/limits#account-plan-limits)を確認してください。

## セットアップ

セットアップ周りは [wrangler](https://github.com/cloudflare/wrangler) という Cloudflare が作っている CLI がやってくれるので難しくないのです。

一点詰まった点としては、 `wrangler.toml` の `account_id` がセンシティブなものなのか分からず戸惑ってしまいました。  
[こちらの issue](https://github.com/cloudflare/wrangler-action/issues/17) にある通り、 `account_id` は公開されても問題ない ID のようでした。

そのほかの部分の詳細については[公式ドキュメント](https://developers.cloudflare.com/workers/)を参照してください。

## OG 画像を生成してみる

### 前提

Cloudflare Workers 上で OG 画像を生成するにあたり [og_image_writer](https://github.com/keiya01/og_image_writer) という自作のライブラリを使用してみます。これを使うことで改行処理や背景画像を設定したりできます。

### 要件

OG 画像を生成するには以下の要件が必要です。

1. wasm module を取得する
2. font を取得する
3. OG 画像を生成しレスポンスを返す

### 方法

順を追って上の条件を満たすように実装を進めてみます。

**1. wasm modules を取得する**

wasm を使用するには、 webpack で wasm をバンドルに含めてしまうか、 `wrangler.toml` に wasm_modules を指定する方法があります。

[wrangler](https://github.com/cloudflare/wrangler) は Cloudflare Workers が用意してくれている CLI です。

今回は wasm modules に wasm ファイルを指定する方法で利用します。  
wasm modules を利用するには `wrangler.toml` で wasm_modules に wasm ファイルのパスを指定します。

```toml
wasm_modules = { OG_IMAGE_WRITER_WASM = "./node_modules/og_image_writer/wasm_bg.wasm" }
```

`og_image_writer` では `init`関数という wasm_modules をロードする関数を用意されています。この関数に `OG_IMAGE_WRITER_WASM` を渡して wasm を読み込みます。

```js
await init(OG_IMAGE_WRITER_WASM);
```

**2. font を取得する**

font は外部のホストから `fetch` を使って取得します。

```ts
const font = await fetch(`https://example.com/font.ttf`)
  .then((res) => res.arrayBuffer())
  .then((buf) => new Uint8Array(buf));
```

`og_image_writer` には font を `Uint8Array` として渡さなければならないので `Uint8Array` に変換します。

**3. OG 画像を生成する**

次に OG 画像を生成します。

まずは簡単に `og_image_writer` の仕組みを説明します。

`og_image_writer` には 5 つの要素があります。

1. window ... 基礎となる画像で、この window の上に text や image が描画されます。
2. text ... 文字を描画するために使われます。
3. textarea ... 文字を描画するために使われます。text と違う点としては、文字を小さな単位に区切って個別にスタイルを当てることができます。
4. image ... 画像を描画するために使われます。
5. container ... window を window 画像の上に描画するための要素です。window を 1 つの box として扱うことができます。

今回は window と text を使います。

まずは window を作成します。window を作成するには `OGImageWriter.new()` を使用します。  
また、window のスタイルを定義するために `WindowStyle` を使用します。  
`WindowStyle`で扱えるプロパティについては[ドキュメント](https://www.npmjs.com/package/og_image_writer#window-style)を参照してください

```ts
const h = 630;
const w = 1200;

const windowStyle = WindowStyle.new();
windowStyle.height = h;
windowStyle.width = w;
windowStyle.background_color = Rgba.new(0, 0, 0, 255);
windowStyle.align_items = AlignItems.Center;
windowStyle.justify_content = JustifyContent.Center;
const window = OGImageWriter.new(windowStyle);
```

次に font を設定します。グローバルで共通な font 設定するために`FontContext`を使用します。  
`FontContext`に値を push すると window 全体で値が共有されるようになります。

clear したい場合は`FontContext.clear()`を使用します。

グローバルな font を設定せず直接 text や textarea 要素に font を指定することもできます。  
注意点としては文字列を画像に描画したい場合、font がないとエラーになります。

```ts
const font = await fetch(`https://example.com/font.ttf`)
  .then((res) => res.arrayBuffer())
  .then((buf) => new Uint8Array(buf));

const fontContext = FontContext.new();
fontContext.push(mplus1);
```

次に text 要素を描画してみます。text 要素を描画するには `window.set_text()` 関数を使います。  
また、text の要素のスタイルを定義するために`Style`を使用します。

`Style`で扱えるプロパティは[ドキュメント](https://www.npmjs.com/package/og_image_writer#style)を参照してください。

```ts
const titleStyle = Style.new();
titleStyle.font_size = 100;
titleStyle.color = Rgba.new(255, 255, 255, 255);
titleStyle.margin = Margin.new(0, 20, 0, 20);
titleStyle.max_height = h * 0.5;
titleStyle.word_break = WordBreak.BreakAll;
titleStyle.text_overflow = "...";
titleStyle.line_height = 2;
window.set_text("Hello OG Image", titleStyle);
```

最後に画像の端に著者名をつけてみます。

著者名はグローバルの font とは異なる font を使用したいので `window.set_text()` の第 3 引数に指定します。

```ts
const usernameStyle = Style.new();
usernameStyle.font_size = 70;
usernameStyle.color = Rgba.new(255, 255, 255, 255);
usernameStyle.position = Position.Absolute;
usernameStyle.bottom = 50;
usernameStyle.right = 50;

const otherFont = await fetch(`https://example.com/other.ttf`)
  .then((res) => res.arrayBuffer())
  .then((buf) => new Uint8Array(buf));
window.set_text("author", usernameStyle, otherFont);
```

これらを描画するために`window.paint()`を使用します。  
これを実行しない場合、画像には何も描画されません。

```ts
window.paint();
```

最後に画像からデータを取り出してレスポンスとして返します。  
データを取得するには`encode`を使用します。

```ts
const data = window.encode(
  ImageOutputFormat.Jpeg,
  ImageOutputFormatOption.new()
);
return new Response(data, {
  headers: {
    "content-type": `image/jpeg`,
  },
});
```

これで下のような OG 画像が返ってくるはずです。

::: picture size=883x252 description="Lighthouse のスコアが全て 100 点" src="/public/contents/entry/image-processing-in-workers/ogp.jpeg" :::

## まとめ

初めて Cloudflare Workers を使ってみましたが簡単に利用できました。  
開発環境も考慮されており、ローカルで開発できるように工夫されているので体験もよかったです。

ぜひ試してみてください。

**余談**  
実は OG 画像の生成以外にも Squoosh を動かそうとしてみたのですが、まだ対応しておらず実装できませんでした。
[この issue](https://github.com/GoogleChromeLabs/squoosh/issues/1084) が解決すれば使えるようになるかもしれません。
