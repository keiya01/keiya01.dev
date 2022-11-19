---
layout: blog/entry
title: How the egui works
description: I researched how the egui works.
date: 2022-11-19
modified: 2022-11-19
tags:
  - layout engine
  - gui
  - egui
entryId: how-egui-works
---

## What is this?

I will read the code of [egui](https://github.com/emilk/egui), and I will describe how it works.
The egui is GUI library for Rust.

This is created with almost full scratch. This is great and this is useful for understanding how the GUI works.

After understanding code, I will try to implement simple version of egui in Rust.
If you interest for creating the GUI library, let's try it.

## Overview of how the GUI work

The GUI like browser works like the following.

1. Construct the UI tree consists of user input(e.g. HTML/CSS)
2. Construct the layout tree
3. Construct the paint tree
4. Defines the layer order
5. Paint

In real world, the following type of framework is used as the GUI as far as I know.(I wonder if we can call these a "framework"...)

- [Chrome](https://www.google.com/chrome/)(browser) ... Parse HTML/CSS/JavaScript then create the DOM and style tree, then construct the layout tree and paint.
- egui ... Construct layout tree in Rust, and paint.
- [Tauri](https://github.com/tauri-apps/tauri) ... Pass HTML/CSS/JavaScript to the webview and the webview draw the rect.

In egui works with [immediate mode](https://github.com/emilk/egui#why-immediate-mode).
The GUI has two strategy like the following.

- Immediate mode
- Retained mode

The immediate mode construct layout every frame.
On the other hand, the retained mode construct layout when the stored layout get changed.

See more detail of immediate mode in [the documentation of egui](https://github.com/emilk/egui#why-immediate-mode).

## Read the example of the egui

First, we need to known how the egui works.
So let's try to see example in the egui.

I tried to run [hello_world example](https://github.com/emilk/egui/tree/master/examples/hello_world). This is so simple example.

The entry point is the bellow in example.

```rust
fn main() {
    let options = eframe::NativeOptions::default();
    eframe::run_native(
        "My egui App",
        options,
        Box::new(|_cc| Box::new(MyApp::default())),
    );
}
```

`eframe::run_native` is method for running `MyApp` on native window.
The egui can run app on everywhere like native, browser.

`eframe::run_native` also has role for painting the constructed UI.
We will see `eframe::run_native` later.

And scrolling down, then the `MyApp` struct is defined.

```rust
struct MyApp {
    name: String,
    age: u32,
}

// ...

impl eframe::App for MyApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("My egui Application");
            ui.horizontal(|ui| {
                ui.label("Your name: ");
                ui.text_edit_singleline(&mut self.name);
            });
            ui.add(egui::Slider::new(&mut self.age, 0..=120).text("age"));
            if ui.button("Click each year").clicked() {
                self.age += 1;
            }
            ui.label(format!("Hello '{}', age {}", self.name, self.age));
        });
    }
}
```

This code define the implementation of `MyApp` for satisfying `eframe::App`.
The `MyApp::update` method is called each time that the UI needs repainting.

In `MyApp::update` method, `egui::CentralPanel::default().show()` method is called.
The egui has some `Panel` that includes `egui::CentralPanel`.
the following `Panel` is defined.

- `CentralPanel`
- `SidePanel`
- `TopBottomPanel`

You can see [the documentation about panel](https://docs.rs/egui/latest/egui/containers/panel/index.html) for more detail, but the `CentralPanel` must to be used in app. And these panels indicate region of UI. The `CentralPanel` indicates main column.

The `egui::CentralPanel::default().show()` defines the following element.

- Define panel's layer
- Compute layout
- Prepare painting

And App paint the UI after processing the above steps in `eframe::run_native`.

## Read the detail of the code.

### Layout

We could learn the overview of the egui works, so we can dive into the code more deeply.

First, I will read the detail of `egui::CentralPanel::default().show()` method.

The `show` method is defined in [`/crates/egui/src/containers/panel.rs`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/panel.rs#L678-L684).
This method calls `show_dyn` internally which is defined in [the same file](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/panel.rs#L687-L706).
This method perform the following processes.

- Calculate available rect of background layer.
- Set layer order as background
  - Layer order is define in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/layers.rs#L10-L30).
- Set id for UI.
- Decide the region of this panel.
  - This is relative position to previous element.
- Invoke `self.show_inside_dyn` method.
- Call `ctx.frame_state().allocate_central_panel(inner_response.response.rect);`.

The [`self.show_inside_dyn`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/panel.rs#L660) method construct UI in the following steps.

- Calculate available rect from cursor. The cursor indicates current rect in frame(window) in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/panel.rs#L191).
- Invoke `frame.show()` method.

The `frame.show()` method is defined in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/frame.rs#L197).
In this method, finally UI's layout is calculated in [`frame.show_dyn()`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/frame.rs#L201) method which is called inside `frame.show()` method.

In `self.begin()` method which is called in `frame.show()`, this calculating layout of panel like margin.
And `add_contents()` closure is called to calculate UI layout. This was passed from `App::update()` method that is entry point to render UI. I will describe the detail of `add_contents()` later.

Finally `self.end()` method is called. This method perform the following things.

- Calculate background rect by calling [`self.paint_rect()`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/frame.rs#L240).
  - This calculate how range should be painted.
  - This expand rect includes `frame.inner_margin`(This is the padding of browser.).
  - Invoke `frame.paint()` method to define shape of rect which is defined in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/containers/frame.rs#L212).
  - Call [`self.allocate_rect()`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/ui.rs#L771) to move `cursor` and handle interaction like hover.
    - Expand `cursor` includes frame rect and spacer by invoking [`self.advance_cursor_after_rect()`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/ui.rs#L776) method.
    - Check frame rect is hovered in [`self.interact_with_hovered`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/context.rs#L321).

We could know the overall of the layout, so let's we discuss the detail of `add_contents()` that we just skipped.

Fist, here we see the [`ui.horizontal()`](https://github.com/emilk/egui/blob/f7a15a34f9bd17f39ae75c488b722873465c8d86/examples/hello_world/src/main.rs#L32) method which is defined in the `add_contents()`.
`ui.horizontal()` is defined [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/ui.rs#L1817). And `self.horizontal_with_main_wrap_dyn()` method is called, this is defined [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/ui.rs#L1873).
In here, layout process is similar to the frame layout process we just discussed, but layout direction is defined `right-to-left` or `left-to-right`.

Next, let's see the [`ui.label()`](https://github.com/emilk/egui/blob/f7a15a34f9bd17f39ae75c488b722873465c8d86/examples/hello_world/src/main.rs#L33) which is called in closure passed to `ui.horizontal()`.
The `ui.label()` is defined in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/ui.rs#L1212), call `Label::ui()` method which is defined in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/widgets/label.rs#L159).
In `Label::ui` method, [`Label::layout_in_ui`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/widgets/label.rs#L70) is called. This processes the following things.

- Check if widget is galley, if so, then skipping the text layout process.
  - Galley means text which has already been calculated the layout process.
- Construct [`text_job`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/widgets/label.rs#L87-L89).
  - `text_job` is consist of font layout and text style by calling [`into_text_job`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/widget_text.rs#L245).
  - [Default text style is defined in here.](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/style.rs#L604-L615)
- Wrap the rect or text in [here](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/widgets/label.rs#L94-L154).
  - If all of rect should be wrapped, first condition is used.
  - In other cases, else condition is used.
  - By calling [`text_job.into_galley()`](https://github.com/emilk/egui/blob/f4d2aa5b4a7b221bb310d8f956694026ea8610c1/crates/egui/src/widgets/label.rs#L146), text is layed out and cached.
  - Let me describe about text layout later.

Finally, painter for `Label` is prepared. That is, the layout of `Label` is finished.

Let me skip describing about `ui.text_edit_singleline(&mut self.name);` in `ui.horizontal()`, because this is little complex.

BTW how do events work like click? Let me describe these work.
Event is handled by window manager like [winit](https://github.com/rust-windowing/winit).
The `winit` handle some event through OS specific function. For example, in macOS, the winit is using the Rust binding for objective-c to handle macOS event by observing event which is sent from [`NSApplication`](https://developer.apple.com/documentation/appkit/nsapplication?language=objc).
When the UI receive the event from the window manager then the UI changes the state that context has, then the UI is repainted. In this time, for example, if click event is received from the window manager, click event has a clicked position on the window but the UI don't know which widget is clicked, so in UI painter calculate whether click position is within rect of widget.
In egui, the `App::update` is called when event is sent, and the UI's state is changed, for example `UI.button().clicked()` will be `true`.

### Paint

Next, we will discuss about the painting flow. In the egui, [`eframe::run_native()`](https://github.com/keiya01/egui/blob/7b8c17042c56726facd01fbf2735a67341a34470/examples/hello_world/src/main.rs#L7) method is used for painting for native app.
`eframe::run_native()` is defined in [here](https://github.com/emilk/egui/blob/76d0cf50349d1e5e70b86a3e9678fe6b8ad3e0d7/crates/eframe/src/lib.rs#L168), this will select the painter.
In the egui, the following painters are used for each target.

- [glow](https://github.com/grovesNL/glow) ... This is used as painting backend. This works everywhere as wasm.
- [wgpu](https://github.com/gfx-rs/wgpu) ... This is used as painting backend and added for compatibility described in [Add egui_wgpu crate](https://github.com/emilk/egui/pull/1564). This works everywhere as wasm.
- [glium](https://github.com/glium/glium) ... Previously, the glium is used for painter backend, but currently, this is remained for compatibility. ([Replace Glium issue](https://github.com/emilk/egui/issues/93))

In this article, we will read the code of the glow [defined in here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/lib.rs#L172-L176) for native application.

Let's take a entry point of the glow code. The entry point is defined in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L608).

Read the code, then we can find the event loop is created by [`with_event_loop`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L59). In `with_event_loop`, event loop is created in another thread by using winit.

After creating event loop, event loop is run in [`run_and_return` function](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L77).
In event loop in `run_and_return` function, first [`winit_app.on_event()`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L117) method is called [in here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L117).
The `winit_app` indicates [`GlowWinitApp`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L271) in case using the glow.

In `winit_app.on_event` method, it handle some events, and the `GlowWinitApp` need to setup `self.running` in [self.init_run_state()](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L539) which is defined in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L720).
In this method, the openGL is first prepared by invoking [`Self::create_glutin_windowed_context()`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L358) and [creating](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L366-L368) the [Painter](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui_glow/src/painter.rs#L45).
Second, the [`EpiIntegration`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/epi_integration.rs#L209) is created in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L371-L380).
It is using `EipIntegration` for handling winit, openGL, and more for drawing on window.
Finally, [`self.running` is set](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L411).

If `Event::RequestRedraw` is send from [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L142) in each time depends on `next_repaint_time`, `Event::RequestRedraw` is matched and `winit_app.paint()` is invoked in [this block](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L98-L101).

`winit_app.paint()` for glow is defined in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L444).

In `winit_app.paint()` method, first, it clear display by clear color.

And `integration.update()` method is called. This method is define in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/epi_integration.rs#L301).
In this method, the frame rect is first prepared. `read_window_info()` function get window information from winit window like position and size. Also `self.egui_winit.take_egui_input()` method get [the `RawInput` struct](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/data/input.rs#L15).
The `RawInput` indicates users input like `event`, `modifiers`.

Next, `self.egui_ctx.run` is called in [this line](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/epi_integration.rs#L310), and this method is defined in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L213).

In this method, first, [`begin_frame_mut` method](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L68) is called.
The `begin_frame_mut()` method prepares the following properties in [`ContextImpl` struct](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L33).

- `memory` ... `ContextImpl`'s memory persists like the following values.
  - `event` ... This is state for event like click, drag, cursor move, focus, etc. And memory stores the state which event was fired.
  - `area` ... This indicates the layer order. And interactable area is defined.
  - `fonts` ... This is formal information of font. Calculated font information is cached.
- `input` ... This indicates amount of scroll, amount of zoom, which key is pressed, touch and pointer position. Also it defines framerate by `unstable_dt`, `stable_dt`, `predicted_dt`.
- `frame_state` ... This stores current frame state with `input`.

In `self.egui_ctx.run()` method, additionally, `run_ui()` is called. This construct UI by `App::update()` method which we defined in entry file.

Finally, [`end_frame` method](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L885) is called.
In this method, first, it checks whether repainting is needed by [`self.input().wants_repaint()`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L886). It checks whether pointer is moved or window is scrolled, etc.
Next, [font shaping is calculated](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L890-L907).
Also, [`PlatformOutput`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/data/output.rs#L59) is [generated from `Context::output`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L909).
The `PlatformOutput` is used for platform specific work like the screen reader, copying copied text to clipboard, opening url.
And the final work of the `end_frame` method is to take the paint list. The paint list is stacked in layout process through the `graphics` of `Context`. In the layout process, the UI struct is created in each time. Also [the UI struct has `painter`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/ui.rs#L79), and the painter has `Context` inside this struct. The `graphic` of `Context` has a internal mutability through `Arc` and `RwLock`, so the `graphic` of Context can be constructed through the `painter` of `UI` struct.

Let's go back to the `integration.update()` which we just read. We read up to [`self.egui_ctx.run()`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/epi_integration.rs#L310) inside the `integration.update()`.
Next, [new `full_output` is made be pending](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/epi_integration.rs#L314-L315), and older `full_output` is taken.
Finally, handling some window configuration finished, then older `full_output` is returned.

Well, let's go back to the caller of `integration.update()`. We have read up to [`integration.update()`] method inside `GlowWinitApp::paint()` method.
Next, [`integration.handle_platform_output()` method is called](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L475). This handles the following things.

- [screen reader support](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui-winit/src/lib.rs#L583-L586)
  - In `platform_output.events_description()` method, this generates description which includes event name, widget name, and contained text label for screen reader.
- [set cursor icon](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui-winit/src/lib.rs#L598)
- [open URL with available browser](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui-winit/src/lib.rs#L601)
- [set copied text to clipboard](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui-winit/src/lib.rs#L605)
- [set IME position](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui-winit/src/lib.rs#L609)

Next, [`integration.egui_ctx.tessellate()`](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/eframe/src/native/run.rs#L479) is invoked. This is defined in [here](https://github.com/emilk/egui/blob/8e79a5a8ae32daac964b6e4d073513bb596d5f96/crates/egui/src/context.rs#L951).
This convert [`ClippedShape`](https://github.com/emilk/egui/blob/041f2e64bac778c9095fbf4316dc1f7c7bceb670/crates/epaint/src/lib.rs#L92-L98) into [`ClippedPrimitive`](https://github.com/emilk/egui/blob/041f2e64bac778c9095fbf4316dc1f7c7bceb670/crates/epaint/src/lib.rs#L104-L111). `ClippedShape` is created in the layout phase.
The `tessellation` means construct rect by triangle. `egui` is using `OpenGL`. `OpenGL` is drawing the element by triangle, so it needs to draw the element by using triangle. That is, to draw an element by triangle, tessellation is used.

BTW, egui is using only OpenGL for drawing, and it is not using GPU([see details in here](https://github.com/emilk/egui/issues/1129)).

After tessellating, [`painter.paint_and_update_textures()`](https://github.com/emilk/egui/blob/041f2e64bac778c9095fbf4316dc1f7c7bceb670/crates/eframe/src/native/run.rs#L362) is called. In [`painter.paint_and_update_textures()`](https://github.com/emilk/egui/blob/041f2e64bac778c9095fbf4316dc1f7c7bceb670/crates/egui_glow/src/painter.rs#L316), rect is drawn by [the `draw_elements` method of the OpenGL](https://github.com/emilk/egui/blob/041f2e64bac778c9095fbf4316dc1f7c7bceb670/crates/egui_glow/src/painter.rs#L476). Then [`swap_buffers()`](https://github.com/emilk/egui/blob/041f2e64bac778c9095fbf4316dc1f7c7bceb670/crates/eframe/src/native/run.rs#L373) is called for swapping double buffering.

Finally, the rect is displayed on the window!

## Conclusion

egui is really great project. It is implemented all of features for drawing by full scratch.
But currently egui is not supporting GPU rendering and only supporting OpenGL.
To learn more painting system, I think I will read [the webrender](https://github.com/servo/webrender) or [the skia](https://github.com/google/skia).
