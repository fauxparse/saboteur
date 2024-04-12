import { db } from '@/firebase';
import { ChosenAnswer, Response, parseChosenAnswer, parseResponse } from '@/types/Response';
import { Timestamp, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMission } from './MissionProvider';
import { useQuiz } from './QuizProvider';
import { useAgent } from './AgentProvider';
import { Question } from '@/types/Question';

type ResponseContextShape = {
  response: Response;
  currentQuestion: Question | null;
  start: () => void;
  finish: () => void;
  respond: (questionId: string, answerIds: string[]) => void;
};

const ResponseContext = createContext<ResponseContextShape>({} as ResponseContextShape);

export const ResponseProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { mission } = useMission();
  const { quiz, questions } = useQuiz();
  const { agent } = useAgent();

  const [response, setResponse] = useState<Response | null>(null);

  const [chosenAnswers, setChosenAnswers] = useState<ChosenAnswer[]>([]);

  const ref = useMemo(
    () => doc(db, 'missions', mission.id, 'events', quiz.id, 'responses', agent.id),
    [mission.id, quiz.id, agent.id]
  );

  useEffect(
    () =>
      onSnapshot(ref, (doc) => {
        if (doc.exists()) {
          setResponse(parseResponse(doc));
        } else {
          setDoc(doc.ref, { startsAt: null, endsAt: null });
        }
      }),
    [ref]
  );

  useEffect(
    () =>
      onSnapshot(collection(ref, 'choices'), (doc) => {
        setChosenAnswers(doc.docs.map(parseChosenAnswer));
      }),
    [ref]
  );

  const currentQuestion = useMemo(() => {
    const completedAnswerIds = new Set<string>(chosenAnswers.map((a) => a.id));
    return questions.find((q) => !completedAnswerIds.has(q.id)) ?? null;
  }, [chosenAnswers, questions]);

  const start = useCallback(async () => {
    if (!response) return;

    await updateDoc(ref, { startsAt: Timestamp.now() });
  }, [ref, response]);

  const finish = useCallback(async () => {
    if (!response) return;

    await updateDoc(ref, { endsAt: Timestamp.now() });
  }, [ref, response]);

  const respond = useCallback(
    async (questionId: string, answerIds: string[]) => {
      if (!response) return;

      await setDoc(doc(ref, 'choices', questionId), { questionId, agentId: agent.id, answerIds });
    },
    [ref, response, agent.id]
  );

  const value = useMemo(
    () => (response ? { response, currentQuestion, start, finish, respond } : null),
    [response, currentQuestion, start, finish, respond]
  );

  if (!value) return null;

  return <ResponseContext.Provider value={value}>{children}</ResponseContext.Provider>;
};

export const useResponse = () => useContextSelector(ResponseContext, (value) => value);
