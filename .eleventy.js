const { readFileSync } = require("fs");
const { resolve } = require("path");

const loadJSON = (filePath) => {
  return JSON.parse(readFileSync(filePath, "utf8"));
};

let _Pages = null;
const loadPages = () => {
  if (_Pages) {
    return _Pages;
  }
  _Pages = loadJSON(resolve(__dirname, "./dist/manifest.json")).pages;
  return _Pages;
};

const minifyHTML = (content, outputPath) => {
  if (outputPath && outputPath.endsWith(".html")) {
    let minified = require("html-minifier").minify(content, {
      removeComments: true,
      collapseInlineTagWhitespace: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeAttributeQuotes: true,
    });
    return minified;
  }

  return content;
};

/** Usage
 * ::: picture 100x200 "description" "/public/img/example.png" :::
 */
const usePicture = () => {
  const match = (text) =>
    text.match(/^picture\s(\d+x\d+)\s(".+")\s(".+")\s:::$/);
  const options = {
    validate: (params) => match(params.trim()),
    render: (tokens, idx) => {
      const token = tokens[idx];
      if (token.nesting === 1) {
        const [, size, description, src] = match(token.info.trim());

        const noExtensionSrc = src.split(".")[0];
        const webpSrc = `${noExtensionSrc}.webp"`;
        const avifSrc = `${noExtensionSrc}.avif"`;

        const [width, height] = size.split("x");

        return `
          <p>
            <picture>
              <source srcset=${avifSrc} type="image/avif" />
              <source srcset=${webpSrc} type="image/webp" />
              <img alt=${description} src=${src} width="${width}" height="${height}" />
            </picture>
          </p>
        `;
      }
      return "";
    },
  };
  return ["picture", options];
};

const useMarkdown = () => {
  const markdownIt = require("markdown-it");
  const prism = require("prismjs");
  const anchor = require("markdown-it-anchor");
  const container = require("markdown-it-container");

  const options = {
    html: true,
    breaks: true,
    highlight: (str, lang) => {
      return prism.highlight(str.trim(), prism.languages[lang], lang);
    },
  };
  return markdownIt(options)
    .use(anchor, {
      permalink: anchor.permalink.headerLink(),
    })
    .use(container, ...usePicture());
};

module.exports = function (config) {
  config.addPassthroughCopy({ public: "./public" });

  config.setBrowserSyncConfig({
    files: ["dist/**/*"],
  });

  config.setUseGitIgnore(false);

  config.addWatchTarget("./dist/");

  config.addTransform("htmlmin", minifyHTML);

  config.setLibrary("md", useMarkdown());

  const pages = loadPages();
  Object.values(pages).map((page) => {
    const splitPage = page.split("/");
    const modulePath = splitPage.slice(2).join("/");
    const pagePath = splitPage.slice(3).join("/").split(".")[0];
    console.log(pagePath, modulePath);
    config.addLayoutAlias(pagePath, modulePath);
  });

  return {
    templateFormats: ["md"],
    dir: {
      input: "src/contents",
      output: "dist/site",
      layouts: "../../dist/layouts",
    },
  };
};
