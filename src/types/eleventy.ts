type PageData = {
  date: string;
};

type Collection = {
  url: string;
  data: EleventyProps;
};

type Collections = {
  [key: string]: Collection[];
  all: Collection[];
};

type RenderData = {
  title?: string;
};

export type EleventyShortCode = {
  writeOGImage: (props: { filename?: string; title?: string }) => Promise<void>;
};

export type EleventyProps = {
  title?: string;
  description?: string;
  ogImageName?: string;
  content: string;
  page: PageData;
  layout: string; // This property include page name.
  publics?: string[];
  tags?: string[];
  tag?: string;
  collections: Collections;
  ogImageAlt?: string;
  modified?: string;
  renderData?: RenderData;
};

export type EleventyData = Partial<EleventyProps>;
