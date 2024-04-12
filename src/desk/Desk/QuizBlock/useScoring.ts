import { useAgents } from '@/contexts/AgentsProvider';
import { useMission } from '@/contexts/MissionProvider';
import { useQuiz } from '@/contexts/QuizProvider';
import { db } from '@/firebase';
import { Response, parseResponse } from '@/types/Response';
import { differenceInSeconds } from 'date-fns';
import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { keyBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';

export type Score = {
  points: number;
  time: number;
};

export const useScoring = () => {
  const { mission } = useMission();
  const { quiz, questions, correctAnswersForQuestion } = useQuiz();
  const { agents, saboteur } = useAgents();

  const [responses, setResponses] = useState<Record<string, Response>>({});

  const [choices, setChoices] = useState<Record<string, Record<string, Set<string>>>>({});

  const baseRef = useMemo(
    () => collection(db, 'missions', mission.id, 'events', quiz.id, 'responses'),
    [mission.id, quiz.id]
  );

  useEffect(
    () =>
      onSnapshot(baseRef, async (snapshot) =>
        setResponses(keyBy(snapshot.docs.map(parseResponse), 'id') as Record<string, Response>)
      ),
    [baseRef]
  );

  useEffect(() => {
    if (!questions.length) return;

    return onSnapshot(
      query(
        collectionGroup(db, 'choices'),
        where(
          'questionId',
          'in',
          questions.map((q) => q.id)
        )
      ),
      (snapshot) => {
        setChoices(
          snapshot.docs.reduce((acc: Record<string, Record<string, Set<string>>>, doc) => {
            const { agentId, questionId, answerIds } = doc.data();
            acc[agentId] ||= {};
            acc[agentId][questionId] = new Set(answerIds);
            return acc;
          }, {})
        );
      }
    );
  }, [questions]);

  const scores = useMemo(
    () =>
      agents.reduce((acc: Record<string, Score | null>, agent) => {
        const response = responses[agent.id];

        console.log(response);

        if (!response || !response.startsAt || !response.endsAt)
          return { ...acc, [agent.id]: null };

        const points = questions.reduce((total, question) => {
          const correct = correctAnswersForQuestion(question.id);
          const chosen = choices[agent.id]?.[question.id] ?? new Set();

          const answeredCorrectly = Array.from(chosen).filter((c) => correct.has(c)).length;
          const answeredIncorrectly = Array.from(correct).filter((c) => !chosen.has(c)).length;
          return total + answeredCorrectly - answeredIncorrectly;
        }, 0);

        const time = differenceInSeconds(response.endsAt, response.startsAt);

        return { ...acc, [agent.id]: { points, time } };
      }, {}),
    [agents, responses, questions, choices, correctAnswersForQuestion]
  );

  return scores;
};
