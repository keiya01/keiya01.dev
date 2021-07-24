export type PageData = {
  date: string;
};

export type EleventyProps = {
  title: string;
  content: string;
  page: PageData;
  layout: string;
  features: string[];
  pageName: string;
};

export type EleventyData = Partial<EleventyProps>;
