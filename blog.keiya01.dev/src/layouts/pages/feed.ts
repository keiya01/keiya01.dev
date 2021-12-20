import RSS from "rss";
import { ORIGIN } from "../../constants/origin";
import { getMeta } from "../../helpers/metaHelper";

import { EleventyProps } from "../../types/eleventy";

export const render = ({ collections }: EleventyProps): string => {
  const entries = collections.all;
  const meta = getMeta();
  const rss = new RSS({
    title: meta.title,
    description: meta.description,
    site_url: ORIGIN,
    feed_url: `${ORIGIN}/atom.xml`,
    language: "ja",
  });

  entries
    .sort((a, b) =>
      Date.parse(a.data.page.date) < Date.parse(b.data.page.date) ? 1 : -1
    )
    .map((entry) =>
      rss.item({
        title: entry.data.title || "",
        description: entry.data.description || "",
        date: entry.data.page.date,
        url: `${ORIGIN}${entry.data.page.url}`,
      })
    );

  return rss.xml();
};
