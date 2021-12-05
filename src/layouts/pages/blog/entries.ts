import { html } from "common-tags";
import { PROFILE_TWITTER_URL } from "../../../constants/profile";

import { EleventyData, EleventyProps } from "../../../types/eleventy";
import { ListItem } from "../../components/entry/ListItem";
import { Thumbnail } from "../../components/global/Thumbnail";

import * as style from "./entries.css";

export const data: EleventyData = {
  layout: "global",
};

export const render = ({ collections, tag }: EleventyProps): string => {
  const entries = (tag && collections[tag]) || collections.all;

  return html`
    <aside>
      <div class="${style.profile}">
        <span class="${style.thumbnail}">${Thumbnail()}</span>
        <div class="${style.profileContent}">
          <span class="${style.profileLabel}">Author</span>
          <a
            rel="noopener noreferrer"
            href="${PROFILE_TWITTER_URL}"
            class="${style.profileName}"
          >
            Keiya Sasaki
          </a>
        </div>
      </div>
    </aside>
    <main>
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
    </main>
  `;
};
