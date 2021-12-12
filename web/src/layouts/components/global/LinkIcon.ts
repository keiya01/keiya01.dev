import { html } from "common-tags";
import { loadPublicResource } from "../../../helpers/subResourceHelper";

type Props = {
  href: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const LinkIcon = ({ href, src, alt, width, height }: Props): string => {
  return html`
    <a rel="noopener noreferrer" href="${href}">
      <img
        src="${loadPublicResource(src)}"
        alt="${alt}"
        width="${width}"
        height="${height}"
      />
    </a>
  `;
};
