import { html } from "common-tags";
import {
  PROFILE_GITHUB_URL,
  PROFILE_TWITTER_URL,
} from "../../../constants/profile";

import * as style from "./Header.css";
import { LinkIcon } from "./LinkIcon";
import "../../../lib/components/global/color-scheme-button.css";

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
          <li class="${style.item} ${style.schemeButton}">
            <color-scheme-button
              aria-disabled="true"
              icon-size="24"
              label="テーマを変更する"
            ></color-scheme-button>
          </li>
        </ul>
      </nav>
    </header>
  `;
};
