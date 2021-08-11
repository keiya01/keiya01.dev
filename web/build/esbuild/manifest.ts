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

const getModuleName = (entryPoint: string): manifest.AcceptableModuleNames => {
  const isLayoutPages =
    entryPoint.startsWith("src/layouts/pages") ||
    entryPoint.startsWith("src/layouts/partials");

  if (isLayoutPages) {
    return "pages";
  }

  const splitEntryPoint = entryPoint.split("/");
  const isSiteModules = entryPoint.startsWith("dist/site");

  if (isSiteModules) {
    return splitEntryPoint[2] as manifest.AcceptableModuleNames;
  }

  const moduleName = splitEntryPoint[1] as manifest.AcceptableModuleNames;
  if (AcceptableModuleNames.includes(moduleName)) {
    return moduleName;
  }

  throw new Error(`${moduleName} is not accepted as entry point`);
};

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

        const moduleName = getModuleName(formattedEntryPoint);

        manifest[moduleName] = {
          ...(manifest[moduleName] || {}),
          [formattedEntryPoint]: hashedEntryPoint,
        };
      }
    );
  });

  await writeFile(`${outputRoot}/manifest.json`, JSON.stringify(manifest));
};
