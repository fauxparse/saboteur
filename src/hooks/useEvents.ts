import { db } from '@/firebase';
import { Mission } from '@/types';
import { Event, EventFirebaseSchema, EventSchema } from '@/types/Event';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useEvents = (mission: Mission) => {
  const ref = useMemo(() => collection(db, 'missions', mission.id, 'events'), [mission.id]);

  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => EventSchema.parse({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [ref]);

  const createQuiz = useCallback(async () => {
    await addDoc(
      ref,
      EventFirebaseSchema.parse({ type: 'quiz', startsAt: new Date(), endsAt: null })
    );
  }, [ref]);

  const createScene = useCallback(async () => {
    await addDoc(
      ref,
      EventFirebaseSchema.parse({ type: 'scene', startsAt: new Date(), name: '', sabotaged: false })
    );
  }, [ref]);

  const createSuspicional = useCallback(async () => {
    await addDoc(ref, EventFirebaseSchema.parse({ type: 'suspicional', startsAt: new Date() }));
  }, [ref]);

  const deleteEvent = useCallback(
    async (event: Event) => {
      await deleteDoc(doc(ref, event.id));
    },
    [ref]
  );

  return { events, createQuiz, createScene, createSuspicional, deleteEvent };
};
