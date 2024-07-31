import { db } from '@/firebase';
import { Mission, PartialWithId } from '@/types';
import { Event, EventFirebaseSchema, EventSchema } from '@/types/Event';
import { DEFAULT_QUESTIONS, Question } from '@/types/Question';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useEvents = (mission: Mission) => {
  const ref = useMemo(() => collection(db, 'missions', mission.id, 'events'), [mission.id]);

  const [events, setEvents] = useState<Event[]>([]);

  useEffect(
    () =>
      onSnapshot(ref, (snapshot) =>
        setEvents(snapshot.docs.map((doc) => EventSchema.parse({ id: doc.id, ...doc.data() })))
      ),
    [ref]
  );

  const createQuiz = useCallback(async () => {
    const doc = await addDoc(
      ref,
      EventFirebaseSchema.parse({
        type: 'quiz',
        timestamp: new Date(),
        startsAt: null,
        endsAt: null,
      })
    );

    const questionsRef = collection(ref, doc.id, 'questions');

    const addQuestion = async (
      type: Question['type'],
      position: number,
      label?: string,
      options?: string[]
    ) => {
      const multiple = type === 'scenes';
      const data = {
        type,
        multiple,
        label: label ?? DEFAULT_QUESTIONS[type],
        position,
      };
      const question = await addDoc(questionsRef, data);
      if (options) {
        const answersRef = collection(questionsRef, question.id, 'answers');
        options.forEach(async (label, position) => {
          await addDoc(answersRef, { label, position, correct: false });
        });
      }
    };

    await addQuestion('custom', 0, 'When did the Saboteur introduce themselves?', [
      'First three',
      'Last two',
    ]);
    await addQuestion('custom', 1, 'Where is the Saboteur sitting?', [
      'Desk side',
      'Not desk side',
    ]);
    await addQuestion('scenes', 2);
    await addQuestion('suspicional', 3);
    await addQuestion('accusation', 4);
  }, [ref]);

  const createScene = useCallback(async () => {
    await addDoc(
      ref,
      EventFirebaseSchema.parse({
        type: 'scene',
        timestamp: new Date(),
        name: '',
        sabotaged: false,
      })
    );
  }, [ref]);

  const createSuspicional = useCallback(async () => {
    await addDoc(
      ref,
      EventFirebaseSchema.parse({
        type: 'suspicional',
        timestamp: new Date(),
        accused: [],
      })
    );
  }, [ref]);

  const updateEvent = useCallback(
    async (event: PartialWithId<Event>) => {
      const ref = doc(db, 'missions', mission.id, 'events', event.id);
      const updates = EventFirebaseSchema.parse(event);
      await updateDoc(ref, updates);
    },
    [mission.id]
  );

  const deleteEvent = useCallback(
    async (event: Event) => {
      await deleteDoc(doc(ref, event.id));
    },
    [ref]
  );

  return {
    events,
    createQuiz,
    createScene,
    createSuspicional,
    updateEvent,
    deleteEvent,
  };
};
