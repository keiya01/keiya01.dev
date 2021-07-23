# Site

## Architecture

```
src
 |--layouts ... レイアウトの基本となるテンプレートを入れる
   |--pages ... page名ごとに区切る
     |--top.ts ... `components/pages/`を呼び出すだけ。ここでpageに必要なグローバルなJSやCSSを読み込む。
     |--home.ts
   |--global.ts ... gobalなHeadやHeader、Footerなど
   |--global.css
   |--index.ts
 |--components ... 各UIのコンポーネントを入れる
   |--blog
     |--ListItem.ts
     |--ListItem.css
   |--pages ... componentのpageごとのエントリーポイント
   |--base
 |--utils ... 共通のロジカルコード
   |--blog
 |--lib ... ここはページごとにバンドルされ、各ページで読み込まれる必要がある
   |--components ... web componentsを格納する。非同期コンテンツを入れる。
     |--blog
     |--github-star.ts
   |--features ... 計測スクリプトなど
     |--blog
     |--webVitals.ts
   |--entries ... ページごとのエントリーポイントを記述し、ここで必要なデータを読み込む
     |--blog
     |--top
 |--assets
   |--css
   |--js
   |--font
   |--img
 |--data ... グローバルなデータを格納する
 |--contents ... 記事を格納する。`.md` には基本的にデータのみを記述する。HTMLは書かない。
   |--blog
     |--post.md
     |--post.ts ... jsでデータを記述する
```
