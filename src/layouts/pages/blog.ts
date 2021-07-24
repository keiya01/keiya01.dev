import { html } from "common-tags";

import { loadScript, loadStyle } from "../../helpers/subResourceHelper";
import { PageData } from "../../types/eleventy";
import * as style from "./blog.css";

type Props = {
  title: string;
  content: string;
  page: PageData;
  layout: string;
  scriptNames: string[] | undefined;
};

export const render = ({
  title,
  content,
  page,
  layout,
  scriptNames,
}: Props): string => html`
  <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="${loadStyle(layout)}" />
      <script type="module" src="${loadScript(layout)}"></script>
      ${scriptNames?.map(
        (name) => `<script type="module" src="${loadScript(name)}"></script>`
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
