import { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { z } from 'zod';

const BaseQuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  position: z.number(),
});

export const QuestionSchema = z.union([
  BaseQuestionSchema.extend({
    type: z.literal('custom'),
    multiple: z.boolean(),
  }),
  BaseQuestionSchema.extend({
    type: z.literal('scenes'),
    multiple: z.literal(true),
  }),
  BaseQuestionSchema.extend({
    type: z.enum(['suspicional', 'accusation']),
    multiple: z.literal(false),
  }),
]);

export type Question = z.infer<typeof QuestionSchema>;

export const parseQuestion = (data: DocumentSnapshot | QueryDocumentSnapshot) =>
  QuestionSchema.parse({ id: data.id, ...data.data() });

export const AnswerSchema = z.object({
  id: z.string(),
  position: z.number(),
  label: z.string(),
  correct: z.boolean(),
});

export type Answer = z.infer<typeof AnswerSchema>;

export const parseAnswer = (data: DocumentSnapshot | QueryDocumentSnapshot) =>
  AnswerSchema.parse({ id: data.id, ...data.data() });

export const DEFAULT_QUESTIONS: Record<Question['type'], string> = {
  scenes: 'Which scene(s) was the Saboteur in?',
  suspicional: 'Whom did the Saboteur accuse?',
  accusation: 'Who is the Saboteur?',
  custom: '',
} as const;
