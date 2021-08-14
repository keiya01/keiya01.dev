import { copy } from "cpx";
import { readdir, lstat, rename } from "fs/promises";
import { extname } from "path";

export const getEntryPathname = async (root: string): Promise<string[]> => {
  const entries: string[] = [];
  const setEntryPathname = async (dir: string): Promise<void> => {
    const paths = await readdir(dir);
    await Promise.all(
      paths.map(async (path) => {
        const fullPath = `${dir}/${path}`;
        const stats = await lstat(fullPath);
        if (stats.isDirectory()) {
          await setEntryPathname(fullPath);
          return;
        }
        if (fullPath.endsWith(".css.ts")) {
          return;
        }
        entries.push(fullPath);
      })
    );
  };
  await setEntryPathname(root);
  return entries;
};

export const rename11tyCSS = async (root: string): Promise<void> => {
  const recursiveRename = async (path: string) => {
    const dirPaths = await readdir(path);
    await Promise.all(
      dirPaths.map(async (filePath) => {
        const fullPath = `${path}/${filePath}`;
        const stats = await lstat(fullPath);
        if (stats.isDirectory()) {
          await recursiveRename(fullPath);
          return;
        }
        if (fullPath.split(".").slice(-2).join(".") === "11ty.css") {
          const newFileName = `${fullPath
            .split(".")
            .slice(0, -2)
            .join(".")}.css`;
          rename(fullPath, newFileName);
        }
      })
    );
  };
  await recursiveRename(root);
};

export const asyncCopy = (src: string, dest: string): Promise<void> =>
  new Promise((resolve, reject) =>
    copy(src, dest, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  );
