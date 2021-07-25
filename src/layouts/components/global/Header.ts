import { html } from "common-tags";

import * as style from "./Header.css";
import { LinkIcon } from "./LinkIcon";

type Props = {
  title?: string;
  titleLink?: string;
};

export const Header = ({
  title = "blog",
  titleLink = "/blog/entries",
}: Props = {}): string => {
  const icons = [
    LinkIcon({
      href: "https://github.com/keiya01",
      src: "png/github.png",
      alt: "Github",
      width: 25,
      height: 25,
    }),
    LinkIcon({
      href: "https://twitter.com/_keiya01",
      src: "svg/twitter.svg",
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
        </ul>
      </nav>
    </header>
  `;
};
