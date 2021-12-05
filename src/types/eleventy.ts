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

export type EleventyProps = {
  title?: string;
  description?: string;
  content: string;
  page: PageData;
  layout: string; // This property include page name.
  publics?: string[];
  tags?: string[];
  tag?: string;
  collections: Collections;
};

export type EleventyData = Partial<EleventyProps>;
