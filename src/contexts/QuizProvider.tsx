import { db, realtime } from '@/firebase';
import { EventFirebaseSchema, EventSchema, Quiz } from '@/types/Event';
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
  getDocs,
} from 'firebase/firestore';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMission } from './MissionProvider';
import { DEFAULT_QUESTIONS, Question, parseQuestion } from '@/types/Question';
import { sortBy } from 'lodash-es';
import { PartialWithId } from '@/types';
import { useAgents } from './AgentsProvider';
import { ref, set } from 'firebase/database';

type QuizProviderProps = {
  quiz: Quiz;
};

type Context = {
  quiz: Quiz;
  questions: Question[];
  addQuestion: (type: Question['type']) => Promise<Question>;
  deleteQuestion: (question: Question) => Promise<void>;
  reorderQuestions: (questions: Question[]) => Promise<void>;
  startQuiz: () => Promise<void>;
  endQuiz: () => Promise<void>;
  duplicateQuiz: () => Promise<void>;
  setCorrectAnswersForQuestion: (questionId: string, correctAnswerIds: string[]) => void;
  correctAnswersForQuestion: (questionId: string) => Set<string>;
};

export const QuizContext = createContext<Context>({} as Context);

export const QuizProvider: React.FC<PropsWithChildren<QuizProviderProps>> = ({
  quiz: initial,
  children,
}) => {
  const { mission } = useMission();

  const { agents } = useAgents();

  const [quiz, setQuiz] = useState(initial);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [correctAnswers, setCorrectAnswers] = useState<Record<string, Set<string>>>({});

  const questionsRef = useMemo(
    () => collection(db, 'missions', mission.id, 'events', initial.id, 'questions'),
    [mission.id, initial.id]
  );

  useEffect(
    () =>
      onSnapshot(doc(db, 'missions', mission.id, 'events', initial.id), (doc) => {
        if (doc.exists()) setQuiz(parseQuiz(doc));
      }),
    [mission.id, initial.id]
  );

  useEffect(
    () =>
      onSnapshot(questionsRef, (snapshot) => {
        setQuestions(sortBy(snapshot.docs.map(parseQuestion), 'position'));
      }),
    [questionsRef]
  );

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

  const updateQuiz = useCallback(
    async (quiz: PartialWithId<Quiz>) => {
      await updateDoc(
        doc(db, 'missions', mission.id, 'events', quiz.id),
        EventFirebaseSchema.parse({ type: 'quiz', ...quiz })
      );
    },
    [mission.id]
  );

  const startQuiz = useCallback(async () => {
    await updateQuiz({ id: quiz.id, startsAt: quiz.startsAt || new Date(), endsAt: null });
    await set(
      ref(realtime, `quizzes/${quiz.id}`),
      agents.reduce((acc, agent) => ({ ...acc, [agent.id]: 0 }), {})
    );
  }, [updateQuiz, quiz.id, quiz.startsAt, agents]);

  const endQuiz = useCallback(async () => {
    await updateQuiz({ id: quiz.id, endsAt: new Date() });
  }, [updateQuiz, quiz.id]);

  const duplicateQuiz = useCallback(async () => {
    const ref = collection(db, 'missions', mission.id, 'events');

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

    for (const question of questions) {
      const { id, ...data } = question;
      const q = await addDoc(questionsRef, data);
      if (question.type === 'custom') {
        const existingAnswers = await getDocs(collection(ref, quiz.id, 'questions', id, 'answers'));
        const newAnswers = collection(questionsRef, q.id, 'answers');
        for (const answer of existingAnswers.docs) {
          await addDoc(newAnswers, answer.data());
        }
      }
    }
  }, [mission.id, quiz.id, questions]);

  const setCorrectAnswersForQuestion = useCallback(
    (questionId: string, correctAnswerIds: string[]) =>
      setCorrectAnswers((prev) => ({ ...prev, [questionId]: new Set(correctAnswerIds) })),
    []
  );

  const correctAnswersForQuestion = useCallback(
    (questionId: string) => correctAnswers[questionId] ?? new Set<string>(),
    [correctAnswers]
  );

  const value = useMemo(
    () => ({
      quiz,
      questions,
      addQuestion,
      deleteQuestion,
      reorderQuestions,
      startQuiz,
      endQuiz,
      duplicateQuiz,
      setCorrectAnswersForQuestion,
      correctAnswersForQuestion,
    }),
    [
      quiz,
      questions,
      addQuestion,
      deleteQuestion,
      reorderQuestions,
      startQuiz,
      endQuiz,
      duplicateQuiz,
      setCorrectAnswersForQuestion,
      correctAnswersForQuestion,
    ]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

const parseQuiz = (doc: DocumentSnapshot | QueryDocumentSnapshot): Quiz =>
  EventSchema.parse({ id: doc.id, ...doc.data() }) as Quiz;

export const useQuiz = () => useContext(QuizContext);
