import { Answer, Question, parseAnswer } from '@/types/Question';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { createContext, useContext } from 'use-context-selector';
import { useMission } from './MissionProvider';
import { useAgents } from './AgentsProvider';
import { db } from '@/firebase';
import { Event, parseEvent } from '@/types/Event';
import { isAfter } from 'date-fns';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { sortBy } from 'lodash-es';
import { useQuiz } from './QuizProvider';

type QuestionContextShape = {
  question: Question;
  answers: Answer[];
};

const QuestionContext = createContext<QuestionContextShape>({} as QuestionContextShape);

export const QuestionProvider: React.FC<PropsWithChildren<{ question: Question }>> = ({
  question,
  children,
}) => {
  const { mission } = useMission();
  const { quiz, setCorrectAnswersForQuestion } = useQuiz();
  const { agents, saboteur } = useAgents();

  const baseRef = useMemo(
    () => doc(db, 'missions', mission.id, 'events', quiz.id, 'questions', question.id),
    [mission.id, quiz.id, question.id]
  );

  const [answers, setAnswers] = useState<Answer[]>([]);

  const [accused, setAccused] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (question.type === 'suspicional') {
      setAnswers([
        ...agents.map((agent, position) => ({
          id: agent.id,
          label: agent.name,
          position,
          correct: accused.has(agent.id) && accused.size === 1,
        })),
        {
          id: 'none',
          label: 'Nobody',
          position: agents.length,
          correct: accused.size === 0,
        },
        {
          id: 'unclear',
          label: 'Multiple/unclear',
          position: agents.length + 1,
          correct: accused.size > 1,
        },
      ]);
    } else if (question.type === 'accusation') {
      setAnswers(
        agents.map((agent, position) => ({
          id: agent.id,
          label: agent.name,
          position,
          correct: agent.id === saboteur?.id,
        }))
      );
    }
  }, [agents, accused, question.type, saboteur]);

  useEffect(() => {
    if (question.type === 'custom') {
      return onSnapshot(collection(baseRef, 'answers'), (snapshot) => {
        setAnswers(sortBy(snapshot.docs.map(parseAnswer), 'position'));
      });
    }
    return onSnapshot(collection(db, 'missions', mission.id, 'events'), (snapshot) => {
      const events = sortBy(snapshot.docs.map(parseEvent), 'timestamp') as Event[];
      const index = events.findIndex((event) => event.id === quiz.id);
      const previousQuiz = events
        .slice(0, index)
        .reverse()
        .find((e) => e.type === 'quiz');
      const eventsSincePreviousQuiz = events
        .slice(0, index)
        .filter((e) => (previousQuiz ? isAfter(e.timestamp, previousQuiz.timestamp) : true));

      switch (question.type) {
        case 'scenes':
          setAnswers(
            eventsSincePreviousQuiz.reduce((acc: Answer[], event: Event, position: number) => {
              if (event.type === 'scene')
                acc.push({
                  id: event.id,
                  position,
                  label: event.name,
                  correct: !!event.sabotaged,
                });
              return acc;
            }, [] as Answer[])
          );
          break;
        case 'suspicional':
          setAccused(
            new Set(
              eventsSincePreviousQuiz.reduce((acc: string[], event: Event) => {
                if (event.type === 'suspicional') acc.push(...event.accused);
                return acc;
              }, [])
            )
          );
          break;
      }
    });
  }, [mission.id, quiz.id, question.type, baseRef]);

  useEffect(
    () =>
      setCorrectAnswersForQuestion(
        question.id,
        answers.filter((a) => a.correct).map((a) => a.id)
      ),
    [answers, question.id, setCorrectAnswersForQuestion]
  );

  const value = useMemo(() => ({ question, answers }), [question, answers]);

  return <QuestionContext.Provider value={value}>{children}</QuestionContext.Provider>;
};

export const useQuestion = () => useContext(QuestionContext);
