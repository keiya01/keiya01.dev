---
layout: blog/entry
title: TauriのIPC戦略
description: TauriのIPC実装に関するメモです。
date: 2022-11-29
modified: 2022-11-29
tags:
  - gui
  - tauri
entryId: ipc-strategy-of-tauri
---

## What is Tauri

[Tauri](https://github.com/tauri-apps/tauri)は Web フロントエンドの技術で GUI を作れるフレームワークです。

似た技術としては[Electron](https://github.com/electron/electron)があります。

大きな違いとしては Electron はレンダリングエンジンに Chromium を使っているのに対して、Tauri では各 OS の Webview を使用しています。
これによりバンドルサイズの削減やレンダリングエンジンとアプリケーションを切り離して考えることができます。

## What is IPC

IPC とはプロセス間通信のことです。異なるプロセスで動作するプログラム間の通信に使用されます。  
Tauri や Electron では Renderer process と Application process 間で通信するために使われます。

## コードを読んでいく

### クライアント

まずはクライアントで HTTP request を送信するコードを見てみます。

```ts
import { getClient, Body, ResponseType } from "@tauri-apps/api/http";

const client = await getClient();

client.request({
  url: "http://localhost:8080",
  method: "GET",
});
```

Tauri ではセキュリティの観点から I/O を伴う API を opt-in しなければ使えないようになっています。
そのため I/O などの OS 依存の処理はブラウザの API は使わずに Tauri から提供される API を使用します。

上記のコードでは`getClient`から受け取って`client`を通して`request`を飛ばしています。
この`request`は Renderer process で実行されますが、OS の処理を伴うためバックエンドで実行する必要があります。
そのため IPC を通してバックエンドにメッセージを飛ばしてバックエンド側で実際の HTTP リクエストを発行しています。

`createClient`の場合、IPC では`__TAURI_IPC__`を通して以下のようなオブジェクトが送られます。

```js
const _ = {
  cmd: {
    __tauriModule: "Http",
    message: { cmd: "createClient" /* .... */ },
  },
  callback: { ランダムに生成されたcallbackのID },
  error: { ランダムに生成されたcallbackのID },
};
```

`__TAURI_IPC__`の内部では`window.ipc`が呼び出されています。`ipc`プロパティは Wry 側で以下のように定義されています(macOS の wkwebview の場合)。

```js
Object.defineProperty(window, "ipc", {
  value: Object.freeze({
    postMessage: function (s) {
      window.webkit.messageHandlers.ipc.postMessage(s);
    },
  }),
});
```

### バックエンド

次にバックエンドのコードを見てみます。

IPC の受け取り側は Wry で定義されています。`WebViewBuilder::with_ipc_handler`という関数に`ipc_handler`を渡すと IPC を受け取るたびに呼びだされます。

次に`ipc_handler`の作成についてみていきます。

エントリーポイントである`Builder::build`を実行すると、この関数の内部で Window マネージャーや IPC 関連の処理を準備する[`prepare_window`](https://github.com/tauri-apps/tauri/blob/9b1a6a1c02b8d62dd47d9ce42aa05723d7c1b892/core/tauri/src/manager.rs#L1115)という関数が呼ばれます。

この関数の内部では以下のようなコードが呼ばれており、ここで`ipc_handler`のセットアップがなされます。

```rust
pending.ipc_handler = Some(self.prepare_ipc_handler(app_handle));
```

この関数の内部では IPC メッセージを受け取ったときに実行されるコールバック関数を定義しています。

```rust
fn prepare_ipc_handler(
  &self,
  app_handle: AppHandle<R>,
) -> WebviewIpcHandler<EventLoopMessage, R> {
  // ...
  Box::new(move |window, #[allow(unused_mut)] mut request| {
    // ...

    match serde_json::from_str::<InvokePayload>(&request) {
      Ok(message) => {
        let _ = window.on_message(message);
      }
      Err(e) => {
        let error: crate::Error = e.into();
        let _ = window.eval(&format!(
          r#"console.error({})"#,
          JsonValue::String(error.to_string())
        ));
      }
    }
  })
}
```

コールバック関数の引数から受け取る request は JSON 文字列として送られてくるのでそれを[`serde_json`](https://github.com/serde-rs/json)でパースして`InvokePayload`構造体に割り当てます。

パースが成功すると`Window::on_message`に message が送られます。

```rust
pub fn on_message(self, payload: InvokePayload) -> crate::Result<()> {
  let manager = self.manager.clone();
  match payload.cmd.as_str() {
    "__initialized" => {
      // ...
    }
    _ => {
      let message = InvokeMessage::new(
        self.clone(),
        manager.state(),
        payload.cmd.to_string(),
        payload.inner,
      );
      let resolver = InvokeResolver::new(self, payload.callback, payload.error);

      let invoke = Invoke { message, resolver };
      if let Some(module) = &payload.tauri_module {
        crate::endpoints::handle(
          module.to_string(),
          invoke,
          manager.config(),
          manager.package_info(),
        );
      } // ...

      // ...
    }
  }

  Ok(())
}
```

上記のコードを見ると`payload.tauri_module`が存在する場合に`crate::endpoints::handle`が呼び出されています。
`crate::endpoints::handle`は以下のようなコードになっています。

```rust
fn handle<R: Runtime>(
  module: String,
  invoke: Invoke<R>,
  config: Arc<Config>,
  package_info: &PackageInfo,
) {
  let Invoke { message, resolver } = invoke;
  let InvokeMessage {
    mut payload,
    window,
    ..
  } = message;

  if let JsonValue::Object(ref mut obj) = payload {
    obj.insert("module".to_string(), JsonValue::String(module.clone()));
  }

  match serde_json::from_value::<Module>(payload) {
    Ok(module) => module.run(window, resolver, config, package_info.clone()),
    Err(e) => {
      // ...
    }
  }
}
```

ここでは`payload`を`Module`という enum に変換した後、`module.run`を呼び出しています。  
ここでの`payload`は先ほどの関数の payload とは違います。  
IPC から受け取る`InvokePayload`は以下のような構造体になっており、Tauri の処理で必要な値とユーザーからの値を分けています。

```rust
pub struct InvokePayload {
  // === Tauriの処理に必要な値 ===
  /// The invoke command.
  pub cmd: String,
  #[serde(rename = "__tauriModule")]
  #[doc(hidden)]
  pub tauri_module: Option<String>,
  /// The success callback.
  pub callback: CallbackFn,
  /// The error callback.
  pub error: CallbackFn,

  // === ユーザーから指定される値 ===
  /// The payload of the message.
  #[serde(flatten)]
  pub inner: JsonValue,
}
```

`crate::endpoints::handle`で`InvokeMessage`から受け取っている`payload`には`InvokePayload`の`inner`プロパティが渡されています。

次に`module.run`を見ていきます。

ここで使われる`module`は enum であり以下のように定義されています。

```rust
enum Module {
  App(app::Cmd),
  #[cfg(process_any)]
  Process(process::Cmd),
  #[cfg(fs_any)]
  Fs(file_system::Cmd),
  #[cfg(os_any)]
  Os(operating_system::Cmd),
  #[cfg(path_any)]
  Path(path::Cmd),
  Window(Box<window::Cmd>),
  #[cfg(shell_any)]
  Shell(shell::Cmd),
  Event(event::Cmd),
  #[cfg(dialog_any)]
  Dialog(dialog::Cmd),
  #[cfg(cli)]
  Cli(cli::Cmd),
  Notification(notification::Cmd),
  #[cfg(http_any)]
  Http(http::Cmd),
  #[cfg(global_shortcut_any)]
  GlobalShortcut(global_shortcut::Cmd),
  #[cfg(clipboard_any)]
  Clipboard(clipboard::Cmd),
}
```

これらの値を`module.run`の中で判定してそれぞれのコマンドに応じた処理を行います。

```rust
fn run<R: Runtime>(
  self,
  window: Window<R>,
  resolver: InvokeResolver<R>,
  config: Arc<Config>,
  package_info: PackageInfo,
) {
  let context = InvokeContext {
    window,
    config,
    package_info,
  };
  match self {
    Self::App(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(process_any)]
    Self::Process(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(fs_any)]
    Self::Fs(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(path_any)]
    Self::Path(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(os_any)]
    Self::Os(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    Self::Window(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .await
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(shell_any)]
    Self::Shell(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    Self::Event(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(dialog_any)]
    Self::Dialog(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(cli)]
    Self::Cli(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    Self::Notification(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(http_any)]
    Self::Http(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .await
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(global_shortcut_any)]
    Self::GlobalShortcut(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
    #[cfg(clipboard_any)]
    Self::Clipboard(cmd) => resolver.respond_async(async move {
      cmd
        .run(context)
        .and_then(|r| r.json)
        .map_err(InvokeError::from_anyhow)
    }),
  }
}
```

最初の例で確認した HTTP の処理は以下の行です。

```rust
#[cfg(http_any)]
Self::Http(cmd) => resolver.respond_async(async move {
  cmd
    .run(context)
    .await
    .and_then(|r| r.json)
    .map_err(InvokeError::from_anyhow)
}),
```

ここでは`cmd.run`が呼ばれており、これが実際に HTTP 関連の処理を実行する関数です。
cmd の定義は以下のような enum になっており、`CommandModule` derive macro によって`run`関数が生成されています。

```rust
/// The API descriptor.
#[command_enum]
#[derive(Deserialize, CommandModule)]
#[cmd(async)]
#[serde(tag = "cmd", rename_all = "camelCase")]
pub enum Cmd {
  /// Create a new HTTP client.
  #[cmd(http_request, "http > request")]
  CreateClient { options: Option<ClientBuilder> },
  /// Drop a HTTP client.
  #[cmd(http_request, "http > request")]
  DropClient { client: ClientId },
  /// The HTTP request API.
  #[cmd(http_request, "http > request")]
  HttpRequest {
    client: ClientId,
    options: Box<HttpRequestBuilder>,
  },
}
```

`run`関数は macro で生成されているため macro の一部のみを載せます。実際のコードは[`core/tauri_macros/src/command_modules.rs`の`generate_run_fn`](https://github.com/tauri-apps/tauri/blob/2d545eff58734ec70f23f11a429d35435cdf090e/core/tauri-macros/src/command_module.rs#L91)にあります。

```rust
matcher = TokenStream2::new();
for variant in &data_enum.variants {
  // ...

  matcher.extend(quote_spanned! {
    variant.span() => #maybe_feature_check #name::#variant_name #fields_in_variant => #name::#variant_execute_function_name(context, #variables)#maybe_await.map(Into::into),
  });

  // ...
}
```

上記のコードでは`proc_macro`を使用して enum をパースし、各 variants へ対応する match 式のアーム(?)を matcher にアサインしています。  
`variant_execute_function_name`は enum の variants を lowercase&snake_case に変更したもの文字列が入っています。  
これにより例えば、`CreateClient`variant は`create_client`のようになり、対応する関数を呼び出せるようにしています。  
さらに最後の`Into::into`で`serde_json`によって JavaScript に渡せるように整形しています。

`Cmd` enum に対応する`impl`は以下のようになっており、enum の variant に対応した関数が定義されています。

```rust
impl Cmd {
  #[module_command_handler(http_request)]
  async fn create_client<R: Runtime>(
    _context: InvokeContext<R>,
    options: Option<ClientBuilder>,
  ) -> super::Result<ClientId> {
    // ...
  }

  #[module_command_handler(http_request)]
  async fn drop_client<R: Runtime>(
    _context: InvokeContext<R>,
    client: ClientId,
  ) -> super::Result<()> {
    // ...
  }

  #[module_command_handler(http_request)]
  async fn http_request<R: Runtime>(
    context: InvokeContext<R>,
    client_id: ClientId,
    options: Box<HttpRequestBuilder>,
  ) -> super::Result<ResponseData> {
    // ...
  }
}
```

一連の処理が終わると`resolver.respond_async`の内部で`window.invoke_responder()`が呼ばれます。

`invoke_responder`には`Arc::new(window_invoke_responder)`が渡されています。

`window_invoke_responder`は以下のような定義になっています。

```rust
pub fn window_invoke_responder<R: Runtime>(
  window: Window<R>,
  response: InvokeResponse,
  success_callback: CallbackFn,
  error_callback: CallbackFn,
) {
  let callback_string =
    match format_callback_result(response.into_result(), success_callback, error_callback) {
      Ok(callback_string) => callback_string,
      Err(e) => format_callback(error_callback, &e.to_string())
        .expect("unable to serialize response string to json"),
    };

  let _ = window.eval(&callback_string);
}
```

ここで引数から受け取っている`response`, `success_callback`, `error_callback`は JavaScript から受け取った値であり、文字列として値を保持しています。  
`format_callback_result`では`response`をそれぞれの callback に渡すように文字列を整形します。
さらに`window.eval`へ値を渡すことで webview でそれぞれの JavaScript のコードを実行しています。

`format_callback_result`は以下のようなコードになっています。

```rust
pub fn format_callback_result<T: Serialize, E: Serialize>(
  result: Result<T, E>,
  success_callback: CallbackFn,
  error_callback: CallbackFn,
) -> crate::api::Result<String> {
  match result {
    Ok(res) => format_callback(success_callback, &res),
    Err(err) => format_callback(error_callback, &err),
  }
}
```

さらに`format_callback`のコードは以下のようになっています。

```rust
pub fn format_callback<T: Serialize>(
  function_name: CallbackFn,
  arg: &T,
) -> crate::api::Result<String> {
  serialize_js_with(arg, Default::default(), |arg| {
    format!(
      r#"
    if (window["_{fn}"]) {{
      window["_{fn}"]({arg})
    }} else {{
      console.warn("[TAURI] Couldn't find callback id {fn} in window. This happens when the app is reloaded while Rust is running an asynchronous operation.")
    }}"#,
      fn = function_name.0,
      arg = arg
    )
  })
}
```

ここで callback には名前がついていることがわかります。
Tauri では callback それぞれに uid で名前を付与して window に値を保存しています。

```ts
function uid(): number {
  window.crypto.getRandomValues(new Uint32Array(1))[0];
}
```

最後に`window.eval`では内部で`eval_script`という関数が呼ばれています。この関数の中では`Message::Webview`というカスタムイベントが Window のイベントループに送られます。

```rust
fn eval_script<S: Into<String>>(&self, script: S) -> Result<()> {
  send_user_message(
    &self.context,
    Message::Webview(
      self.window_id,
      WebviewMessage::EvaluateScript(script.into()),
    ),
  )
}
```

イベントループの中では以下のような match 式が定義されており、`Message::Webview`イベントをハンドリングしています。

```rust
Message::Webview(id, webview_message) => match webview_message {
  // ...
  WebviewMessage::EvaluateScript(script) => {
    if let Some(WindowHandle::Webview { inner: webview, .. }) =
      windows.borrow().get(&id).and_then(|w| w.inner.as_ref())
    {
      if let Err(e) = webview.evaluate_script(&script) {
        debug_eprintln!("{}", e);
      }
    }
  }
  // ...
}
```

`WebviewMessage::EvaluateScript(script)`の中で`webview.evaluate_script(&script)`が呼ばれています。これが実際に Webview で JavaScript を eval する処理になります。

実際の eval のコードは以下のように実行されています。  
macOS のユーザーなので macOS のコードを載せますが実際には各 OS ごとの Webview で eval するコードが記述されています。  
Tauri の webview を抽象化しているライブラリは Wry というライブラリです。macOS では objc という Rust で Objective-C を書けるライブラリを使用しています。

```rust
let _: id = msg_send![self.webview, evaluateJavaScript:NSString::new(js) completionHandler:null::<*const c_void>()];
```

これで一連の流れを確認できました。
流れをまとめると以下のようなフローになります。

1. Client から IPC メッセージを送る
2. Webview(Wry)から IPC メッセージを受け取る
3. Tauri でメッセージの`cmd`を確認し、それぞれのコマンドを実行する
4. Webview で JavaScript の eval を通して実行結果を返却
5. Client で callback から結果を受け取る
