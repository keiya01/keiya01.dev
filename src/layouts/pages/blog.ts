import { html } from "common-tags";

import {
  loadPageScript,
  loadFeatureScript,
  loadStyle,
} from "../../helpers/subResourceHelper";
import { PageData } from "../../types/eleventy";
import * as style from "./blog.css";

type Props = {
  title: string;
  content: string;
  page: PageData;
  layout: string;
  features: string[] | undefined;
};

export const render = ({
  title,
  content,
  page,
  layout,
  features,
}: Props): string => {
  const pageScript = loadPageScript(layout);
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="${loadStyle(layout)}" />
        ${pageScript &&
        html`<script type="module" src="${pageScript}"></script>`}
        ${features?.map(
          (name) =>
            `<script type="module" src="${loadFeatureScript(name)}"></script>`
        )}
      </head>
      <body class="${style.theme}">
        <main>
          <article class="${style.container}">
            <h1>${title}</h1>
            <time>${page.date}</time>
            ${content}
          </article>
        </main>
      </body>
    </html>
  `;
};
