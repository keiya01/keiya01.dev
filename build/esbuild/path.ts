import { readdir, lstat } from "fs/promises";

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
