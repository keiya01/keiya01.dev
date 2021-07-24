import { html } from "common-tags";
import {
  loadFeatureScript,
  loadPageScript,
  loadStyle,
} from "../../helpers/subResourceHelper";
import { EleventyProps } from "../../types/eleventy";

import "../partials/global.css";

export const render = ({
  layout,
  title,
  features,
  content,
}: EleventyProps): string => {
  const pageScript = loadPageScript(layout);

  return html`<!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="${loadStyle("global")}" />
        <link rel="stylesheet" href="${loadStyle(layout)}" />
        ${pageScript &&
        html`<script type="module" src="${pageScript}"></script>`}
        ${features?.map(
          (name) =>
            `<script type="module" src="${loadFeatureScript(name)}"></script>`
        )}
      </head>
      <body>
        ${content}
      </body>
    </html>`;
};
