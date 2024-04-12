import { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export const ResponseSchema = z.object({
  id: z.string(),
  startsAt: z
    .instanceof(Timestamp)
    .nullable()
    .transform((t) => t?.toDate() || null),
  endsAt: z
    .instanceof(Timestamp)
    .nullable()
    .transform((t) => t?.toDate() || null),
});

export type Response = z.infer<typeof ResponseSchema>;

export const parseResponse = (doc: DocumentSnapshot | QueryDocumentSnapshot) =>
  ResponseSchema.parse({ id: doc.id, ...doc.data() });

export const ChosenAnswerSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  questionId: z.string(),
  answerIds: z.array(z.string()),
});

export type ChosenAnswer = z.infer<typeof ChosenAnswerSchema>;

export const parseChosenAnswer = (doc: DocumentSnapshot | QueryDocumentSnapshot) =>
  ChosenAnswerSchema.parse({ id: doc.id, ...doc.data() });
