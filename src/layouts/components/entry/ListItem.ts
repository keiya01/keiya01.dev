import { html } from "common-tags";
import { getFormattedDate } from "../../../utils/date";

import * as style from "./ListItem.css";
import { TagList } from "./TagList";

type Props = {
  title?: string;
  description?: string;
  url: string;
  date: string;
  tags: string[] | undefined;
};

export const ListItem = ({
  date,
  url,
  title,
  tags,
  description,
}: Props): string => {
  return html`
    <li class="${style.item}">
      <article>
        <h3 class="${style.title}">
          <a href="${url}" class="${style.titleLink}">${title}</a>
        </h3>
        <p class="${style.description}">${description}</p>
        <div class="${style.tagList}">${TagList({ tags })}</div>
        <time datetime="${date}" class="${style.date}"
          >${getFormattedDate(date)}</time
        >
      </article>
    </li>
  `;
};
