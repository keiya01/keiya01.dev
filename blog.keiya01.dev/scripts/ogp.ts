import { writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import { existsSync } from "fs";
import path from "path";
import init, {
  OGImageWriter,
  WindowStyle,
  Style,
  Rgba,
  AlignItems,
  JustifyContent,
  FontContext,
  ImageOutputFormat,
  ImageOutputFormatOption,
  Margin,
  Position,
  WordBreak,
} from "og_image_writer";

const module = readFileSync(
  path.resolve(__dirname, "../../node_modules/og_image_writer/wasm_bg.wasm")
);

const mplus1 = Uint8Array.from(
  readFileSync(path.resolve(__dirname, "../../public/fonts/Mplus1-Black.ttf"))
);

const robot = Uint8Array.from(
  readFileSync(path.resolve(__dirname, "../../public/fonts/Roboto-Light.ttf"))
);

export const generateOGImage = async (
  outDir: string,
  filename: string,
  data: { title: string; username: string }
) => {
  (global as unknown as any).fetch = () => {
    // do nothing
  };
  await init(module);

  const h = 630;
  const w = 1200;

  const windowStyle = WindowStyle.new();
  windowStyle.height = h;
  windowStyle.width = w;
  windowStyle.background_color = Rgba.new(30, 0, 54, 255);
  windowStyle.align_items = AlignItems.Center;
  windowStyle.justify_content = JustifyContent.Center;
  const writer = OGImageWriter.new(windowStyle);

  const fontContext = FontContext.new();
  fontContext.push(mplus1);

  const titleStyle = Style.new();
  titleStyle.font_size = 100;
  titleStyle.color = Rgba.new(255, 255, 255, 255);
  titleStyle.margin = Margin.new(0, 20, 0, 20);
  titleStyle.max_height = h * 0.5;
  titleStyle.word_break = WordBreak.BreakAll;
  titleStyle.text_overflow = "...";
  titleStyle.line_height = 2;
  writer.set_text(data.title, titleStyle);

  const usernameStyle = Style.new();
  usernameStyle.font_size = 70;
  usernameStyle.color = Rgba.new(255, 255, 255, 255);
  usernameStyle.position = Position.Absolute;
  usernameStyle.bottom = 50;
  usernameStyle.right = 50;
  writer.set_text(data.username, usernameStyle, robot);

  writer.paint();

  const ops = ImageOutputFormatOption.new();
  ops.q = 90;

  const vec = writer.encode(ImageOutputFormat.Jpeg, ops);

  if (!existsSync(outDir)) {
    await mkdir(outDir, { recursive: true });
  }

  await writeFile(`${outDir}/${filename}`, Buffer.from(vec));
};
