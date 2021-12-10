import { html } from "common-tags";
import { ORIGIN } from "../../constants/origin";
import {
  loadPageScript,
  loadPublicResource,
  loadPageStyle,
  loadStyle,
} from "../../helpers/subResourceHelper";
import { EleventyProps, EleventyShortCode } from "../../types/eleventy";
import { Header } from "../components/global/Header";

import * as style from "../partials/global.css";

const getOGType = (layout: string) =>
  layout.startsWith("blog") ? "article" : "website";

export const render = async function (
  this: EleventyShortCode,
  {
    layout,
    title,
    content,
    publics,
    description,
    ogImageName,
    ogImageAlt,
  }: EleventyProps
): Promise<string> {
  const globalScript = loadPageScript("global");
  const pageScript = loadPageScript(layout);
  const pageStyle = loadPageStyle(layout);

  const defaultTitle = "blog - Keiya Sasaki";
  const defaultDescription =
    "Web標準やJavaScriptの話題を中心に書いていこうかなと思っています🕸";

  if (ogImageName) {
    await this.writeOGImage({ filename: ogImageName, title });
  }

  return html`<!DOCTYPE html>
    <html lang="ja">
      <head>
        <title>${title || defaultTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="${description || defaultDescription}"
        />
        <meta name="color-scheme" content="dark light" />

        <!-- === OGP meta === -->
        <meta name="og:type" content="${getOGType(layout)}" />
        <meta name="og:url" content="${ORIGIN}/entry/${ogImageName}" />
        <meta name="og:title" content="${title || defaultTitle}" />
        <meta
          name="og:description"
          content="${description || defaultDescription}"
        />
        <meta
          property="og:image"
          content="${ORIGIN}/public/ogp/${ogImageName}.jpg"
        />
        <meta
          property="og:image:alt"
          content="${ogImageAlt || title || defaultTitle}"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title || defaultTitle}" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="${loadStyle("partials/global")}" />
        <link rel="stylesheet" href="${loadStyle(`pages/${layout}`)}" />
        ${pageStyle && html`<link rel="stylesheet" href="${pageStyle}" />`}
        ${publics?.map(
          (path) =>
            html`<link rel="stylesheet" href="${loadPublicResource(path)}" />`
        )}
        ${globalScript &&
        html`<script type="module" src="${globalScript}"></script>`}
        ${pageScript &&
        html`<script type="module" src="${pageScript}"></script>`}
      </head>
      <body>
        ${Header()}
        <div class="${style.wrapper}">${content}</div>
      </body>
    </html>`;
};
