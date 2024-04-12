import { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

const BaseEventSchema = z.object({
  id: z.string(),
  timestamp: z.instanceof(Timestamp).transform((t) => t?.toDate()),
});

export const EventSchema = z.union([
  BaseEventSchema.extend({
    type: z.literal('quiz'),
    startsAt: z
      .instanceof(Timestamp)
      .nullable()
      .transform((t) => t?.toDate() || null),
    endsAt: z
      .instanceof(Timestamp)
      .nullable()
      .transform((t) => t?.toDate() || null),
  }),
  BaseEventSchema.extend({
    type: z.literal('suspicional'),
    accused: z.array(z.string()),
  }),
  BaseEventSchema.extend({
    type: z.literal('scene'),
    name: z.string(),
    sabotaged: z.boolean().optional(),
  }),
  BaseEventSchema.extend({
    type: z.literal('elimination'),
    agentId: z.string(),
  }),
]);

const BaseEventFirebaseSchema = z.object({
  timestamp: z
    .instanceof(Date)
    .transform((t) => t && Timestamp.fromDate(t))
    .optional(),
});

export const EventFirebaseSchema = z.union([
  BaseEventFirebaseSchema.extend({
    type: z.literal('quiz'),
    startsAt: z
      .instanceof(Date)
      .transform((t) => t && Timestamp.fromDate(t))
      .nullable()
      .optional(),
    endsAt: z
      .instanceof(Date)
      .transform((t) => t && Timestamp.fromDate(t))
      .nullable()
      .optional(),
  }),
  BaseEventFirebaseSchema.extend({
    type: z.literal('suspicional'),
    accused: z.array(z.string()).optional(),
  }),
  BaseEventFirebaseSchema.extend({
    type: z.literal('scene'),
    name: z.string().optional(),
    sabotaged: z.boolean().optional(),
  }),
]);

export type Event = z.infer<typeof EventSchema>;

export type Quiz = Extract<Event, { type: 'quiz' }>;

export type Suspicional = Extract<Event, { type: 'suspicional' }>;

export type Scene = Extract<Event, { type: 'scene' }>;

export type Elimination = Extract<Event, { type: 'elimination' }>;

export const isQuiz = (event: Event): event is Quiz => event.type === 'quiz';

export const isSuspicional = (event: Event): event is Suspicional => event.type === 'suspicional';

export const isScene = (event: Event): event is Scene => event.type === 'scene';

export const isElimination = (event: Event): event is Elimination => event.type === 'elimination';

export const parseEvent = (data: DocumentSnapshot | QueryDocumentSnapshot) =>
  EventSchema.parse({ id: data.id, ...data.data() });
