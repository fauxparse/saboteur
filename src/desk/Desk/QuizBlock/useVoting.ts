import { useAgents } from '@/contexts/AgentsProvider';
import { useQuiz } from '@/contexts/QuizProvider';
import { realtime } from '@/firebase';
import { Agent } from '@/types/Agent';
import { onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';

export const useVoting = () => {
  const { quiz } = useQuiz();
  const { agents } = useAgents();

  const [value, setValue] = useState<Record<string, number>>({});

  useEffect(
    () =>
      onValue(ref(realtime, `quizzes/${quiz.id}`), (snapshot) => {
        setValue(snapshot.val());
      }),
    [quiz.id]
  );

  const votes = useMemo(
    () =>
      agents.reduce(
        (acc: Record<string, number>, { id }: Agent) => ({ ...acc, [id]: value?.[id] ?? 0 }),
        {}
      ),
    [value, agents]
  );

  return votes;
};
