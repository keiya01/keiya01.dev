---
layout: blog/entry
title: Read code of Bevy
description: This is a note that summarize the code I read.
date: 2023-05-01
modified: 2023-05-01
tags:
  - Bevy
  - Rust
  - GUI
  - Code Reading
entryId: read-code-of-bevy
---

## Overview

I investigated how Bevy works, so I will summarize it in this article.  
[Bevy](https://github.com/bevyengine/bevy) is game engine written in Rust. Also it uses [wgpu](https://github.com/gfx-rs/wgpu).
wgpu is a library that provides abstracted API for GPU API. Also it follows Web GPU specification.

## Overall of Bevy

First, I will describe the overall of Bevy through [load_gltf example](https://github.com/bevyengine/bevy/blob/ee697f820c0b164cf2825b9c8e932fc8cee24a2c/examples/3d/load_gltf.rs).

The entry point is below.

```rust
fn main() {
    App::new()
        .insert_resource(AmbientLight {
            color: Color::WHITE,
            brightness: 1.0 / 5.0f32,
        })
        .insert_resource(DirectionalLightShadowMap { size: 4096 })
        .add_plugins(DefaultPlugins)
        .add_systems(Startup, setup)
        .add_systems(Update, animate_light_direction)
        .run();
}
```

### How it works?

First, `App` struct provided by Bevy is initialized with `App::new()`.  
Then, some resources like `AmbientLight`, `DirectionalLightShadowMap` are initialized.  
Next, `DefaultPlugins` is added. It includes some functionality like window management by [winit](https://github.com/rust-windowing/winit).  
Additionally, some `systems` are added through `App::add_systems` function. In this step, some functions are added as system, also these are related to schedule. In this example, `Startup` is added as schedule label. This means this system will be invoked at `Startup` order on schedule of Bevy.  
Also `Update` works similar to the `Startup` process.

## Deep dive into code

In this section, we will deep dive into the example code.

### Initialize App struct

`App::new()` is defined like the following.

```rust
/// Creates a new [`App`] with some default structure to enable core engine features.
/// This is the preferred constructor for most use cases.
pub fn new() -> App {
    App::default()
}
```

Also `App` has `Default` trait.

```rust
impl Default for App {
    fn default() -> Self {
        let mut app = App::empty();
        #[cfg(feature = "bevy_reflect")]
        app.init_resource::<AppTypeRegistry>();

        app.add_plugin(MainSchedulePlugin);
        app.add_event::<AppExit>();

        #[cfg(feature = "bevy_ci_testing")]
        {
            crate::ci_testing::setup_app(&mut app);
        }

        app
    }
}
```

Then `App::empty` is below.

```rust
/// Creates a new empty [`App`] with minimal default configuration.
///
/// This constructor should be used if you wish to provide custom scheduling, exit handling, cleanup, etc.
pub fn empty() -> App {
    let mut world = World::new();
    world.init_resource::<Schedules>();
    Self {
        world,
        runner: Box::new(run_once),
        sub_apps: HashMap::default(),
        plugin_registry: Vec::default(),
        plugin_name_added: Default::default(),
        main_schedule_label: Box::new(Main),
        building_plugin_depth: 0,
    }
}
```

In `App::empty` function, `World` struct will be initialized.

### Initialize World struct

`World::new()` works like the following.

```rust
/// Creates a new empty [World]
/// # Panics
///
/// If [`usize::MAX`] [`World`]s have been created.
/// This guarantee allows System Parameters to safely uniquely identify a [`World`],
/// since its [`WorldId`] is unique
#[inline]
pub fn new() -> World {
    World::default()
}
```

`Default` trait is below.

```rust
impl Default for World {
    fn default() -> Self {
        Self {
            id: WorldId::new().expect("More `bevy` `World`s have been created than is supported"),
            entities: Entities::new(),
            components: Default::default(),
            archetypes: Archetypes::new(),
            storages: Default::default(),
            bundles: Default::default(),
            removed_components: Default::default(),
            archetype_component_access: Default::default(),
            // Default value is `1`, and `last_change_tick`s default to `0`, such that changes
            // are detected on first system runs and for direct world queries.
            change_tick: AtomicU32::new(1),
            last_change_tick: Tick::new(0),
            last_check_tick: Tick::new(0),
        }
    }
}
```

Then `world.init_resource::<Schedules>();` will be invoked after initializing `World` struct.

```rust
/// Initializes a new resource and returns the [`ComponentId`] created for it.
///
/// If the resource already exists, nothing happens.
///
/// The value given by the [`FromWorld::from_world`] method will be used.
/// Note that any resource with the [`Default`] trait automatically implements [`FromWorld`],
/// and those default values will be here instead.
#[inline]
pub fn init_resource<R: Resource + FromWorld>(&mut self) -> ComponentId {
    let component_id = self.components.init_resource::<R>();
    if self
        .storages
        .resources
        .get(component_id)
        .map_or(true, |data| !data.is_present())
    {
        let value = R::from_world(self);
        OwningPtr::make(value, |ptr| {
            // SAFETY: component_id was just initialized and corresponds to resource of type R.
            unsafe {
                self.insert_resource_by_id(component_id, ptr);
            }
        });
    }
    component_id
}
```

In here, `R: Resource + FromWorld` generics will be `Schedule`. `FromWorld` defines `from_world` method, it only invoke `T::default()` in default. So `Schedule::default` is invoked in this case. `Default` trait for `Schedule` invokes only `Self::new()`.

```rust
struct Schedule {
  pub fn new() -> Self {
      Self {
          graph: ScheduleGraph::new(),
          executable: SystemSchedule::new(),
          executor: make_executor(ExecutorKind::default()),
          executor_initialized: false,
      }
  }
  // ...
}
```

Then the resource will be inserted to world.

### MainSchedulePlugin

Back to `App::default()` definition.

```rust
impl Default for App {
    fn default() -> Self {
        let mut app = App::empty();
        #[cfg(feature = "bevy_reflect")]
        app.init_resource::<AppTypeRegistry>();

        app.add_plugin(MainSchedulePlugin);
        app.add_event::<AppExit>();

        #[cfg(feature = "bevy_ci_testing")]
        {
            crate::ci_testing::setup_app(&mut app);
        }

        app
    }
}
```

And let's look `app.add_plugin(MainSchedulePlugin);`. In here, `MainSchedulePlugin` is added.  
`MainSchedulePlugin` is defined like below.

```rust
/// Initializes the [`Main`] schedule, sub schedules,  and resources for a given [`App`].
pub struct MainSchedulePlugin;

impl Plugin for MainSchedulePlugin {
    fn build(&self, app: &mut App) {
        // simple "facilitator" schedules benefit from simpler single threaded scheduling
        let mut main_schedule = Schedule::new();
        main_schedule.set_executor_kind(ExecutorKind::SingleThreaded);
        let mut fixed_update_loop_schedule = Schedule::new();
        fixed_update_loop_schedule.set_executor_kind(ExecutorKind::SingleThreaded);

        app.add_schedule(Main, main_schedule)
            .add_schedule(RunFixedUpdateLoop, fixed_update_loop_schedule)
            .init_resource::<MainScheduleOrder>()
            .add_systems(Main, Main::run_main);
    }
}
```

This `build` function setup some default behavior for Bevy. But let's skip for now and look it later.

Next, dive into `App::add_plugin()`.

```rust
pub fn add_plugin<T>(&mut self, plugin: T) -> &mut Self
where
    T: Plugin,
{
    match self.add_boxed_plugin(Box::new(plugin)) {
        Ok(app) => app,
        Err(AppError::DuplicatePlugin { plugin_name }) => panic!(
            "Error adding plugin {plugin_name}: : plugin was already added in application"
        ),
    }
}

/// Boxed variant of [`add_plugin`](App::add_plugin) that can be used from a [`PluginGroup`]
pub(crate) fn add_boxed_plugin(
    &mut self,
    plugin: Box<dyn Plugin>,
) -> Result<&mut Self, AppError> {
    debug!("added plugin: {}", plugin.name());
    if plugin.is_unique() && !self.plugin_name_added.insert(plugin.name().to_string()) {
        Err(AppError::DuplicatePlugin {
            plugin_name: plugin.name().to_string(),
        })?;
    }
    self.building_plugin_depth += 1;
    let result = catch_unwind(AssertUnwindSafe(|| plugin.build(self)));
    self.building_plugin_depth -= 1;
    if let Err(payload) = result {
        resume_unwind(payload);
    }
    self.plugin_registry.push(plugin);
    Ok(self)
}
```

In `add_boxed_plugin()`, `plugin.build()` is invoked at `let result = catch_unwind(AssertUnwindSafe(|| plugin.build(self)));`.
After invoking `plugin.build()`, `plugin` is registered like `self.plugin_registry.push(plugin);`.

### MainSchedulePlugin::build()

As we just looked, for `MainSchedulePlugin`, `plugin.build()` is defined like below.

```rust
fn build(&self, app: &mut App) {
    // simple "facilitator" schedules benefit from simpler single threaded scheduling
    let mut main_schedule = Schedule::new();
    main_schedule.set_executor_kind(ExecutorKind::SingleThreaded);
    let mut fixed_update_loop_schedule = Schedule::new();
    fixed_update_loop_schedule.set_executor_kind(ExecutorKind::SingleThreaded);

    app.add_schedule(Main, main_schedule)
        .add_schedule(RunFixedUpdateLoop, fixed_update_loop_schedule)
        .init_resource::<MainScheduleOrder>()
        .add_systems(Main, Main::run_main);
}
```

In here, `main_schedule` and `fixed_update_loop_schedule` are instantiated by `Schedule` struct.  
Then, these are set executor as `ExecutorKind::SingleThreaded`.  
This means these schedules are executed on single thread.

What is schedule?  
Schedule is kind of `HashMap`. It stores metadata like `system`. These will be invoked at scheduled time.

Then, `app.add_schedule` method is invoked. `app.add_schedule` method takes `ScheduleLabel` trait and `Schedule` struct.

### ScheduleLabel trait

Bevy has some default struct that implements `ScheduleLabel` trait like the following.

- `Main`
- `PreStartup`
- `Startup`
- `PostStartup`
- `First`
- `PreUpdate`
- `StateTransition`
- `RunFixedUpdateLoop`
- `Update`
- `PostUpdate`
- `Last`

These schedules will be stored in `World`'s `Resource`.

### MainScheduleOrder struct

Next, `MainScheduleOrder` is initialized as resource.

```rust
/// Defines the schedules to be run for the [`Main`] schedule, including
/// their order.
#[derive(Resource, Debug)]
pub struct MainScheduleOrder {
    /// The labels to run for the [`Main`] schedule (in the order they will be run).
    pub labels: Vec<Box<dyn ScheduleLabel>>,
}

impl Default for MainScheduleOrder {
    fn default() -> Self {
        Self {
            labels: vec![
                Box::new(First),
                Box::new(PreUpdate),
                Box::new(StateTransition),
                Box::new(RunFixedUpdateLoop),
                Box::new(Update),
                Box::new(PostUpdate),
                Box::new(Last),
            ],
        }
    }
}
```

That is, this defines orders for scheduling.

### Main::run_main

Next, `app.add_system(Main, Main::run_main)` method is invoked.

`Main::run_main` is defined as following.

```rust
impl Main {
    /// A system that runs the "main schedule"
    pub fn run_main(world: &mut World, mut run_at_least_once: Local<bool>) {
        if !*run_at_least_once {
            let _ = world.try_run_schedule(PreStartup);
            let _ = world.try_run_schedule(Startup);
            let _ = world.try_run_schedule(PostStartup);
            *run_at_least_once = true;
        }

        world.resource_scope(|world, order: Mut<MainScheduleOrder>| {
            for label in &order.labels {
                let _ = world.try_run_schedule(&**label);
            }
        });
    }
}
```

This method executes each schedule step by step.

### Startup

Let's back to entry point.

```rust
fn main() {
    App::new()
        .insert_resource(AmbientLight {
            color: Color::WHITE,
            brightness: 1.0 / 5.0f32,
        })
        .insert_resource(DirectionalLightShadowMap { size: 4096 })
        .add_plugins(DefaultPlugins)
        .add_systems(Startup, setup)
        .add_systems(Update, animate_light_direction)
        .run();
}
```

Next, let's look `app.add_systems(Startup, setup)`.

`setup` is defined as following in same file.

```rust
fn setup(mut commands: Commands, asset_server: Res<AssetServer>) {
    commands.spawn((
        Camera3dBundle {
            transform: Transform::from_xyz(0.7, 0.7, 1.0)
                .looking_at(Vec3::new(0.0, 0.3, 0.0), Vec3::Y),
            ..default()
        },
        EnvironmentMapLight {
            diffuse_map: asset_server.load("environment_maps/pisa_diffuse_rgb9e5_zstd.ktx2"),
            specular_map: asset_server.load("environment_maps/pisa_specular_rgb9e5_zstd.ktx2"),
        },
    ));

    commands.spawn(DirectionalLightBundle {
        directional_light: DirectionalLight {
            shadows_enabled: true,
            ..default()
        },
        // This is a relatively small scene, so use tighter shadow
        // cascade bounds than the default for better quality.
        // We also adjusted the shadow map to be larger since we're
        // only using a single cascade.
        cascade_shadow_config: CascadeShadowConfigBuilder {
            num_cascades: 1,
            maximum_distance: 1.6,
            ..default()
        }
        .into(),
        ..default()
    });
    commands.spawn(SceneBundle {
        scene: asset_server.load("models/FlightHelmet/FlightHelmet.gltf#Scene0"),
        ..default()
    });
}
```

### Commands::spawn()

`commands.spawn()` registers necessary entity like light, camera, and so on. `commands.spawn()` is able to take only struct that implements `Bundle` trait.

```rust
pub fn spawn<'a, T: Bundle>(&'a mut self, bundle: T) -> EntityCommands<'w, 's, 'a> {
    let mut e = self.spawn_empty();
    e.insert(bundle);
    e
}
```

`self.spawn_empty()` creates new `Entity`.

```rust
pub fn spawn_empty<'a>(&'a mut self) -> EntityCommands<'w, 's, 'a> {
    let entity = self.entities.reserve_entity();
    EntityCommands {
        entity,
        commands: self,
    }
}
```

`self.entities.reserve_entity()` reserves entity from freelist concurrently. `self.entities` is shared globally, so Bevy needs to free if there is an unused object.

```rust
pub fn reserve_entity(&self) -> Entity {
    let n = self.free_cursor.fetch_sub(1, Ordering::Relaxed);
    if n > 0 {
        // Allocate from the freelist.
        let index = self.pending[(n - 1) as usize];
        Entity {
            generation: self.meta[index as usize].generation,
            index,
        }
    } else {
        // Grab a new ID, outside the range of `meta.len()`. `flush()` must
        // eventually be called to make it valid.
        //
        // As `self.free_cursor` goes more and more negative, we return IDs farther
        // and farther beyond `meta.len()`.
        Entity {
            generation: 0,
            index: u32::try_from(self.meta.len() as IdCursor - n).expect("too many entities"),
        }
    }
}
```

Then, `Bundle` will be inserted to `CommandsQueue`.

### App::run()

At the end, `App::run()` will be invoked.

```rust
pub fn run(&mut self) {
    #[cfg(feature = "trace")]
    let _bevy_app_run_span = info_span!("bevy_app").entered();

    let mut app = std::mem::replace(self, App::empty());
    if app.building_plugin_depth > 0 {
        panic!("App::run() was called from within Plugin::build(), which is not allowed.");
    }

    Self::setup(&mut app);

    let runner = std::mem::replace(&mut app.runner, Box::new(run_once));
    (runner)(app);
}
```

In this function, `run_once()` is invoked at `(runner)(app)`.

```rust
fn run_once(mut app: App) {
    app.update();
}
```

This invokes only `app.update()`.

```rust
pub fn update(&mut self) {
    #[cfg(feature = "trace")]
    let _bevy_update_span = info_span!("update").entered();
    {
        #[cfg(feature = "trace")]
        let _bevy_main_update_span = info_span!("main app").entered();
        self.world.run_schedule(&*self.main_schedule_label);
    }
    for (_label, sub_app) in self.sub_apps.iter_mut() {
        #[cfg(feature = "trace")]
        let _sub_app_span = info_span!("sub app", name = ?_label).entered();
        sub_app.extract(&mut self.world);
        sub_app.run();
    }

    self.world.clear_trackers();
}
```

Next, `self.world.run_schedule` will be invoked. Also `self.schedule_scope` only retrieves specified `Schedule` by label from `Resource`.

```rust
pub fn run_schedule(&mut self, label: impl AsRef<dyn ScheduleLabel>) {
    self.schedule_scope(label, |world, sched| sched.run(world));
}
```

Then, `sched.run(world)` will be invoked.

```rust
pub fn run(&mut self, world: &mut World) {
    world.check_change_ticks();
    self.initialize(world).unwrap_or_else(|e| panic!("{e}"));
    self.executor.run(&mut self.executable, world);
}
```

This invokes `self.executor.run(&mut self.executable, world)`. `self.executor` has `Box<dyn SystemExecutor>`, so it's able to take some executor type will be like the following.

```rust
fn make_executor(kind: ExecutorKind) -> Box<dyn SystemExecutor> {
    match kind {
        ExecutorKind::Simple => Box::new(SimpleExecutor::new()),
        ExecutorKind::SingleThreaded => Box::new(SingleThreadedExecutor::new()),
        ExecutorKind::MultiThreaded => Box::new(MultiThreadedExecutor::new()),
    }
}
```

In here, let's look `SingleThreadedExecutor` because `Main` labeled schedule is set as `ExecutorKind::SingleThreaded`.

In `sched.run()`, it invokes `self.executor.run()`, also it is `SingleThreadedExecutor` in here, so `SingleThreadedExecutor::run()` will be invoked.

This function will invoke registered system. In this case, `Main::run_main()` will be invoked.
Also in example, `Main::run_main()` invokes `Update` schedule, so `animate_light_direction` will be invoked.

```rust
fn animate_light_direction(
    time: Res<Time>,
    mut query: Query<&mut Transform, With<DirectionalLight>>,
) {
    for mut transform in &mut query {
        transform.rotation = Quat::from_euler(
            EulerRot::ZYX,
            0.0,
            time.elapsed_seconds() * PI / 5.0,
            -FRAC_PI_4,
        );
    }
}
```

This function updates each transform.

## How does window system work on Bevy?

In above example, `DefaultPlugins` is added. it has a `bevy_window::WindowPlugin` that has a window management system by `winit`.

`winit` window management system invokes `App::update` method every frame.

## How is 3D model rendered on Bevy?

To render 3D model in wgpu, Bevy uses `bevy_render::RenderPlugin` in `DefaultPlugins`. Let's look `RenderPlugin::build()`.

This plugin does the following things.

- Manages and caches pipeline for `wgpu`.
- Setup render pipeline for each node.
- Renders a frame.
- Add another plugins for rendering like below.

First, these above processes are setup here.

```rust
render_app
    .add_schedule(ExtractSchedule, extract_schedule)
    .add_schedule(Render, Render::base_schedule())
    .init_resource::<render_graph::RenderGraph>()
    .insert_resource(RenderInstance(instance))
    .insert_resource(PipelineCache::new(device.clone()))
    .insert_resource(device)
    .insert_resource(queue)
    .insert_resource(render_adapter)
    .insert_resource(adapter_info)
    .insert_resource(app.world.resource::<AssetServer>().clone())
    .add_systems(ExtractSchedule, PipelineCache::extract_shaders)
    .add_systems(
        Render,
        (
            // This set applies the commands from the extract schedule while the render schedule
            // is running in parallel with the main app.
            apply_extract_commands.in_set(RenderSet::ExtractCommands),
            (
                PipelineCache::process_pipeline_queue_system.before(render_system),
                render_system,
            )
                .in_set(RenderSet::Render),
            World::clear_entities.in_set(RenderSet::Cleanup),
        ),
    );
```

### Manages and caches pipeline

As you can see, `PipelineCache` has the responsibility for caching pipelines to render a frame.  
`PipelineCache` caches the following things.

- Shaders
- Layouts
- Pipelines

A shader is cached in `PipelineCache::extract_shaders`. When shader is added, a pipeline is also added as waiting pipeline in `PipelineCache::set_shader()`.

```rust
fn set_shader(&mut self, handle: &Handle<Shader>, shader: &Shader) {
    let pipelines_to_queue = self.shader_cache.set_shader(handle, shader.clone());
    for cached_pipeline in pipelines_to_queue {
        self.pipelines[cached_pipeline].state = CachedPipelineState::Queued;
        self.waiting_pipelines.insert(cached_pipeline);
    }
}
```

A layout is retrieved from waiting pipeline in `PipelineCache::process_render_pipeline` or `PipelineCache::process_compute_pipeline` that is invoked in `PipelineCache::process_pipeline_queue_system`. Layout means [a bind group layout](https://docs.rs/wgpu/latest/wgpu/struct.BindGroupLayout.html) provided by wgpu.
A pipeline is created and cached based on layout in `PipelineCache::process_render_pipeline` or `PipelineCache::process_compute_pipeline`.

```rust
fn process_render_pipeline(
    &mut self,
    id: CachedPipelineId,
    descriptor: &RenderPipelineDescriptor,
) -> CachedPipelineState {
    let vertex_module = match self.shader_cache.get(
        // ...
    ) {
        // ...
    };

    let fragment_data = if let Some(fragment) = &descriptor.fragment {
        let fragment_module = match self.shader_cache.get(
            // ...
        ) {
            // ...
        };
        Some(
            // ...
        )
    } else {
        // ...
    };

    // ...

    let layout = if descriptor.layout.is_empty() && descriptor.push_constant_ranges.is_empty() {
        None
    } else {
        Some(self.layout_cache.get(
            // ...
        ))
    };

    let descriptor = RawRenderPipelineDescriptor {
        // ...
        layout,
        // ...
        vertex: RawVertexState {
            buffers: &vertex_buffer_layouts,
            // ...
        },
        fragment: fragment_data
            .as_ref()
            .map(|(module, entry_point, targets)| RawFragmentState {
                entry_point,
                module,
                targets,
            }),
    };

    let pipeline = self.device.create_render_pipeline(&descriptor);

    CachedPipelineState::Ok(Pipeline::RenderPipeline(pipeline))
}
```

### Setup render pipeline for each node

`render_system` function invokes `RenderGraphRunner::run` function first. The function invokes `RenderGraphRunner::run_graph` function. Then `Node::run` function is invoked, however `Node` is trait, so it will be some type of function.  
This function setup a render pass.

### Renders a frame

Then `SurfaceTexture::present()` will be invoked after `RenderGraphRunner::run` in `render_system`. This function is provided by `wgpu`, also it updates a frame on the window.

### Another plugins

```rust
app.add_plugin(ValidParentCheckPlugin::<view::ComputedVisibility>::default())
        .add_plugin(WindowRenderPlugin)
        .add_plugin(CameraPlugin)
        .add_plugin(ViewPlugin)
        .add_plugin(MeshPlugin)
        .add_plugin(GlobalsPlugin);
```

These plugins prepare uniforms related to entity or rendering.
