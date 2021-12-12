import { html } from "common-tags";

type Props = {
  slot: string;
};

export const GoogleAd = ({ slot }: Props) => {
  return html`
    <ins
      class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3516148173857150"
      data-ad-slot="${slot}"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  `;
};
