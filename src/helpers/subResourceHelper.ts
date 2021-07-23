import { readFileSync } from "fs";
import { resolve } from "path";
import { LIB_ENTRY_POINT, OUTPUT_DIST_DIR } from "../constants/foundation";

const loadJSON = <T extends unknown>(filePath: string): T => {
  return JSON.parse(readFileSync(filePath, "utf8"));
};

const loadManifest = (): Record<string, string> => {
  return loadJSON(resolve(__dirname, `../../${OUTPUT_DIST_DIR}/manifest.json`));
};

export const loadScript = (pageName: string): string => {
  const entryPoint = `${LIB_ENTRY_POINT}/${pageName}.ts`;

  const manifest = loadManifest();

  const outputPath = manifest[entryPoint];

  const splitOutputPath = outputPath.split("/");
  const hashedEntryPointName = splitOutputPath[splitOutputPath.length - 1];

  return `/lib/${hashedEntryPointName}`;
};
