import { db } from '@/firebase';
import { EventSchema, Quiz } from '@/types/Event';
import {
  onSnapshot,
  doc,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  collection,
  addDoc,
  getDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMission } from './MissionProvider';
import { DEFAULT_QUESTIONS, Question, parseQuestion } from '@/types/Question';
import { sortBy } from 'lodash-es';

type QuizProviderProps = {
  quiz: Quiz;
};

type Context = {
  quiz: Quiz;
  questions: Question[];
  addQuestion: (type: Question['type']) => Promise<Question>;
  deleteQuestion: (question: Question) => Promise<void>;
  reorderQuestions: (questions: Question[]) => Promise<void>;
};

const QuizContext = createContext<Context>({} as Context);

export const QuizProvider: React.FC<PropsWithChildren<QuizProviderProps>> = ({
  quiz: initial,
  children,
}) => {
  const { mission } = useMission();

  const [quiz, setQuiz] = useState(initial);

  const [questions, setQuestions] = useState<Question[]>([]);

  const questionsRef = useMemo(
    () => collection(db, 'missions', mission.id, 'events', initial.id, 'questions'),
    [mission.id, initial.id]
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'missions', mission.id, 'events', initial.id), (doc) => {
      if (doc.exists()) setQuiz(parseQuiz(doc));
    });
    return unsubscribe;
  }, [mission.id, initial.id]);

  useEffect(() => {
    const unsubscribe = onSnapshot(questionsRef, (snapshot) => {
      setQuestions(sortBy(snapshot.docs.map(parseQuestion), 'position'));
    });
    return unsubscribe;
  }, [questionsRef]);

  const addQuestion = useCallback(
    async (type: Question['type']) => {
      const multiple = type === 'scenes';
      const data = {
        type,
        multiple,
        label: DEFAULT_QUESTIONS[type],
        position: questions.length,
      };
      const doc = await addDoc(questionsRef, data);
      return parseQuestion(await getDoc(doc));
    },
    [questionsRef, questions.length]
  );

  const reorderQuestions = useCallback(
    async (questions: Question[]) => {
      setQuestions(questions);
      questions.forEach((question, position) => {
        if (question.position !== position) {
          updateDoc(doc(questionsRef, question.id), { position });
        }
      });
    },
    [questionsRef]
  );

  const deleteQuestion = useCallback(
    async (question: Question) => {
      await deleteDoc(doc(questionsRef, question.id));
    },
    [questionsRef]
  );

  const value = useMemo(
    () => ({ quiz, questions, addQuestion, deleteQuestion, reorderQuestions }),
    [quiz, questions, addQuestion, deleteQuestion, reorderQuestions]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

const parseQuiz = (doc: DocumentSnapshot | QueryDocumentSnapshot): Quiz =>
  EventSchema.parse({ id: doc.id, ...doc.data() }) as Quiz;

export const useQuiz = () => useContextSelector(QuizContext, (v) => v);
