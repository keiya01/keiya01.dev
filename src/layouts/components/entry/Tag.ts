import { html } from "common-tags";

import * as style from "./Tag.css";

type Props = {
  tag: string;
};

export const Tag = ({ tag }: Props): string => {
  return html`<li class="${style.tagItem}">
    <a class="${style.tagLink}" href="/blog/entries/${tag}">${tag}</a>
  </li>`;
};
