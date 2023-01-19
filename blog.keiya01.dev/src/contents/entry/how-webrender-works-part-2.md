---
layout: blog/entry
title: How webrender works - part 2
description: I researched how webrender works.
date: 2022-12-02
modified: 2022-12-02
tags:
  - layout engine
  - gui
  - webrender
  - servo
entryId: how-webrender-works-part-2
---

## What is this?

This is the continuation of [How webrender works - part 1](https://blog.keiya01.dev/entry/how-the-webrender-works-part-1/).

I will read the code of [webrender](https://github.com/servo/webrender), and I will describe how it works.
The webrender is painting engine written in Rust. It is used in Firefox.

I will read the detail of implementation in this part.

If you want to learn the overall of how the webrender works, you can see [How the webrender works - part 1](https://blog.keiya01.dev/entry/how-the-webrender-works-part-1/).

## webrender::create_webrender_instance

In previous article, we understand the overall of how the webrender works. We continue to understand the code while reading the [basic](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/basic.rs) example code.

First, we read [the `webrender::create_webrender_instance` that is invoked in `boilerplate::main_wrapper`](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/examples/common/boilerplate.rs#L178).

```rust
let (mut renderer, sender) = webrender::create_webrender_instance(
    gl.clone(),
    notifier,
    opts,
    None,
).unwrap();
```

The `webrender::create_webrender_instance` is defined in [here](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/webrender/src/renderer/init.rs#L282).

```rust
pub fn create_webrender_instance(
  // ...
) -> Result<(Renderer, RenderApiSender), RendererError> {
  // ...

  let (api_tx, api_rx) = unbounded_channel();
  let (result_tx, result_rx) = unbounded_channel();

  // ...
}
```

I focus on the important part of the code. In this function, first, these channels are important.  
`api_xx` and `result_xx` is used to communicate with `RenderBackend`. `api_xx` is used to transfer data for rendering from the main thread to the backend, and `result_xx` is used to transfer result that had been rendered from the rendering thread to the main thread.

Next, `Device` struct is instantiated by [`new` method](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/webrender/src/device/gl.rs#L1414).
The `Device` is used to handle OpenGL that is wrapper by [gleam](https://github.com/servo/gleam).

```rust
pub fn create_webrender_instance(
  // ...
) -> Result<(Renderer, RenderApiSender), RendererError> {
  // ...

  let mut device = Device::new(
      gl,
      options.crash_annotator.clone(),
      options.resource_override_path.clone(),
      options.use_optimized_shaders,
      options.upload_method.clone(),
      options.batched_upload_threshold,
      options.cached_programs.take(),
      options.allow_texture_storage_support,
      options.allow_texture_swizzling,
      options.dump_shader_source.take(),
      options.surface_origin_is_top_left,
      options.panic_on_gl_error,
  );

  // ...

  device.begin_frame();

  // ...

  let max_primitive_instance_count =
      WebRenderOptions::MAX_INSTANCE_BUFFER_SIZE / mem::size_of::<PrimitiveInstanceData>();
  let vaos = vertex::RendererVAOs::new(
      &mut device,
      if options.enable_instancing { None } else { NonZeroUsize::new(max_primitive_instance_count) },
  );

  let texture_upload_pbo_pool = UploadPBOPool::new(&mut device, options.upload_pbo_default_size);
  let staging_texture_pool = UploadTexturePool::new();
  let texture_resolver = TextureResolver::new(&mut device);

  // ...

  // On some (mostly older, integrated) GPUs, the normal GPU texture cache update path
  // doesn't work well when running on ANGLE, causing CPU stalls inside D3D and/or the
  // GPU driver. See https://bugzilla.mozilla.org/show_bug.cgi?id=1576637 for much
  // more detail. To reduce the number of code paths we have active that require testing,
  // we will enable the GPU cache scatter update path on all devices running with ANGLE.
  // We want a better solution long-term, but for now this is a significant performance
  // improvement on HD4600 era GPUs, and shouldn't hurt performance in a noticeable
  // way on other systems running under ANGLE.
  let is_software = device.get_capabilities().renderer_name.starts_with("Software");

  // On other GL platforms, like macOS or Android, creating many PBOs is very inefficient.
  // This is what happens in GPU cache updates in PBO path. Instead, we switch everything
  // except software GL to use the GPU scattered updates.
  let supports_scatter = device.get_capabilities().supports_color_buffer_float;
  let gpu_cache_texture = gpu_cache::GpuCacheTexture::new(
      &mut device,
      supports_scatter && !is_software,
  )?;

  device.end_frame();

  // ...
}
```

In above the code, OpenGL drawing config is setup.
WebRender is using either VAO(Vertex Array Object) or PBO(Pixel Buffer Object) that is stored in GpuCacheTexture. The reason why it is supporting VAO and PBO is for the following comment.

> On other GL platforms, like macOS or Android, creating many PBOs is very inefficient.
> This is what happens in GPU cache updates in PBO path. Instead, we switch everything
> except software GL to use the GPU scattered updates.

The way using VAO is a simple way that handle each of vertex data and pixel data.
On the other hand, PBO is a extension of VAO, it handle vertex data with pixel data.

Next, `GlyphRasterizer` is instantiated in below the code.

```rust
pub fn create_webrender_instance(
  // ...
) -> Result<(Renderer, RenderApiSender), RendererError> {
  // ...

  let workers = options
      .workers
      .take()
      .unwrap_or_else(|| {
          let worker = ThreadPoolBuilder::new()
              .thread_name(|idx|{ format!("WRWorker#{}", idx) })
              .start_handler(move |idx| {
                  register_thread_with_profiler(format!("WRWorker#{}", idx));
                  profiler::register_thread(&format!("WRWorker#{}", idx));
              })
              .exit_handler(move |_idx| {
                  profiler::unregister_thread();
              })
              .build();
          Arc::new(worker.unwrap())
      });

  // Ensure shared font keys exist within their own unique namespace so
  // that they don't accidentally collide across Renderer instances.
  let font_namespace = if namespace_alloc_by_client {
      options.shared_font_namespace.expect("Shared font namespace must be allocated by client")
  } else {
      RenderBackend::next_namespace_id()
  };
  let fonts = SharedFontResources::new(font_namespace);

  // ...

  let glyph_rasterizer = GlyphRasterizer::new(workers, device.get_capabilities().supports_r8_texture_upload)?;

  // ...
}
```

[`GlyphRasterizer`](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/webrender/src/glyph_rasterizer/mod.rs#L1553) handles font data.  
The important part of this struct is what it has `workers` and `font_contexts` property.

`ryon` is used for `workers` in default.  
Also `workers` are used to raster glyph asynchronously, but [the worker is only used in the following case](https://github.com/servo/webrender/blob/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/webrender/src/glyph_rasterizer/mod.rs#L256-L258) for performance reason.

```rust
// If we have a large amount of remaining work to do, spawn to worker threads,
// even if that work is shared among a number of different font instances.
let use_workers = self.pending_glyph_count >= 8;
```

`font_contexts` has `FontContext` that is defined by [each platform](https://github.com/servo/webrender/tree/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/webrender/src/platform).
`FontContexts` is handled as `Arc`. Also `GlyphRasterizer` has ownership of `workers`, and `FontContexts` has referenced `workers`.

```rust
impl GlyphRasterizer {
    pub fn new(workers: Arc<ThreadPool>, can_use_r8_format: bool) -> Result<Self, ResourceCacheError> {
      let (glyph_tx, glyph_rx) = unbounded();

      let num_workers = workers.current_num_threads();
      let mut contexts = Vec::with_capacity(num_workers);

      for _ in 0 .. num_workers {
          contexts.push(Mutex::new(FontContext::new()?));
      }

      let font_context = FontContexts {
          worker_contexts: contexts,
          workers: Arc::clone(&workers),
          locked_mutex: Mutex::new(false),
          locked_cond: Condvar::new(),
      };

      Ok(GlyphRasterizer {
          font_contexts: Arc::new(font_context),
          fonts: FastHashSet::default(),
          pending_glyph_jobs: 0,
          pending_glyph_count: 0,
          glyph_request_count: 0,
          glyph_rx,
          glyph_tx,
          workers,
          fonts_to_remove: Vec::new(),
          font_instances_to_remove: Vec::new(),
          enable_multithreading: true,
          pending_glyph_requests: FastHashMap::default(),
          can_use_r8_format,
      })
  }

  // ...
}
```

Next, in `create_webrender_instance`, `SceneBuilderThread` is setup.

```rust
pub fn create_webrender_instance(
  // ...
) -> Result<(Renderer, RenderApiSender), RendererError> {
  // ...

  let fonts = SharedFontResources::new(font_namespace);

  // ...

  let (scene_builder_channels, scene_tx) =
      SceneBuilderThreadChannels::new(api_tx.clone());

  let sb_fonts = fonts.clone();

  thread::Builder::new().name(scene_thread_name.clone()).spawn(move || {
      // ...

      let mut scene_builder = SceneBuilderThread::new(
          config,
          sb_fonts,
          make_size_of_ops(),
          scene_builder_hooks,
          scene_builder_channels,
      );
      scene_builder.run();

      // ...
  })?;
}
```

In the above example, first, `SharedFontResources` is instantiated.
This shares the font resource between the main thread and the render thread.

Second, `SceneBuilderThreadChannels` is created.  
This is used to communicate between the main thread, the scene thread and the render thread.
For more detail, you can read the previous article.

These variables is used to create `SceneBuilderThread` in new thread, and it runs the loop by `scene_builder.run()` and waits for receiving the message from the main thread or the render thread.

For example, [the `SceneBuilderThread` receives the `SceneBuilderRequest::Transactions` message](https://github.com/servo/webrender/blob/b6dc1b1fd1b4e46ec8b6682fdd41af3739b0e22d/webrender/src/scene_builder_thread.rs#L312), and [the `transaction` has the `SceneMsg::SetDisplayList` message](https://github.com/servo/webrender/blob/b6dc1b1fd1b4e46ec8b6682fdd41af3739b0e22d/webrender/src/scene_builder_thread.rs#L538), then the scene is built and finally [the `SceneBuilderResult::Transactions` is sent](https://github.com/servo/webrender/blob/b6dc1b1fd1b4e46ec8b6682fdd41af3739b0e22d/webrender/src/scene_builder_thread.rs#L713) from `SceneBuilderThread` to the `RenderBackend` thread(a.k.a. render thread).

Next, the render thread is initialized. In the render thread, the following struct is instantiated.

- `TextureCache` ... Caches image, rasterized glyph, risterized blob, etc.
- `PictureTexture` ... Handles picture caching
- `GlyphCache` ... Caches current frame glyphs
- `ResourceCache` ... Manages resource in RenderBackend
- `RenderBackend` ... This creates the frame and transfers it to Renderer.

```rust
pub fn create_webrender_instance(
  // ...
) -> Result<(Renderer, RenderApiSender), RendererError> {
  // ...

  let rb_scene_tx = scene_tx.clone();
  let rb_fonts = fonts.clone();
  let enable_multithreading = options.enable_multithreading;
  thread::Builder::new().name(rb_thread_name.clone()).spawn(move || {
      // ...

      let texture_cache = TextureCache::new(
          max_internal_texture_size,
          image_tiling_threshold,
          color_cache_formats,
          swizzle_settings,
          &texture_cache_config,
      );

      let picture_textures = PictureTextures::new(
          picture_tile_size,
          picture_texture_filter,
      );

      let glyph_cache = GlyphCache::new();

      let mut resource_cache = ResourceCache::new(
          texture_cache,
          picture_textures,
          glyph_rasterizer,
          glyph_cache,
          rb_fonts,
          rb_blob_handler,
      );

      // ...

      let mut backend = RenderBackend::new(
          api_rx,
          result_tx,
          rb_scene_tx,
          resource_cache,
          backend_notifier,
          config,
          sampler,
          make_size_of_ops(),
          debug_flags,
          namespace_alloc_by_client,
      );
      backend.run();

      // ...
  })?;

  // ...
}
```

In the above example, `backend.run()` waits for receiving message from the scene thread or the main thread.
And this publishes the message for the Renderer for actual drawing.

Finally, the `Renderer` and `RenderApiSender` are instantiated.

```rust
pub fn create_webrender_instance(
  // ...
) -> Result<(Renderer, RenderApiSender), RendererError> {
  // ...

  let mut vertex_data_textures = Vec::new();
  for _ in 0 .. VERTEX_DATA_TEXTURE_COUNT {
      vertex_data_textures.push(vertex::VertexDataTextures::new());
  }

  // ...

  let mut renderer = Renderer {
    result_rx,
    api_tx: api_tx.clone(),
    vertex_data_textures,
    // ...
  };

  // ...

  let sender = RenderApiSender::new(
    api_tx,
    scene_tx,
    low_priority_scene_tx,
    blob_image_handler,
    fonts,
  );
}
```

`vertex_data_textures` is used to stores vertex data passed from the frame.  
And `VERTEX_DATA_TEXTURE_COUNT` is described like the following.

```rust
/// The size of the array of each type of vertex data texture that
/// is round-robin-ed each frame during bind_frame_data. Doing this
/// helps avoid driver stalls while updating the texture in some
/// drivers. The size of these textures are typically very small
/// (e.g. < 16 kB) so it's not a huge waste of memory. Despite that,
/// this is a short-term solution - we want to find a better way
/// to provide this frame data, which will likely involve some
/// combination of UBO/SSBO usage. Although this only affects some
/// platforms, it's enabled on all platforms to reduce testing
/// differences between platforms.
```

Also `Renderer` is used to render the texture actually.
`RenderApiSender` send the message for `RenderBackend`.

## Constructing display list

Next, we research how to construct display list.

### Display list sample code

First, the display list is constructed by the following code.

```rust
let (mut renderer, sender) = webrender::create_webrender_instance(
    gl.clone(),
    notifier,
    opts,
    None,
).unwrap();
let mut api = sender.create_api();
let document_id = api.add_document(device_size);

let device_size = {
    let size = windowed_context
        .window()
        .inner_size();
    DeviceIntSize::new(size.width as i32, size.height as i32)
};

let epoch = Epoch(0);
let pipeline_id = PipelineId(0, 0);
let layout_size = device_size.to_f32() / euclid::Scale::new(device_pixel_ratio);
let mut builder = DisplayListBuilder::new(pipeline_id);
let mut txn = Transaction::new();

builder.begin();

// Construct the drawing rect
let root_space_and_clip = SpaceAndClipInfo::root_scroll(pipeline_id);
let spatial_id = root_space_and_clip.spatial_id;
builder.push_simple_stacking_context(
    Point2D::new(0., 0.),
    spatial_id,
    PrimitiveFlags::IS_BACKFACE_VISIBLE,
);
let clip_id = builder.define_clip_rect(spatial_id, (100, 100).to(200, 200));
let clip_chain_id = builder.define_clip_chain(None, [clip_id]);
builder.push_rect(
    &CommonItemProperties::new(
        (100, 100).to(200, 200),
        SpaceAndClipInfo { spatial_id, clip_chain_id },
    ),
    (100, 100).to(200, 200),
    ColorF::new(0.0, 1.0, 0.0, 1.0),
);

txn.set_display_list(
    epoch,
    Some(ColorF::new(0.3, 0.0, 0.0, 1.0)),
    layout_size,
    builder.end(),
);
txn.set_root_pipeline(pipeline_id);
txn.generate_frame(0, RenderReasons::empty());
api.send_transaction(document_id, txn);
```

### `builder.begin()`

Let's dive into the internal code.

First, we read `builder.begin()`.

`builder.begin()` is the following code.

```rust
pub fn begin(&mut self) {
    assert_eq!(self.state, BuildState::Idle);
    self.state = BuildState::Build;
    self.builder_start_time = precise_time_ns();
    self.reset();
}
```

This set `BuildState` as `Build`, and `builder_start_time`.
Also `self.reset()` is the following code.

```rust
fn reset(&mut self) {
    self.payload.clear();
    self.pending_chunk.clear();
    self.writing_to_chunk = false;

    self.next_clip_index = FIRST_CLIP_NODE_INDEX;
    self.next_spatial_index = FIRST_SPATIAL_NODE_INDEX;
    self.next_clip_chain_id = 0;

    self.save_state = None;
    self.cache_size = 0;
    self.serialized_content_buffer = None;

    self.rf_mapper = ReferenceFrameMapper::new();
    self.spatial_nodes = vec![SpatialNodeInfo::identity(); FIRST_SPATIAL_NODE_INDEX + 1];
}
```

The `self.reset()` resets current state of the display list.

### `builder.push_stacking_context()`

Next, we read `builder.push_stacking_context`.

```rust
builder.push_simple_stacking_context(
    Point2D::new(0., 0.),
    spatial_id,
    PrimitiveFlags::IS_BACKFACE_VISIBLE,
);
```

It's internal code is the following.

```rust
pub fn push_simple_stacking_context(
    &mut self,
    origin: LayoutPoint,
    spatial_id: di::SpatialId,
    prim_flags: di::PrimitiveFlags,
) {
    self.push_simple_stacking_context_with_filters(
        origin,
        spatial_id,
        prim_flags,
        &[],
        &[],
        &[],
    );
}
```

The internal code of `self.push_simple_stacking_context_with_filters` is the following.

```rust
pub fn push_simple_stacking_context_with_filters(
    &mut self,
    origin: LayoutPoint,
    spatial_id: di::SpatialId,
    prim_flags: di::PrimitiveFlags,
    filters: &[di::FilterOp],
    filter_datas: &[di::FilterData],
    filter_primitives: &[di::FilterPrimitive],
) {
    self.push_stacking_context(
        origin,
        spatial_id,
        prim_flags,
        None,
        di::TransformStyle::Flat,
        di::MixBlendMode::Normal,
        filters,
        filter_datas,
        filter_primitives,
        di::RasterSpace::Screen,
        di::StackingContextFlags::empty(),
    );
}
```

Also the internal code of `self.push_stacking_context` is the following.
It is deep nested.

```rust
pub fn push_stacking_context(
    &mut self,
    origin: LayoutPoint,
    spatial_id: di::SpatialId,
    prim_flags: di::PrimitiveFlags,
    clip_chain_id: Option<di::ClipChainId>,
    transform_style: di::TransformStyle,
    mix_blend_mode: di::MixBlendMode,
    filters: &[di::FilterOp],
    filter_datas: &[di::FilterData],
    filter_primitives: &[di::FilterPrimitive],
    raster_space: di::RasterSpace,
    flags: di::StackingContextFlags,
) {
    self.push_filters(filters, filter_datas, filter_primitives);

    let item = di::DisplayItem::PushStackingContext(di::PushStackingContextDisplayItem {
        origin,
        spatial_id,
        prim_flags,
        stacking_context: di::StackingContext {
            transform_style,
            mix_blend_mode,
            clip_chain_id,
            raster_space,
            flags,
        },
    });

    self.rf_mapper.push_offset(origin.to_vector());
    self.push_item(&item);
}
```

The above code pushes the properties.

- `self.push_filters` ... skip it for understanding simply.
- `self.rf_mapper.push_offset`
- `self.push_item`

First, we read `self.rf_mapper.push_offset()`.

Before beginning reading it, we need to understand a role of the `self.rf_mapper` property.
`rf_mapper` property has `ReferenceFrameMapper` struct, and it is used to define coordinates by the stacking context.

The struct is the following.

```rust
/// The offset stack for a given reference frame.
#[derive(Clone)]
struct ReferenceFrameState {
    /// A stack of current offsets from the current reference frame scope.
    offsets: Vec<LayoutVector2D>,
}

/// Maps from stacking context layout coordinates into reference frame
/// relative coordinates.
#[derive(Clone)]
pub struct ReferenceFrameMapper {
    /// A stack of reference frame scopes.
    frames: Vec<ReferenceFrameState>,
}
```

The code of `self.rf_mapper.push_offset()` is the following.  
This appends size of the frame offset plus the stacking context offset.

```rust
pub fn push_offset(&mut self, offset: LayoutVector2D) {
    let frame = self.frames.last_mut().unwrap();
    let current_offset = *frame.offsets.last().unwrap();
    frame.offsets.push(current_offset + offset);
}
```

Finally, `self.push_item(&item)` is invoked. It pushes the `PushStackingContext` display list item.

```rust
let item = di::DisplayItem::PushStackingContext(di::PushStackingContextDisplayItem {
    origin,
    spatial_id,
    prim_flags,
    stacking_context: di::StackingContext {
        transform_style,
        mix_blend_mode,
        clip_chain_id,
        raster_space,
        flags,
    },
});
```

Also the code of `self.push_item()` is the following.

```rust
pub fn push_item(&mut self, item: &di::DisplayItem) {
    self.push_item_to_section(item, self.default_section());
}
```

Additionally the code of `self.default_section` is the below.

```rust
fn default_section(&self) -> DisplayListSection {
    if self.writing_to_chunk {
        DisplayListSection::Chunk
    } else {
        DisplayListSection::Data
    }
}
```

The `self.writing_to_chunk` is false in default, so `DisplayListSection::Data` is selected in this case.

Also the code of `self.push_item_to_section()` is the following.

```rust
pub fn push_item_to_section(
    &mut self,
    item: &di::DisplayItem,
    section: DisplayListSection,
) {
    debug_assert_eq!(self.state, BuildState::Build);
    poke_into_vec(item, self.buffer_from_section(section));
    self.add_to_display_list_dump(item);
}
```

In this code, we focus the code of `self.buffer_from_section` and `poke_into_vec`.

First, `self.buffer_from_section` is the following.

```rust
fn buffer_from_section(
    &mut self,
    section: DisplayListSection
) -> &mut Vec<u8> {
    match section {
        DisplayListSection::Data => &mut self.payload.items_data,
        DisplayListSection::CacheData => &mut self.payload.cache_data,
        DisplayListSection::Chunk => &mut self.pending_chunk,
    }
}
```

In this case, `section` is `DisplayListSection::Data`, so this function returns `self.payload.items_data`.
`payload` property has `DisplayListPayload` struct, and the code is the below.

```rust
pub struct DisplayListPayload {
    /// Serde encoded bytes. Mostly DisplayItems, but some mixed in slices.
    pub items_data: Vec<u8>,

    /// Serde encoded DisplayItemCache structs
    pub cache_data: Vec<u8>,

    /// Serde encoded SpatialTreeItem structs
    pub spatial_tree: Vec<u8>,
}
```

The reason why these properties are needed to encode is the display list need to be sent to building scene thread.

Next, `poke_into_vec()` is invoked. This is provided by [`peek-poke` lib](https://github.com/servo/webrender/tree/8827e79bd44b2f8a0cfef80a5123d97cf98c65ed/peek-poke).

If you want to know detail of peek-poke, you can see [this repository](https://github.com/keiya01/peek-poke-example).

Attempting to describe simply, `peek-poke` encodes the `DisplayItem` to the pointer of it and push it to `Vec`.  
Additionally, `peek-poke` can also decode the encoded `DisplayItem` to original type.  
So we can share these values between another thread.

Finally, `self.add_to_display_list_dump(item)` is for debugging, so we can skip it.

### Constructing rect

Backing to [the sample code](#Display-list-sample-code), let's dig into the following code.

```rust
let clip_id = builder.define_clip_rect(spatial_id, (100, 100).to(200, 200));
let clip_chain_id = builder.define_clip_chain(None, [clip_id]);

builder.push_rect(
    &CommonItemProperties::new(
        (100, 100).to(200, 200),
        SpaceAndClipInfo { spatial_id, clip_chain_id },
    ),
    (100, 100).to(200, 200),
    ColorF::new(0.0, 1.0, 0.0, 1.0),
);
```

Before reading this code, we should clarify about clipping.

The clip rect indicates that it clips the overflowing rect.
For example, if the clip rect has `(100, 100).to(200, 200)` coordinates, and the actual rect has `(50, 50).to(150, 150)`, then displaying rect is `(100, 100).to(150, 150)`.

Well, let's read the code.

First, `builder.define_clip_rect` is called.  
This function defines the clip rect.

```rust
pub fn define_clip_rect(
    &mut self,
    spatial_id: di::SpatialId,
    clip_rect: LayoutRect,
) -> di::ClipId {
    // Get clip index that increments one by one.
    let id = self.generate_clip_index();

    let current_offset = self.current_offset(spatial_id);
    let clip_rect = clip_rect.translate(current_offset);

    let item = di::DisplayItem::RectClip(di::RectClipDisplayItem {
        id,
        spatial_id,
        clip_rect,
    });

    self.push_item(&item);
    id
}
```

In this function, first, `self.generate_clip_index()` is called. This method increments clip id, and returns `ClipId`.

Next, `self.current_offset()` is called. This function calculates offset for relative to the frame.
The function is the below.

```rust
/// Retrieve the current offset to allow converting a stacking context
/// relative coordinate to be relative to the owing reference frame,
/// also considering any external scroll offset on the provided
/// spatial node.
fn current_offset(
    &mut self,
    spatial_id: di::SpatialId,
) -> LayoutVector2D {
    // Get the current offset from stacking context <-> reference frame space.
    let rf_offset = self.rf_mapper.current_offset();

    // Get the external scroll offset, if applicable.
    let scroll_offset = self.spatial_nodes[spatial_id.0].accumulated_external_scroll_offset;

    rf_offset + scroll_offset
}
```

Additionally, `self.rf_mapper.current_offset()` is the following.

```rust
pub fn current_offset(&self) -> LayoutVector2D {
    *self.frames.last().unwrap().offsets.last().unwrap()
}
```

By being able to refer the last frame, we can simply switch the frame.

Next, previous `self.current_offset` also refers the following field.

```rust
let scroll_offset = self.spatial_nodes[spatial_id.0].accumulated_external_scroll_offset;
```

The initial value of `spatial_nodes` is the below.

```rust
vec![SpatialNodeInfo::identity(); FIRST_SPATIAL_NODE_INDEX + 1]
```

And `SpatialNodeInfo::identity` is defined in the following.

```rust
impl SpatialNodeInfo {
    fn identity() -> Self {
        SpatialNodeInfo {
            accumulated_external_scroll_offset: LayoutVector2D::zero(),
        }
    }
}
```

That is, initial value is `LayoutVector2D::zero()`.
Also the `spatial_nodes` is mutated by using the following methods.

- `DisplayListBuilder::push_reference_frame` ... For reference frame
- `DisplayListBuilder::define_scroll_frame` ... For scroll frame
- `DisplayListBuilder::define_sticky_frame` ... For sticky frame

In this case, we don't use the above methods, so the value keeps an initial value.

Therefore the result of `self.current_offset()` is `rf_offset`.

Next, we dig into `clip_rect.translate(current_offset)` method.

```rust
pub fn translate(&self, by: Vector2D<T, U>) -> Self {
    Box2D {
        min: self.min + by,
        max: self.max + by,
    }
}
```

This method only translates the clip rect position by offset.

Next, `DisplayItem::RectClip` is pushed by `self.push_item`.

```rust
let item = di::DisplayItem::RectClip(di::RectClipDisplayItem {
    id,
    spatial_id,
    clip_rect,
});

self.push_item(&item);
```

We saw about `self.push_item` in [`builder.push_stacking_context()` section](<#`builder.push_stacking_context()`>), so we can skip it.

Next, we dig into `self.define_clip_chain()`.

```rust
pub fn define_clip_chain<I>(
    &mut self,
    parent: Option<di::ClipChainId>,
    clips: I,
) -> di::ClipChainId
where
    I: IntoIterator<Item = di::ClipId>,
    I::IntoIter: ExactSizeIterator + Clone,
{
    let id = self.generate_clip_chain_id();
    self.push_item(&di::DisplayItem::ClipChain(di::ClipChainItem { id, parent }));
    self.push_iter(clips);
    id
}
```

This method also push the `DisplayItem::ClipChain` by `self.push_item`.
Next, `self.push_iter` is invoked to push `ClipId` that generated by `self.generate_clip_index`.

```rust
pub fn push_iter<I>(&mut self, iter: I)
where
    I: IntoIterator,
    I::IntoIter: ExactSizeIterator,
    I::Item: Poke,
{
    assert_eq!(self.state, BuildState::Build);

    let mut buffer = self.buffer_from_section(self.default_section());
    Self::push_iter_impl(&mut buffer, iter);
}
```

We read the code about `self.buffer_from_section`, so we can skip this function.

Next, let's dive into `Self::push_iter_impl`.

The code is following.

```rust
fn push_iter_impl<I>(data: &mut Vec<u8>, iter_source: I)
where
    I: IntoIterator,
    I::IntoIter: ExactSizeIterator,
    I::Item: Poke,
{
    let iter = iter_source.into_iter();
    let len = iter.len();
    // Format:
    // payload_byte_size: usize, item_count: usize, [I; item_count]

    // Track the the location of where to write byte size with offsets
    // instead of pointers because data may be moved in memory during
    // `serialize_iter_fast`.
    let byte_size_offset = data.len();

    // We write a dummy value so there's room for later
    poke_into_vec(&0usize, data);
    poke_into_vec(&len, data);
    let count = poke_extend_vec(iter, data);
    debug_assert_eq!(len, count, "iterator.len() returned two different values");

    // Add red zone
    ensure_red_zone::<I::Item>(data);

    // Now write the actual byte_size
    let final_offset = data.len();
    debug_assert!(final_offset >= (byte_size_offset + mem::size_of::<usize>()),
        "space was never allocated for this array's byte_size");
    let byte_size = final_offset - byte_size_offset - mem::size_of::<usize>();
    poke_inplace_slice(&byte_size, &mut data[byte_size_offset..]);
}
```

This pushes the array to payload.

In this case, why does webrender need to separate the `iter` with `DisplayItem`?  
I could not understand about the detail of this code.  
But maybe this is because we can not find `Vec` from payload.  
So webrender pushes `ClipChainItem` as marker before doing `push_iter`.
By doing this, we will be able to find the array from payload.

Finally, `builder.push_rect()` is invoked, but this only push `DisplayItem::Rectangle` by `self.push_item()`, so we can skip it.

## Transaction

Next is about transaction.

After display list is constructed, it's sent to scene builder through transaction.  
The following code is invoked.

```rust
txn.set_display_list(
    epoch,
    Some(ColorF::new(0.3, 0.0, 0.0, 1.0)),
    layout_size,
    builder.end(),
);
txn.set_root_pipeline(pipeline_id);
txn.generate_frame(0, RenderReasons::empty());
api.send_transaction(document_id, txn);
```

First, let's look the following code.

```rust
txn.set_display_list(
    epoch,
    Some(ColorF::new(0.3, 0.0, 0.0, 1.0)),
    layout_size,
    builder.end(),
);
```

In this code, first, `builder.end()` is called.

The code is the following.

```rust
pub fn end(&mut self) -> (PipelineId, BuiltDisplayList) {
    assert_eq!(self.state, BuildState::Build);
    assert!(self.save_state.is_none(), "Finalized DisplayListBuilder with a pending save");

    if let Some(content) = self.serialized_content_buffer.take() {
        println!("-- WebRender display list for {:?} --\n{}",
            self.pipeline_id, content);
    }

    // Add `DisplayItem::max_size` zone of zeroes to the end of display list
    // so there is at least this amount available in the display list during
    // serialization.
    ensure_red_zone::<di::DisplayItem>(&mut self.payload.items_data);
    ensure_red_zone::<di::DisplayItem>(&mut self.payload.cache_data);
    ensure_red_zone::<di::SpatialTreeItem>(&mut self.payload.spatial_tree);

    // While the first display list after tab-switch can be large, the
    // following ones are always smaller thanks to interning. We attempt
    // to reserve the same capacity again, although it may fail. Memory
    // pressure events will cause us to release our buffers if we ask for
    // too much. See bug 1531819 for related OOM issues.
    let next_capacity = DisplayListCapacity {
        cache_size: self.payload.cache_data.len(),
        items_size: self.payload.items_data.len(),
        spatial_tree_size: self.payload.spatial_tree.len(),
    };
    let payload = mem::replace(
        &mut self.payload,
        DisplayListPayload::new(next_capacity),
    );
    let end_time = precise_time_ns();

    self.state = BuildState::Idle;

    (
        self.pipeline_id,
        BuiltDisplayList {
            descriptor: BuiltDisplayListDescriptor {
                gecko_display_list_type: GeckoDisplayListType::None,
                builder_start_time: self.builder_start_time,
                builder_finish_time: end_time,
                send_start_time: end_time,
                total_clip_nodes: self.next_clip_index,
                total_spatial_nodes: self.next_spatial_index,
                cache_size: self.cache_size,
            },
            payload,
        },
    )
}
```

The following code is used for ensuring the space of payload for peek-poke.

```rust
// Add `DisplayItem::max_size` zone of zeroes to the end of display list
// so there is at least this amount available in the display list during
// serialization.
ensure_red_zone::<di::DisplayItem>(&mut self.payload.items_data);
ensure_red_zone::<di::DisplayItem>(&mut self.payload.cache_data);
ensure_red_zone::<di::SpatialTreeItem>(&mut self.payload.spatial_tree);
```

And the following code move the ownership for new one.

```rust
// While the first display list after tab-switch can be large, the
// following ones are always smaller thanks to interning. We attempt
// to reserve the same capacity again, although it may fail. Memory
// pressure events will cause us to release our buffers if we ask for
// too much. See bug 1531819 for related OOM issues.
let next_capacity = DisplayListCapacity {
    cache_size: self.payload.cache_data.len(),
    items_size: self.payload.items_data.len(),
    spatial_tree_size: self.payload.spatial_tree.len(),
};
let payload = mem::replace(
    &mut self.payload,
    DisplayListPayload::new(next_capacity),
);
```

Also, to preserve order of rendering, processing time is captured.

```rust
let end_time = precise_time_ns();
```

Finally, the following values are returned from `builder.end()`.

```rust
(
    self.pipeline_id,
    BuiltDisplayList {
        descriptor: BuiltDisplayListDescriptor {
            gecko_display_list_type: GeckoDisplayListType::None,
            builder_start_time: self.builder_start_time,
            builder_finish_time: end_time,
            send_start_time: end_time,
            total_clip_nodes: self.next_clip_index,
            total_spatial_nodes: self.next_spatial_index,
            cache_size: self.cache_size,
        },
        payload,
    },
)
```

Next, `txn.set_display_list` sets the `BuiltDisplayList` to `Transaction`.

```rust
pub fn set_display_list(
    &mut self,
    epoch: Epoch,
    background: Option<ColorF>,
    viewport_size: LayoutSize,
    (pipeline_id, mut display_list): (PipelineId, BuiltDisplayList),
) {
    display_list.set_send_time_ns(precise_time_ns());
    self.scene_ops.push(
        SceneMsg::SetDisplayList {
            display_list,
            epoch,
            pipeline_id,
            background,
            viewport_size,
        }
    );
}
```

Then, `pipeline_id` is set. I can not understand about a role of `pipeline_id` yet.  
But if this id is changed, then scene builder start building a new frame.

Also, `txn.generate_frame` sets whether scene should generate the frame.

Next, `api.send_transaction(document_id, txn)` is invoked.  
This send the transaction to scene building thread.

In scene building thread, it is wanting for transaction is sent. So next discussion move to scene building thread.

But this article is so long, so we will dig into it in next article
