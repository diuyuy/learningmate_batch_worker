import { BM25Config, CrawledDocument } from './types/types';

export class BM25Service {
  private documents: CrawledDocument[];
  private config: BM25Config;
  private avgDocLength: number;
  private docLengths: Map<string, number>; //docTitle -> docLength
  private termFrequencies: Map<string, Map<string, number>>; // docTitle -> term -> frequency
  private documentCntsHasTerm: Map<string, number>; // term -> number of docs containing term
  private idfCache: Map<string, number>;
  constructor(
    documents: CrawledDocument[],
    config: Partial<BM25Config> = { k1: 1.5 },
  ) {
    this.documents = documents;
    this.config = {
      k1: config.k1 ?? 1.5,
      b: config.b ?? 0.75,
    };
    this.docLengths = new Map();
    this.termFrequencies = new Map();
    this.documentCntsHasTerm = new Map();
    this.idfCache = new Map();
    this.avgDocLength = 0;

    this.initialize();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  private initialize(): void {
    let totalLength = 0;

    for (const doc of this.documents) {
      const tokens = this.tokenize(doc.content);
      const docLength = tokens.length;

      this.docLengths.set(doc.title, docLength);
      totalLength += docLength;

      //용어 빈도 계산
      const termFreq = new Map<string, number>();
      for (const token of tokens) {
        termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
      }
      this.termFrequencies.set(doc.title, termFreq);

      //특정 용어를 갖고 있는 문서 수 계산
      const uniqueTerms = new Set(tokens);
      for (const term of uniqueTerms) {
        this.documentCntsHasTerm.set(
          term,
          this.documentCntsHasTerm.get(term) ?? 0 + 1,
        );
      }
    }

    // 평균 문서 길이 계산
    this.avgDocLength = totalLength / this.documents.length;
  }

  private calculateIDF(term: string): number {
    if (this.idfCache.has(term)) {
      return this.idfCache.get(term)!;
    }

    const N = this.documents.length; // 문서의 총 개수
    const df = this.documentCntsHasTerm.get(term) ?? 0; // term 을 갖고 있는 문서 개수

    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    this.idfCache.set(term, idf);

    return idf;
  }

  private caculateScore(title: string, queryTerm: string[]): number {
    const docLength = this.docLengths.get(title) ?? 0;
    const termFreq = this.termFrequencies.get(title);

    if (!termFreq) return 0;

    let score = 0;

    const { k1, b } = this.config;

    for (const term of queryTerm) {
      const tf = termFreq.get(term) ?? 0;
      if (tf === 0) continue;

      const idf = this.calculateIDF(term);

      const numerator = tf * (k1 + 1);
      const denominator =
        tf + k1 * (1 - b + b * (docLength / this.avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  search(query: string, topK: number = 7) {
    const queryTerms = this.tokenize(query);

    const results = this.documents.map((doc) => ({
      document: doc,
      score: this.caculateScore(doc.title, queryTerms),
    }));

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((result) => result.score > 0);
  }
}
