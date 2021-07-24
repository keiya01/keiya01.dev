import { html } from "common-tags";

import { EleventyData, EleventyProps } from "../../types/eleventy";
import * as style from "./blog.css";

export const data: EleventyData = {
  layout: "global",
  features: ["webVitals"],
};

export const render = ({ title, content, page }: EleventyProps): string => {
  return html`
    <main>
      <article class="${style.container}">
        <h1>${title}</h1>
        <time>${page.date}</time>
        ${content}
      </article>
    </main>
  `;
};
