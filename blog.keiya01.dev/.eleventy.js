const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

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
 * ::: picture size=100x200 description="description" src="/public/img/example.png" lazy=false :::
 */
const usePicture = () => {
  const BLOCK_NAME = "picture";

  const properties = {
    size: {
      reg: "\\d+x\\d+",
    },
    description: {
      reg: `".+"`,
    },
    src: {
      reg: `"(\/.+)+"`,
    },
    loading: {
      reg: `eager`,
      optional: true,
    },
  };

  const getEntryMap = (text) => {
    const splitText = text.split(/\s(?=\S+=.+)|\s:::$/).filter(Boolean);
    const name = splitText.shift();
    if (name !== BLOCK_NAME) {
      throw new Error(`${name} is not supported`);
    }

    return splitText.reduce((res, kv) => {
      const [k, v] = kv.split("=");
      return { ...res, [k]: v };
    }, {});
  };

  const match = (text) => {
    const entryMap = getEntryMap(text);

    return Object.keys(properties).every((key) => {
      const prop = properties[key];
      const entry = entryMap[key];

      if (prop.optional && !entry) {
        return true;
      }

      if (!entry) {
        return false;
      }

      return new RegExp(prop.reg).test(entry);
    });
  };

  const options = {
    validate: (params) => match(params.trim()),
    render: (tokens, idx) => {
      const token = tokens[idx];
      if (token.nesting === 1) {
        const {
          size,
          description,
          src,
          loading = "lazy",
        } = getEntryMap(token.info.trim());

        const noExtensionSrc = src.split(".")[0];
        const webpSrc = `${noExtensionSrc}.webp"`;
        const avifSrc = `${noExtensionSrc}.avif"`;

        [webpSrc, avifSrc].map((src) => {
          const path = resolve(__dirname, "." + src.slice(1, -1));
          if (!existsSync(path)) {
            throw new Error(`
Could not found \`${path}\` in contents.
You need to run \`yarn build:img\`.
`);
          }
        });

        // TODO: support multi dimensions
        const [width, height] = size.split("x");

        return `
          <p>
            <picture>
              <source srcset=${avifSrc} type="image/avif" />
              <source srcset=${webpSrc} type="image/webp" />
              <img alt=${description} src=${src} width="${width}" height="${height}" loading=${loading} />
            </picture>
          </p>
        `;
      }
      return "";
    },
  };
  return [BLOCK_NAME, options];
};

MathJax = {
  options: {
    enableAssistiveMml: true,
  },
  loader: {
    paths: { mathjax: "mathjax-full/es5" },
    source: {},
    require: require,
    load: ["adaptors/liteDOM"],
  },
  tex: {
    packages: ["base", "autoload", "require", "ams", "newcommand"],
  },
  startup: {
    typeset: false,
  },
};
require("mathjax-full/es5/tex-chtml");

/** Usage
 * ::: tex
 * \int_0^1 f(x) dx
 * :::
 */
const useTeX = () => {
  const BLOCK_NAME = "tex";
  const options = {
    validate: (params) => {
      return params.trim().match(new RegExp(`^${BLOCK_NAME}$`));
    },
    render: (tokens, idx) => {
      // TODO: use more confidential way
      const text = tokens[idx + 2]?.content || "";
      const node = MathJax.tex2chtml(text, {
        display: false,
      });
      const adaptor = MathJax.startup.adaptor;

      // Remove unnecessary markup
      let i = idx;
      while (true) {
        tokens[i].hidden = true;
        tokens[i].children = [];
        console.log(tokens[i], i);
        if (tokens[i]?.type === "container_tex_close") {
          break;
        }
        i++;
      }

      return text ? adaptor.outerHTML(node) : "";
    },
  };

  return [BLOCK_NAME, options];
};

const useMarkdown = () => {
  const markdownIt = require("markdown-it");
  const anchor = require("markdown-it-anchor");

  const options = {
    html: true,
    breaks: false,
  };
  return markdownIt(options)
    .use(anchor, {
      permalink: anchor.permalink.headerLink(),
    })
    .use(require("markdown-it-container"), ...useTeX())
    .use(require("markdown-it-container"), ...usePicture());
};

module.exports = function (config) {
  config.addPlugin(syntaxHighlight);

  config.addPassthroughCopy({
    public: "./public",
    "public/sw.js": "sw.js",
    "public/manifest.json": "manifest.json",
    "public/_headers": "_headers",
  });

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
