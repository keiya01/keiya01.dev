export type PageData = {
  date: string;
};

export type EleventyProps = {
  title: string;
  content: string;
  page: PageData;
  layout: string;
  features?: string[];
  pageName: string;
  publics?: string[];
  tags?: string[];
};

export type EleventyData = Partial<EleventyProps>;
