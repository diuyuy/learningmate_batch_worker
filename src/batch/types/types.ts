export type SearchResult = {
  title: string;
  url: string;
  description: string;
};

export type CrawlResult = {
  title: string;
  texts: string[];
};

export type BM25Config = {
  k1: number;
  b: number;
};

export type CrawledDocument = {
  title: string;
  content: string;
};

export type BatchQueueData = {
  keywordId: string;
};

export type BatchQueueReturnType = {
  success: boolean;
};

export type KeywordInfo = {
  name: string;
  description: string;
};
