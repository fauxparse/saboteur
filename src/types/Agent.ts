import { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export const COLORS = ['red', 'blue', 'lime', 'orange', 'grape', 'teal', 'yellow'] as const;

export type Color = (typeof COLORS)[number];

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  userId: z.string().nullable().optional(),
  color: z.enum(COLORS).optional(),
  eliminatedAt: z
    .instanceof(Timestamp)
    .nullable()
    .optional()
    .transform((t) => t?.toDate() ?? null),
});

export const parseAgent = (doc: DocumentSnapshot | QueryDocumentSnapshot): Agent =>
  AgentSchema.parse({ id: doc.id, ...doc.data() });

export const AgentFirebaseSchema = z.object({
  name: z.string().optional(),
  position: z.number().optional(),
  color: z.enum(COLORS).optional(),
  eliminatedAt: z
    .instanceof(Date)
    .nullable()
    .optional()
    .transform((t) => (t && Timestamp.fromDate(t)) || null),
});

export type Agent = z.infer<typeof AgentSchema>;
