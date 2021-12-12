import { html } from "common-tags";

import { Tag } from "./Tag";
import * as style from "./TagList.css";

type Props = {
  tags: string[] | undefined;
};

export const TagList = ({ tags }: Props): string => {
  return html` <ul class="${style.tagList}">
    ${tags?.map((tag) => Tag({ tag }))}
  </ul>`;
};
