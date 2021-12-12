declare module "@squoosh/lib" {
  type ImageType = "mozjpeg" | "oxipng" | "webp" | "avif";
  type Image = {
    preprocess: (options?: {
      resize: {
        enabled: boolean;
        width: number;
        height: number;
      };
    }) => Promise<void>;
    encode: (
      options: {
        [K in ImageType]?: {
          quality: number;
        };
      }
    ) => Promise<void>;
    encodedWith: {
      [K in ImageType]: Promise<{
        binary: Uint8Array;
      }>;
    };
  };
  export class ImagePool {
    ingestImage(path: string): Image;
    close(): Promise<void>;
  }
}
