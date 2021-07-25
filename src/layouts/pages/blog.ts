import { html } from "common-tags";

import { EleventyData, EleventyProps } from "../../types/eleventy";
import * as style from "./blog.css";

export const data: EleventyData = {
  layout: "global",
  features: ["webVitals"],
  publics: ["css/prism.css"],
};

export const render = ({
  title,
  content,
  page,
  tags,
}: EleventyProps): string => {
  const date = new Date(page.date);
  const formattedDate = `${date.getFullYear()}-${`${
    date.getMonth() + 1
  }`.padStart(2, "0")}-${date.getDate()}`;

  return html`
    <main>
      <article class="${style.container}">
        <header class="${style.articleHeader}">
          <h1 class="${style.title}">${title}</h1>
          <time datetime="${page.date}">${formattedDate}</time>
          <ul class="${style.tagList}">
            ${tags?.map(
              (tag) =>
                html`<li class="${style.tagItem}">
                  <a class="${style.tagLink}" href="/blog/tags/${tag}"
                    >${tag}</a
                  >
                </li>`
            )}
          </ul>
        </header>
        <section>${content}</section>
      </article>
    </main>
  `;
};
