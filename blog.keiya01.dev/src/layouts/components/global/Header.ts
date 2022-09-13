import { html } from "common-tags";
import {
  PROFILE_GITHUB_URL,
  PROFILE_TWITTER_URL,
} from "../../../constants/profile";

import * as style from "./Header.css";
import { LinkIcon } from "./LinkIcon";
import "../../../lib/components/global/color-scheme-button.css";
import { ORIGIN } from "../../../constants/origin";

const rssIcon = `<svg aria-label="RSS" height="25" width="25" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>`;

type Props = {
  title?: string;
  titleLink?: string;
};

export const Header = ({
  title = "blog",
  titleLink = "/",
}: Props = {}): string => {
  const icons = [
    LinkIcon({
      href: PROFILE_GITHUB_URL,
      src: "image/github.png",
      alt: "Github",
      width: 25,
      height: 25,
    }),
    LinkIcon({
      href: PROFILE_TWITTER_URL,
      src: "image/twitter.svg",
      alt: "Twitter",
      width: 25,
      height: 25,
    }),
  ];

  return html`
    <header class="${style.header}">
      <nav class="${style.nav}">
        <ul class="${style.list}">
          <li class="${style.titleWrapper}">
            <a class="${style.title}" href="${titleLink}">${title}</a>
          </li>
          ${icons.map((icon) => html`<li class="${style.item}">${icon}</li>`)}
          <li class="${style.item}">
            <a href="${ORIGIN}/feed.xml">${rssIcon}</a>
          </li>
          <li class="${style.item} ${style.schemeButton}">
            <color-scheme-button
              appearance="switch"
              legend="テーマを切り替える"
            ></color-scheme-button>
          </li>
        </ul>
      </nav>
    </header>
  `;
};
