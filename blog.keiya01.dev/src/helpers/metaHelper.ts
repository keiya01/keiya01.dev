type DefaultMeta = {
  title?: string;
  description?: string;
};

export const getMeta = ({ title, description }: DefaultMeta) => ({
  title: `${title || "blog"} - blog.keiya01.dev`,
  description:
    description ||
    "Web標準やJavaScriptの話題を中心に書いていこうかなと思っています🕸",
});
