import { Event } from '@/types/Event';
import { QuizBlock } from './QuizBlock';
import { SceneBlock } from './SceneBlock';
import { EliminationBlock } from './EliminationBlock';
import { SuspicionalBlock } from './SuspicionalBlock';
import React from 'react';
import { PartialWithId } from '@/types';

type EventBlockProps<T extends Event> = {
  event: T;
  onDelete: (event: T) => void;
  onUpdate: (event: PartialWithId<T>) => void;
};

type ComponentMap = {
  [key in Event['type']]: React.FC<EventBlockProps<Extract<Event, { type: key }>>>;
};

const Components: ComponentMap = {
  quiz: QuizBlock,
  scene: SceneBlock,
  elimination: EliminationBlock,
  suspicional: SuspicionalBlock,
} as const;

export const EventBlock = <T extends Event>({ event, onUpdate, onDelete }: EventBlockProps<T>) => {
  const Component = Components[event.type] as unknown as React.FC<EventBlockProps<T>>;

  return <Component event={event} onUpdate={onUpdate} onDelete={onDelete} />;
};
