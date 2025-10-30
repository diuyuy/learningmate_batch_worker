import z from 'zod';

export const articleSchema = z.object({
  title: z.string().nonempty(),
  content: z.string().nonempty(),
});

export type ArticleSchema = z.infer<typeof articleSchema>;

export const quizSchema = z.object({
  description: z.string().nonempty(),
  explanation: z.string().nonempty(),
  question1: z.string().nonempty(),
  question2: z.string().nonempty(),
  question3: z.string().nonempty(),
  question4: z.string().nonempty(),
  answer: z.int().min(1).max(4),
});

export const quizArraySchema = z.object({
  quizzes: z.array(quizSchema).length(5),
});
