---
layout: blog/entry
title: クロスプラットフォームなアプリケーションの裏の技術
description: 最近クロスプラットフォームなGUIに入門したのでその辺話をまとめます。
date: 2022-11-11
modified: 2022-11-11
tags:
  - GUI
  - cross-platform
entryId: underground-of-crossplatform
---

## 始めに

最近クロスプラットフォームな GUI 開発に入門したのでまとめてみます。
[winit](https://github.com/rust-windowing/winit) などの Rust 周辺のコードを見つつまとめるので若干偏りがあるかも知れません。

## クロスプラットフォームとは

どこでも動くアプリケーションを指します。
どこでもというと範囲が広いですが、複数の OS をサポートしていればクロスプラットフォームと言えそうです。

## 裏の技術とは

OpenGL や Window マネジメント周りの話をまとめます。

## OpenGL

描画エンジンです。正確には各 OS が共通のインターフェースで描画エンジンを実装できるように定義した仕様です。

OpenGL には以下のような派生規格があります。

- WebGL ... 主にブラウザで使用するために作られた規格
- OpenGL|ES(GLES) ... 主にモバイルなどの組み込みシステムのために作られた規格

OpenGL のややこしい部分は OpenGL の上に定義される抽象化されたインターフェースを通して使うことになるところです。

主に以下のような拡張があります。

- EGL ... Android や Wayland などで使われます
- CGL ... 主に OSX で使用されます
- GLX ... 主に x11 で使用されます
- WGL ... 主に Windows で使用されます

クロスプラットフォームな開発ではこれらのインタフェースを OS ごとに切り替えて使用します。

Rust で書かれた OpenGL のコンテキストを管理するライブラリである[glutin では、以下のように各インターフェースを切り替えています](https://github.com/rust-windowing/glutin/blob/79935ed18530fcc74cd2d0947e6c907d94beadfc/glutin_examples/src/lib.rs#L272-L297)。

```rust
pub fn create_display(
    raw_display: RawDisplayHandle,
    raw_window_handle: Option<RawWindowHandle>,
) -> Display {
    #[cfg(egl_backend)]
    let preference = DisplayApiPreference::Egl;

    #[cfg(glx_backend)]
    let preference = DisplayApiPreference::Glx(Box::new(unix::register_xlib_error_hook));

    #[cfg(cgl_backend)]
    let preference = DisplayApiPreference::Cgl;

    #[cfg(wgl_backend)]
    let preference = DisplayApiPreference::Wgl(Some(raw_window_handle.unwrap()));

    #[cfg(all(egl_backend, wgl_backend))]
    let preference = DisplayApiPreference::WglThenEgl(Some(raw_window_handle.unwrap()));

    #[cfg(all(egl_backend, glx_backend))]
    let preference = DisplayApiPreference::GlxThenEgl(Box::new(unix::register_xlib_error_hook));

    // Create connection to underlying OpenGL client Api.
    unsafe { Display::new(raw_display, preference).unwrap() }
}
```

## Window マネジメント

OpenGL で描画した矩形はイベントなどそのまま受け取れないのでディスプレイサーバーから受け取る必要があります。
またディスプレイサーバーも OS ごとにハンドリングする必要があります。

winit では各 OS からのイベントを以下のように管理しています。

- Linux ... wayland/x11 どちらかの対応しているディスプレイサーバーを通してイベント受け取ります
  - x11 には [x11-rs](https://github.com/AltF02/x11-rs) が使われています
  - wayland には[sctk](https://github.com/smithay/client-toolkit)が使われています
- macOS/iOS ... objective-c から NSApplication を通して Window のイベントをハンドリングしています
  - [objc2](https://github.com/madsmtm/objc2) が使われています
- Windows ... windows API を通して Window のイベントをハンドリングしています
  - [windows-rs](https://github.com/microsoft/windows-rs) が使われています 1
- Android ... NDK を用いてイベントをハンドリングしています
  - [android-activity](https://github.com/rib/android-activity) が使われています

Window マネージャーから受け取ったイベントを OpenGL の位置情報と照らし合わせることである要素に対する click イベントを実現できます。