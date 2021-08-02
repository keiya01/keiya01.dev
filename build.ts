import { build as esbuild, BuildOptions } from "esbuild";
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";

import {
  asyncCopy,
  getEntryPathname,
  rename11tyCSS,
} from "./build/esbuild/path";
import { generateManifest } from "./build/esbuild/manifest";
import { transformContentsImages } from "./build/image/transform";

const outputRoot = "./dist";

const isProduction = process.env.NODE_ENV === "production";
const shouldWatch = process.env.ESBUILD_SHOULD_WATCH === "true";

const promiseAllFlat = async <T extends unknown>(
  promises: Promise<T[]>[]
): Promise<T[]> => await Promise.all(promises).then((res) => res.flat());

const build = async () => {
  const libOptions: BuildOptions = {
    format: "esm",
    entryPoints: await promiseAllFlat([
      getEntryPathname("./src/lib/pages"),
      getEntryPathname("./src/lib/features"),
    ]),
    entryNames: isProduction ? "[dir]/[name].[hash]" : undefined,
    outdir: `${outputRoot}/site/lib`,
    metafile: true,
    minify: true,
    bundle: true,
    watch: shouldWatch,
  };
  const { metafile: metafileForLib } = await esbuild(libOptions);

  const layoutOptions: BuildOptions = {
    format: "cjs",
    entryPoints: await promiseAllFlat([
      getEntryPathname("./src/layouts/pages"),
      getEntryPathname("./src/layouts/partials"),
    ]),
    entryNames: isProduction ? "[dir]/[name].[hash].11ty" : "[dir]/[name].11ty",
    outdir: `${outputRoot}/layouts`,
    platform: "node",
    metafile: true,
    minify: true,
    bundle: true,
    watch: shouldWatch,
    plugins: [vanillaExtractPlugin()],
  };
  const { metafile: metafileForLayout } = await esbuild(layoutOptions);

  Promise.all([
    generateManifest({ outputRoot }, metafileForLayout, metafileForLib),
    rename11tyCSS("./dist/layouts"),
    // copy extracted css to serve css from `site` directory
    asyncCopy("./dist/layouts/**/*.css", "./dist/site/layouts"),
  ]);
};

const run = async () => {
  await Promise.all([build(), transformContentsImages("./public/contents")]);
};

run();
