import { db } from '@/firebase';
import { Mission, PartialWithId } from '@/types';
import { Event, EventFirebaseSchema, EventSchema } from '@/types/Event';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useEvents = (mission: Mission) => {
  const ref = useMemo(() => collection(db, 'missions', mission.id, 'events'), [mission.id]);

  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    console.log('boop');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => EventSchema.parse({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [ref]);

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

    console.log(doc.id);
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
      EventFirebaseSchema.parse({ type: 'suspicional', timestamp: new Date(), accused: [] })
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

  return { events, createQuiz, createScene, createSuspicional, updateEvent, deleteEvent };
};
