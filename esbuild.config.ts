import { build, BuildOptions } from "esbuild";
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";
import { copy } from "cpx";

import { getPagePathname } from "./build/esbuild/path";
import { generateManifest } from "./build/esbuild/manifest";

const outputRoot = "./dist";

const run = async () => {
  const libOptions: BuildOptions = {
    format: "esm",
    entryPoints: await getPagePathname("./src/lib"),
    entryNames: "[name].[hash]",
    outdir: `${outputRoot}/site/lib`,
    metafile: true,
    minify: true,
    bundle: true,
  };
  const { metafile: metafileForLib } = await build(libOptions);

  const layoutOptions: BuildOptions = {
    format: "cjs",
    entryPoints: await getPagePathname("./src/layouts"),
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
};

run();
