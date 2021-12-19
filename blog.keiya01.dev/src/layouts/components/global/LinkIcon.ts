import { html } from "common-tags";
import { loadPublicResource } from "../../../helpers/subResourceHelper";
import * as style from "./LinkIcon.css";

type Props = {
  href: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  data64?: boolean;
};

export const LinkIcon = ({
  href,
  src,
  alt,
  width,
  height,
  data64,
}: Props): string => {
  return html`
    <a rel="noopener noreferrer" class="${style.icon}" href="${href}">
      <img
        src="${data64 ? src : loadPublicResource(src)}"
        alt="${alt}"
        width="${width}"
        height="${height}"
      />
    </a>
  `;
};
