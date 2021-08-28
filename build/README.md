## メモ

```
build
 |--lib ... ここにロジックをまとめる。`lib/`以外の場所は基本的には`main.rs`で実行するだけ
 |--subResource ... JS/CSS周りのビルドコードを置く
 |--markdown ... Markdownを解析しJSONとして吐き出す
```

`lib`にロジックをまとめて、build のドメインごとに workspace を分割し、`cargo-make`で workspace ごとに実行できるようにする。
