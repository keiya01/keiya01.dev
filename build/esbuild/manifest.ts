import { Metafile } from "esbuild";
import { writeFile } from "fs/promises";

type Options = {
  outputRoot: string;
};

const AcceptableModuleNames: manifest.AcceptableModuleNames[] = [
  "layouts",
  "lib",
  "pages",
];

export const generateManifest = async (
  { outputRoot }: Options,
  ...metafiles: (Metafile | undefined)[]
): Promise<void> => {
  const manifest: manifest.Manifest = {};
  metafiles.map((metafile) => {
    if (!metafile) {
      return;
    }
    Object.entries(metafile.outputs || {}).map(
      ([hashedEntryPoint, { entryPoint }]) => {
        let formattedEntryPoint = entryPoint;

        const isCSS = hashedEntryPoint.endsWith(".css");
        if (isCSS) {
          formattedEntryPoint = hashedEntryPoint.split(".")[0] + ".css";
        }

        if (!formattedEntryPoint) {
          return;
        }

        const isLayoutPages =
          formattedEntryPoint.startsWith("src/layouts/pages") ||
          formattedEntryPoint.startsWith("src/layouts/partials");

        const moduleName = (
          isLayoutPages ? "pages" : formattedEntryPoint.split("/")[1]
        ) as manifest.AcceptableModuleNames;

        if (
          !AcceptableModuleNames.includes(
            moduleName as manifest.AcceptableModuleNames
          )
        ) {
          throw new Error(`${moduleName} is not accepted as entry point`);
        }

        manifest[moduleName] = {
          ...(manifest[moduleName] || {}),
          [formattedEntryPoint]: hashedEntryPoint,
        };
      }
    );
  });

  await writeFile(`${outputRoot}/manifest.json`, JSON.stringify(manifest));
};
