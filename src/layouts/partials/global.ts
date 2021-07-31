import { html } from "common-tags";
import {
  loadFeatureScript,
  loadPageScript,
  loadPublicResource,
  loadPageStyle,
  loadStyle,
} from "../../helpers/subResourceHelper";
import { EleventyProps } from "../../types/eleventy";
import { Header } from "../components/global/Header";

import * as style from "../partials/global.css";

export const render = ({
  layout,
  title,
  features,
  content,
  publics,
  description,
}: EleventyProps): string => {
  const globalScript = loadPageScript("global");
  const pageScript = loadPageScript(layout);
  const pageStyle = loadPageStyle(layout);

  return html`<!DOCTYPE html>
    <html lang="ja">
      <head>
        <title>${title || "blog - Keiya Sasaki"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="${description ||
          "Web標準やJavaScriptの話題を中心に書いていこうかなと思っています🕸"}"
        />
        <meta name="color-scheme" content="dark light" />
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
        ${features?.map(
          (name) =>
            `<script type="module" src="${loadFeatureScript(name)}"></script>`
        )}
      </head>
      <body>
        ${Header()}
        <div class="${style.wrapper}">${content}</div>
      </body>
    </html>`;
};
