import { readdir, lstat } from "fs/promises";

export const getPagePathname = async (root: string): Promise<string[]> => {
  const pages: string[] = [];
  const setPagePathname = async (dir: string): Promise<void> => {
    const paths = await readdir(dir);
    await Promise.all(
      paths.map(async (path) => {
        const fullPath = `${dir}/${path}`;
        const stats = await lstat(fullPath);
        if (stats.isDirectory()) {
          await setPagePathname(fullPath);
          return;
        }
        pages.push(fullPath);
      })
    );
  };
  await setPagePathname(root);
  return pages;
};
