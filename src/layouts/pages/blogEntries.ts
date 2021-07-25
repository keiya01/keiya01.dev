import { html } from "common-tags";

import { EleventyData, EleventyProps } from "../../types/eleventy";
import { ListItem } from "../components/entry/ListItem";

import * as style from "./blogEntries.css";

export const data: EleventyData = {
  layout: "global",
  features: ["webVitals"],
};

export const render = ({ collections, tag }: EleventyProps): string => {
  const entries = (tag && collections[tag]) || collections.all;

  return html`
    <ul class="${style.list}">
      ${entries.map((entry) =>
        ListItem({
          date: entry.data.page.date,
          description: entry.data.description,
          title: entry.data.title,
          url: entry.url,
          tags: entry.data.tags,
        })
      )}
    </ul>
  `;
};
