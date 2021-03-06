import { html } from "common-tags";

import { EleventyData, EleventyProps } from "../../../types/eleventy";
import { getFormattedDate } from "../../../utils/date";
import { TagList } from "../../components/entry/TagList";

import * as style from "./entry.css";

export const data: EleventyData = {
  layout: "global",
  publics: ["css/prism.min.css"],
};

export const render = ({
  title,
  content,
  page,
  tags,
}: EleventyProps): string => {
  return html`
    <main>
      <article>
        <header>
          <h1 class="${style.title}">${title}</h1>
          <time datetime="${page.date}">${getFormattedDate(page.date)}</time>
          <div class="${style.tagList}">${TagList({ tags })}</div>
        </header>
        <section class="${style.content}">${content}</section>
      </article>
    </main>
  `;
};
