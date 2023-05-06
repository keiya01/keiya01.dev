---
layout: blog/entry
title: Read code of webrender - part 1
description: This is a note that summarize the code I read.
date: 2022-11-24
modified: 2022-11-24
tags:
  - layout engine
  - gui
  - webrender
  - servo
  - Code Reading
entryId: read-code-of-webrender-part-1
---

## What is this?

I will read the code of [webrender](https://github.com/servo/webrender), and I will describe how it works.
webrender is painting engine written in Rust. It is used in Firefox.

In this part, I will read the example code of webrender, and understand the overall of how webrender works.
I will research more detail of implementation in next part.

If you want to learn how the gui works, you can see [How the egui works](https://blog.keiya01.dev/entry/how-egui-works).

## Entry point of example

First, let's read the code of [basic](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/basic.rs) example.

The entry point of basic example is [`main` function](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/basic.rs#L21).

In `main` function, App struct is instantiated, and it's passed to `boilerplate::main_wrapper()` function.

```rust
fn main() {
    let mut app = App {
    };
    boilerplate::main_wrapper(&mut app, None);
}
```

`boilerplate::main_wrapper()` setups window, event loop, OpenGL context and render the display list.
I will see more details about `boilerplate::main_wrapper()` function later.

## Constructing display list

[`App` struct implement `Example` trait](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/basic.rs#L30). The `Example` trait is defined in [/common/boilerplate.rs](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/common/boilerplate.rs#L69). And It is used inside the `boilerplate::main_wrapper()`.

[In `render` method of App struct](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/basic.rs), construct the display list.
The display list is the word used in the Gecko rendering engine.
The display list indicates the way to display the page by the provided layout modules(tree).

```rust
fn render(
  // ...
) {
  // `LayoutRect::from_size` set zero to `min`property.
  let content_bounds = LayoutRect::from_size(LayoutSize::new(800.0, 600.0));
  // This takes the id for managing space and clipping rect.
  let root_space_and_clip = SpaceAndClipInfo::root_scroll(pipeline_id);
  // This indicates remaining space by id.
  let spatial_id = root_space_and_clip.spatial_id;

  // Drawing rect starts from the origin of stacking context.
  // The rect is drawn in zero position by default.
  builder.push_simple_stacking_context(
      content_bounds.min,
      spatial_id,
      // Specify stacking context type.
      PrimitiveFlags::IS_BACKFACE_VISIBLE,
  );

  // ...
}
```

The above example prepares `SpaceAndClipInfo` and `StackingContext`.

`SpaceAndClipInfo` captures the root space. The `spatial_id` captures the frame space, and the rect is clipped when the rect is added to outside of the root space.

The StackingContext is the same with the browser's concept.
When the StackingContext is pushed, the rect is drawn inside it.
Also we can use filter with StackingContext like opacity defined in [here](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/webrender_api/src/display_item.rs#L1189).

```rust
pub enum FilterOp {
    /// Filter that does no transformation of the colors, needed for
    /// debug purposes only.
    Identity,
    Blur(f32, f32),
    Brightness(f32),
    Contrast(f32),
    Grayscale(f32),
    HueRotate(f32),
    Invert(f32),
    Opacity(PropertyBinding<f32>, f32),
    Saturate(f32),
    Sepia(f32),
    DropShadow(Shadow),
    ColorMatrix([f32; 20]),
    SrgbToLinear,
    LinearToSrgb,
    ComponentTransfer,
    Flood(ColorF),
}
```

You can opacity the rect with StackingContext like the following code.

```rust
builder.push_simple_stacking_context_with_filters(
    Point2D::new(800., 600.),
    spatial_id,
    PrimitiveFlags::PREFER_COMPOSITOR_SURFACE,
    &[FilterOp::Opacity(PropertyBinding::Value(0.5), 0.5)],
    &[],
    &[],
);
```

If you want to draw the rect to outside of the StackingContext, you can use `DisplayListBuilder::pop_stacking_context`.

Next, the rounded rect is drawn.

```rust
fn render(
  // ...
) {
  // ...

  // Clip the rect with border-radius.
  let complex = ComplexClipRegion::new(
      (50, 50).to(150, 150), // The rect is drawn(or clipped) within the range of this bounds.
      BorderRadius::uniform(20.0),
      ClipMode::Clip
  );
  // The clipping rounded rect is pushed to display list.
  // And it takes clip_id to bind to the rect.
  let clip_id = builder.define_clip_rounded_rect(
      root_space_and_clip.spatial_id,
      complex,
  );
  // Bind the chain with parent clip chain. The clip chain is bunch of clip.
  let clip_chain_id = builder.define_clip_chain(None, [clip_id]);

  // Push the rect to display list.
  builder.push_rect(
      // CommonItemProperties is used to bind clip info.
      &CommonItemProperties::new(
          (100, 100).to(200, 200),
          SpaceAndClipInfo { spatial_id, clip_chain_id },
      ),
      (100, 100).to(200, 200), // This will be within the range the rect property of CommonItemProperties.
      ColorF::new(0.0, 1.0, 0.0, 1.0),
  );

  // This won't be drawn, because bounds is outside of the clipped rounded rect.
  builder.push_rect(
      &CommonItemProperties::new(
          (250, 100).to(350, 200),
          SpaceAndClipInfo { spatial_id, clip_chain_id },
      ),
      (250, 100).to(350, 200),
      ColorF::new(0.0, 1.0, 0.0, 1.0),
  );

  // ...
}
```

Finally, the border is drawn.

```rust
fn render(
  // ...
) {
  // ...

  let border_side = BorderSide {
      color: ColorF::new(0.0, 0.0, 1.0, 1.0),
      style: BorderStyle::Groove,
  };
  let border_widths = LayoutSideOffsets::new_all_same(10.0);
  let border_details = BorderDetails::Normal(NormalBorder {
      top: border_side,
      right: border_side,
      bottom: border_side,
      left: border_side,
      radius: BorderRadius::uniform(20.0),
      do_aa: true,
  });

  let bounds = (100, 100).to(200, 200);
  builder.push_border(
      &CommonItemProperties::new(
          bounds,
          SpaceAndClipInfo { spatial_id, clip_chain_id },
      ),
      bounds,
      border_widths,
      border_details,
  );

  // ...
}
```

I can skip seeing about the box shadow because it is almost same with border.

## Rendering

Next, let's dive into [the `boilerplate::main_wrapper()` function](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/common/boilerplate.rs#L103).

[Beginning part of this function](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/common/boilerplate.rs#L109-L161) setup the OpenGL and window manager, so we can skip these lines.

After these lines, webrender is set up.

Currently, webrender is using glutin v0.2x that is older version, so this setup script for glutin may be old.
The following code setup webrender and frame, also build the display list.

```rust
fn main_wrapper<E: Example>(
  // ...
) {
  // ...

  // This is used to integrate with webrender backend.
  let notifier = Box::new(Notifier::new(events_loop.create_proxy()));
  // Initialize some cache, OpenGL environment, etc...
  let (mut renderer, sender) = webrender::create_webrender_instance(
      gl.clone(),
      notifier,
      opts,
      None,
  ).unwrap();
  // Create API to handle webrender like sending message to scene thread and backend thread.
  let mut api = sender.create_api();
  let document_id = api.add_document(device_size);

  // ...
}
```

`webrender::create_webrender_instance` returns `renderer` and `sender`.

- `renderer` communicates with `RenderBackend` that handle only related GPU work. And `renderer` has `result_rx` that receives result of `api_tx`.
- `sender` is used to create `RenderApi` by using `sender.create_api()`. `RenderApi` is used to handle interaction with `RenderBackend`.

Next, display list is constructed and it's sent to backend to render.

```rust
fn main_wrapper<E: Example>(
  // ...
) {
  // ...

  // Epoch is used to sync a render process. It is applied at various stages.
  let epoch = Epoch(0);
  let pipeline_id = PipelineId(0, 0);
  let layout_size = device_size.to_f32() / euclid::Scale::new(device_pixel_ratio);
  // The item that is pushed to DisplayListBuilder is transferable,
  // because it need to be sent to backend thread through IPC.
  let mut builder = DisplayListBuilder::new(pipeline_id);
  // This stores related data temporally to transfer to the backend thread.
  let mut txn = Transaction::new();

  // Initialize display list builder.
  builder.begin();

  // This is defined in example code.
  example.render(
      &mut api,
      &mut builder,
      &mut txn,
      device_size,
      pipeline_id,
      document_id,
  );

  // The display list is stored to transaction as IPC message temporally.
  txn.set_display_list(
      epoch,
      Some(ColorF::new(0.3, 0.0, 0.0, 1.0)),
      layout_size,
      builder.end(),
  );
  // The IPC message is generated to set root pipeline.
  txn.set_root_pipeline(pipeline_id);
  // The IPC message is generated to generate the frame.
  txn.generate_frame(0, RenderReasons::empty());
  // The transaction is sent to backend.
  api.send_transaction(document_id, txn);

  // ...
}
```

WebRender has the following thread for optimizing performance.

- The main thread
- The building scene thread ... The `SceneBuilderThread` is running.
- The render thread ... The `RenderBackend` is running, and it builds the frame from scene.

In content process, display list is constructed by using `example.render()` in the above code. Then, display list is serialized to transfer to the render process.  
The render process deserializes display list and makes `Scene` with deserialized display list. After constructing `Scene`, `Scene` build `Frame` that represents the actual drawing operation.  
Finally the `Renderer` consumes `Frame` and produce the OpenGL command for actual drawing.

In the above code, `api.send_transaction()` transfers Transaction to the building scene thread. After building scene, the built transaction is transferred to `RenderBackend`.
In `RenderBackend`, the frame is built from the built scene.

```rust
fn main_wrapper<E: Example>(
  // ...
) {
  // ...

  events_loop.run_return(|global_event, _elwt, control_flow| {
      let mut txn = Transaction::new();
      let mut custom_event = true;

      // ... (Handling window event)

      // When event is happen, rebuild display list.
      if custom_event {
          let mut builder = DisplayListBuilder::new(pipeline_id);
          builder.begin();

          example.render(
              &mut api,
              &mut builder,
              &mut txn,
              device_size,
              pipeline_id,
              document_id,
          );
          txn.set_display_list(
              epoch,
              Some(ColorF::new(0.3, 0.0, 0.0, 1.0)),
              layout_size,
              builder.end(),
          );
          txn.generate_frame(0, RenderReasons::empty());
      }
      api.send_transaction(document_id, txn);

      renderer.update();
      renderer.render(device_size, 0).unwrap();
      let _ = renderer.flush_pipeline_info();
      example.draw_custom(&*gl);
      windowed_context.swap_buffers().ok();

      // ...
  });

  // ...
}
```

The actual rendering is processed in event loop in example code.  
In the above code, `renderer.update()` receives message from `RenderBackend` like `PublishDocument`.  
When Renderer receives `PublishDocument` message, `renderer.render()` draws the frame.

## References

- [pcwalton/webrender-benefits.md](https://gist.github.com/pcwalton/33bd1049d6e3b686d59fbba76fc3575a)
- [WebRender vs Layers - MozillaWiki](https://wiki.mozilla.org/Gecko:Overview#WebRender_vs_Layers)
- [WebRender capture infrastructure - kvark's dev blog](http://kvark.github.io/webrender/debug/ron/2018/01/23/wr-capture-infra.html)
