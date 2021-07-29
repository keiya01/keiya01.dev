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

const useMarkdown = () => {
  const markdownIt = require("markdown-it");
  const prism = require("prismjs");
  const anchor = require("markdown-it-anchor");

  const options = {
    html: true,
    breaks: true,
    highlight: (str, lang) => {
      return prism.highlight(str.trim(), prism.languages[lang], lang);
    },
  };
  return markdownIt(options).use(anchor, {
    permalink: anchor.permalink.headerLink(),
  });
};

module.exports = function (config) {
  config.addPassthroughCopy({ public: "./public" });

  config.setBrowserSyncConfig({
    files: ["dist/**/*"],
  });

  config.setUseGitIgnore(false);
  config.addWatchTarget("./dist/");

  const pages = loadPages();
  Object.values(pages).map((page) => {
    const splitPage = page.split("/");
    const modulePath = splitPage.slice(2).join("/");
    const pagePath = splitPage.slice(3).join("/").split(".")[0];
    console.log(pagePath, modulePath);
    config.addLayoutAlias(pagePath, modulePath);
  });

  config.setLibrary("md", useMarkdown());

  return {
    templateFormats: ["md"],
    dir: {
      input: "src/contents",
      output: "dist/site",
      layouts: "../../dist/layouts",
    },
  };
};
