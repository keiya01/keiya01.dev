import { build, BuildOptions, Metafile } from "esbuild";
import { writeFile } from "fs/promises";

import { getPagePathname } from "./build/esbuild/path";

const outputRoot = "./dist";

const generateManifest = async (metafile: Metafile | undefined) => {
  const manifest: Record<string, string> = {};
  Object.entries(metafile?.outputs || {}).map(
    ([hashedEntryPoint, { entryPoint }]) => {
      if (entryPoint) {
        manifest[entryPoint] = hashedEntryPoint;
      }
    }
  );
  await writeFile(`${outputRoot}/manifest.json`, JSON.stringify(manifest));
};

const run = async () => {
  const libOptions: BuildOptions = {
    format: "esm",
    entryPoints: await getPagePathname("./src/lib"),
    entryNames: "[name]-[hash]",
    outdir: `${outputRoot}/site/lib`,
    metafile: true,
    minify: true,
    bundle: true,
  };
  build(libOptions).then(async ({ metafile }) => generateManifest(metafile));

  const layoutOptions: BuildOptions = {
    format: "cjs",
    entryPoints: await getPagePathname("./src/layouts"),
    outdir: `${outputRoot}/layouts`,
    platform: "node",
    minify: false,
    bundle: true,
  };
  build(layoutOptions);
};

run();
