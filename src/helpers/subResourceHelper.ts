import { readFileSync } from "fs";
import { resolve } from "path";
import {
  LAYOUT_ENTRY_POINT,
  LIB_FEATURE_ENTRY_POINT,
  LIB_PAGE_ENTRY_POINT,
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

const getOutputPath = (
  moduleName: manifest.AcceptableModuleNames,
  entryPoint: string
): string | undefined => {
  const manifest = loadManifest();

  const outputPath = manifest[moduleName]?.[entryPoint];
  if (!outputPath) {
    return;
  }

  const splitOutputPath = outputPath.split("/");
  const hashedEntryPointName = splitOutputPath[splitOutputPath.length - 1];

  return `/${moduleName}/${hashedEntryPointName}`;
};

export const loadPageScript = (pageName: string): string | undefined => {
  const entryPoint = `${LIB_PAGE_ENTRY_POINT}/${pageName}.ts`;
  return getOutputPath("lib", entryPoint);
};

export const loadFeatureScript = (pageName: string): string => {
  const entryPoint = `${LIB_FEATURE_ENTRY_POINT}/${pageName}.ts`;

  const outputPath = getOutputPath("lib", entryPoint);
  if (!outputPath) {
    throw new Error(`Could not found ${pageName} feature script`);
  }
  return outputPath;
};

export const loadStyle = (pageName: string): string => {
  const entryPoint = `${LAYOUT_ENTRY_POINT}/${pageName}.css`;

  const outputPath = getOutputPath("layouts", entryPoint);
  if (!outputPath) {
    throw new Error(`Could not found ${pageName} style`);
  }
  return outputPath;
};

export const loadPublicResource = (filename: string): string => {
  return `/public/${filename}`;
};
