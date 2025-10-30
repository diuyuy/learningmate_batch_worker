import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { Injectable } from '@nestjs/common';
import { generateObject, generateText } from 'ai';
import { ZodObject } from 'zod';
import { $ZodType, $ZodTypeInternals } from 'zod/v4/core';
import { ModelProvider } from './types/types';

@Injectable()
export class AiService {
  async generateTextFromAi(modelProvider: ModelProvider, prompt: string) {
    const model = this.getModel(modelProvider);

    const { text } = await generateText({
      model,
      prompt,
    });

    return text;
  }

  async generateObjFromAi<
    T extends Readonly<{
      [k: string]: $ZodType<
        unknown,
        unknown,
        $ZodTypeInternals<unknown, unknown>
      >;
    }>,
  >(modelProvider: ModelProvider, prompt: string, schema: ZodObject<T>) {
    const model = this.getModel(modelProvider);

    const { object } = await generateObject({
      model,
      schema,
      prompt,
      output: 'object',
    });

    return object;
  }

  private getModel(modelProvider: ModelProvider) {
    switch (modelProvider) {
      case 'gemini':
        return google('gemini-2.5-flash');
      case 'openai':
        return openai('chatgpt-4o-latest');
      default:
        return xai('grok-4');
    }
  }
}
