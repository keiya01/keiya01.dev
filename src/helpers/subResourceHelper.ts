import { readFileSync } from "fs";
import { resolve } from "path";
import {
  LAYOUT_ENTRY_POINT,
  LIB_ENTRY_POINT,
  OUTPUT_DIST_DIR,
} from "../constants/foundation";

const loadJSON = <T extends unknown>(filePath: string): T => {
  return JSON.parse(readFileSync(filePath, "utf8"));
};

let Manifest: manifest.Manifest | null = null;
export const loadManifest = (): manifest.Manifest => {
  if (Manifest) {
    return Manifest;
  }
  const path = resolve(__dirname, `../../${OUTPUT_DIST_DIR}/manifest.json`);
  Manifest = loadJSON(path);
  if (!Manifest) {
    throw new Error(`Could not found manifest.json in ${path}`);
  }
  return Manifest;
};

export const loadScript = (pageName: string): string => {
  const entryPoint = `${LIB_ENTRY_POINT}/${pageName}.ts`;

  const manifest = loadManifest();

  const outputPath = manifest.lib?.[entryPoint];

  if (outputPath) {
    const splitOutputPath = outputPath.split("/");
    const hashedEntryPointName = splitOutputPath[splitOutputPath.length - 1];

    return `/lib/${hashedEntryPointName}`;
  }

  throw new Error(`Could not found ${pageName} script`);
};

export const loadStyle = (pageName: string): string => {
  const entryPoint = `${LAYOUT_ENTRY_POINT}/${pageName}.css`;

  const manifest = loadManifest();

  const outputPath = manifest.layouts?.[entryPoint];

  if (outputPath) {
    const splitOutputPath = outputPath.split("/");
    const hashedEntryPointName = splitOutputPath[splitOutputPath.length - 1];

    return `/layouts/${hashedEntryPointName}`;
  }

  throw new Error(`Could not found ${pageName} style`);
};
