import { html } from "common-tags";
import { loadScript } from "../../helpers/subResourceHelper";
import { PageData } from "../../types/eleventy";

type Props = {
  title: string;
  content: string;
  page: PageData;
  scriptNames: string[];
};

export const render = ({
  title,
  content,
  page,
  scriptNames,
}: Props): string => html`
  <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
      ${scriptNames.map(
        (name) => `<script type="module" src="${loadScript(name)}"></script>`
      )}
    </head>
    <body>
      <h1>${title}</h1>
      <time>${page.date}</time>
      ${content}
    </body>
  </html>
`;
