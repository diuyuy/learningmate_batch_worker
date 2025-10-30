import { BadRequestException, Injectable } from '@nestjs/common';
import { AiService } from 'src/ai/ai.service';
import { BATCH_OPTIONS } from 'src/constants/batch-options';
import { ERROR_MESSAGE } from 'src/constants/error-message';
import { PrismaService } from 'src/prisma/prisma.service';
import { BM25Service } from './bm25.service';
import { BraveSearchService } from './brave-search.service';
import { CrawlingService } from './crawling.service';
import { createConceptPrompts } from './prompts/create-concept-prompts';
import { createExamplePrompts } from './prompts/create-example-prompts';
import { createQuizzesPrompts } from './prompts/create-quizzes-propmts';
import { createSummaryPrompts } from './prompts/create-summary-prompts';
import { articleSchema, quizArraySchema } from './schemas/schemas';
import { KeywordInfo } from './types/types';

@Injectable()
export class BatchService {
  constructor(
    private readonly braveSearchService: BraveSearchService,
    private readonly crawlingService: CrawlingService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateContents(keywordId: bigint) {
    const keywordInfo = await this.findKeyword(keywordId);

    const prompts = await this.createPrompts(keywordInfo);

    const articles = await this.generateArticles(keywordId, prompts);
  }

  private async findKeyword(keywordId: bigint) {
    const keyword = await this.prismaService.keyword.findUnique({
      select: {
        name: true,
        description: true,
        Article: {
          select: {
            id: true,
          },
        },
      },
      where: {
        id: keywordId,
      },
    });

    if (!keyword)
      throw new BadRequestException(ERROR_MESSAGE.KEYWORD_NOT_FOUND);

    return { name: keyword.name, description: keyword.description };
  }

  private async generateRelatedData(keywordInfo: KeywordInfo) {
    const query = this.generateQuery(keywordInfo);

    const searchResults = await this.braveSearchService.searchByKeyword(query);

    const crawledArr = await Promise.all(
      searchResults.map(async (result) => {
        return this.crawlingService.crawlWebsite(result);
      }),
    );

    const validDocs = crawledArr
      .filter((data) => data !== null)
      .map(({ title, texts }) => ({ title, content: texts.join('\n') }))
      .filter(
        ({ content }) =>
          content.length <= BATCH_OPTIONS.MAX_TEXT_LENGTH_FOR_BM25,
      );

    const bm25Service = new BM25Service(validDocs);

    const mostRelatedDocs = bm25Service
      .search(query)
      .map(({ document }) => document);

    return JSON.stringify(mostRelatedDocs);
  }

  private async createPrompts(keywordInfo: KeywordInfo) {
    const relatedData = await this.generateRelatedData(keywordInfo);

    return [
      createConceptPrompts(
        keywordInfo.name,
        keywordInfo.description,
        relatedData,
      ),
      createExamplePrompts(
        keywordInfo.name,
        keywordInfo.description,
        relatedData,
      ),
    ];
  }

  private async generateArticles(keywordId: bigint, prompts: string[]) {
    const articles = await Promise.all(
      prompts.map((prompt) => {
        return this.aiService.generateObjFromAi(
          'gemini',
          prompt,
          articleSchema,
        );
      }),
    );

    const summaries = await Promise.all(
      articles.map((article) => {
        return this.aiService.generateTextFromAi(
          'gemini',
          createSummaryPrompts(article.content),
        );
      }),
    );

    return articles.map((article, idx) => ({
      ...article,
      summary: summaries[idx],
      publishedAt: new Date(),
    }));
  }

  private async generateQuizzes(keywordId: bigint) {
    const articles = await this.prismaService.article.findMany({
      where: {
        keywordId,
      },
    });

    await this.prismaService.$transaction(async (prisma) => {
      const quizzes = await Promise.all(
        articles.map(async (article) => {
          return {
            ...(await this.aiService.generateObjFromAi(
              'gemini',
              createQuizzesPrompts(article.content),
              quizArraySchema,
            )),
            articleId: article.id,
          };
        }),
      );

      await Promise.all(
        quizzes.map(async ({ articleId, quizzes }) => {
          for (const { answer, ...rest } of quizzes) {
            await prisma.quiz.create({
              data: { ...rest, answer: String(answer), articleId },
            });
          }
        }),
      );
    });
  }

  private generateQuery(keywordInfo: KeywordInfo) {
    console.log(`${keywordInfo.name} ${keywordInfo.description}`);
    return `${keywordInfo.name} ${keywordInfo.description}`;
  }

  private async isDataExists(keywordId: bigint) {
    const articles = await this.prismaService.article.findMany({
      select: {
        id: true,
        Quiz: {
          select: {
            id: true,
          },
        },
      },
      where: {
        keywordId,
      },
    });

    if (articles.length > 0) {
      return true; //TODO: Quiz 관련 고민 필요.
    }
  }
}
