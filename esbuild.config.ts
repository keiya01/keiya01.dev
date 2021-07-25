import { build, BuildOptions } from "esbuild";
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";
import { copy } from "cpx";

import { getEntryPathname } from "./build/esbuild/path";
import { generateManifest } from "./build/esbuild/manifest";

const outputRoot = "./dist";

const promiseAllFlat = async <T extends unknown>(
  promises: Promise<T[]>[]
): Promise<T[]> => await Promise.all(promises).then((res) => res.flat());

const run = async () => {
  const libOptions: BuildOptions = {
    format: "esm",
    entryPoints: await promiseAllFlat([
      getEntryPathname("./src/lib/pages"),
      getEntryPathname("./src/lib/features"),
    ]),
    entryNames: "[name].[hash]",
    outdir: `${outputRoot}/site/lib`,
    metafile: true,
    minify: true,
    bundle: true,
  };
  const { metafile: metafileForLib } = await build(libOptions);

  const layoutOptions: BuildOptions = {
    format: "cjs",
    entryPoints: await promiseAllFlat([
      getEntryPathname("./src/layouts/pages"),
      getEntryPathname("./src/layouts/partials"),
    ]),
    entryNames: "[name].[hash].11ty",
    outdir: `${outputRoot}/layouts`,
    platform: "node",
    metafile: true,
    minify: true,
    bundle: true,
    plugins: [vanillaExtractPlugin()],
  };
  const { metafile: metafileForLayout } = await build(layoutOptions);

  await generateManifest({ outputRoot }, metafileForLayout, metafileForLib);

  // copy extracted css to serve css from `site` directory
  copy("./dist/layouts/*.css", "./dist/site/layouts");

  // copy public resource to dist
  copy("./public/**/*", "./dist/site/public");
};

run();
