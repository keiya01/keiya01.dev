import { readdir, stat, writeFile } from "fs/promises";
import { extname, join } from "path";
import { ImagePool } from "@squoosh/lib";

const getAllContentsImagesPath = async (root: string): Promise<string[]> => {
  const paths: string[] = [];
  const setPath = async (path: string) => {
    const dirs = await readdir(path);
    await Promise.all(
      dirs.map(async (filePath) => {
        const fullPath = join(path, filePath);
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          await setPath(fullPath);
          return;
        }
        paths.push(fullPath);
      })
    );
  };
  await setPath(root);
  return paths;
};

export const changeExtension = (path: string, ext: string): string =>
  `${path.split(".")[0]}.${ext}`;

export const transformContentsImages = async (
  target: string
): Promise<void> => {
  const paths = await getAllContentsImagesPath(target);
  const imagePool = new ImagePool();

  // TODO: optimize
  // TODO: check transformed images are created at first call.
  await Promise.all(
    paths.map(async (path) => {
      const avifPath = changeExtension(path, "avif");
      const webpPath = changeExtension(path, "webp");

      const hasAVIF = paths.includes(avifPath);
      const hasWebp = paths.includes(webpPath);

      if (hasAVIF && hasWebp) {
        return;
      }

      const isInitial = !hasAVIF && !hasWebp;

      const isPng = isInitial && extname(path) === ".png";
      const isJpg = isInitial && extname(path) === ".jpg";

      const image = imagePool.ingestImage(path);
      await image.encode({
        avif: !hasAVIF
          ? {
              quality: 80,
            }
          : undefined,
        webp: !hasWebp
          ? {
              quality: 80,
            }
          : undefined,
        oxipng: isPng
          ? {
              quality: 80,
            }
          : undefined,
        mozjpeg: isJpg
          ? {
              quality: 80,
            }
          : undefined,
      });

      if (isPng) {
        const rawEncodedImage = (await image.encodedWith.oxipng).binary;
        writeFile(path, rawEncodedImage);
        console.log(`Compressed ${path}`);
      }

      if (isJpg) {
        const rawEncodedImage = (await image.encodedWith.mozjpeg).binary;
        writeFile(path, rawEncodedImage);
        console.log(`Compressed ${path}`);
      }

      if (!hasAVIF) {
        const rawEncodedImage = (await image.encodedWith.avif).binary;
        writeFile(avifPath, rawEncodedImage);
        console.log(`Transformed ${path} to ${avifPath}`);
      }

      if (!hasWebp) {
        const rawEncodedImage = (await image.encodedWith.webp).binary;
        writeFile(webpPath, rawEncodedImage);
        console.log(`Transformed ${path} to ${webpPath}`);
      }
    })
  );

  await imagePool.close();
};
