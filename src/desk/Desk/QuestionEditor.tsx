import { useAgents } from '@/contexts/AgentsProvider';
import { useMission } from '@/contexts/MissionProvider';
import { useQuiz } from '@/contexts/QuizProvider';
import { db } from '@/firebase';
import { Event, parseEvent } from '@/types/Event';
import { Answer, Question, parseAnswer, parseQuestion } from '@/types/Question';
import { useSortable } from '@dnd-kit/sortable';
import {
  Accordion,
  ActionIcon,
  Button,
  Checkbox,
  Flex,
  Group,
  Stack,
  TextInput,
} from '@mantine/core';
import { IconMenu2, IconPlus, IconTrash } from '@tabler/icons-react';
import { isAfter } from 'date-fns';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { sortBy } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useForm } from '@tanstack/react-form';
import { PartialWithId } from '@/types';

type QuestionEditorProps = {
  question: Question;
};

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question: initial }) => {
  const { mission } = useMission();
  const { quiz, deleteQuestion } = useQuiz();
  const { agents } = useAgents();

  const [question, setQuestion] = useState(initial);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const form = useForm({
    defaultValues: {
      label: question.label,
      answers,
    },
    onSubmit: async ({ value: { label } }) => {
      await updateDoc(
        doc(db, 'missions', mission.id, 'events', quiz.id, 'questions', question.id),
        {
          label,
        }
      );
    },
  });

  useEffect(() => {
    form.setFieldValue('answers', answers);
  }, [form, answers]);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const baseRef = useMemo(
    () => doc(db, 'missions', mission.id, 'events', quiz.id, 'questions', question.id),
    [mission.id, quiz.id, question.id]
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(baseRef, (doc) => {
      if (doc.exists()) setQuestion(parseQuestion(doc));
    });
    return unsubscribe;
  }, [baseRef]);

  useEffect(() => {
    const unsubscribe =
      question.type === 'custom'
        ? onSnapshot(collection(baseRef, 'answers'), (snapshot) => {
            setAnswers(sortBy(snapshot.docs.map(parseAnswer), 'position'));
          })
        : onSnapshot(collection(db, 'missions', mission.id, 'events'), (snapshot) => {
            const events = sortBy(snapshot.docs.map(parseEvent), 'startsAt') as Event[];
            const index = events.findIndex((event) => event.id === quiz.id);
            const previousQuiz = events
              .slice(0, index)
              .reverse()
              .find((e) => e.type === 'quiz');
            const eventsSincePreviousQuiz = events
              .slice(0, index)
              .filter((e) => (previousQuiz ? isAfter(e.startsAt, previousQuiz.startsAt) : true));

            switch (question.type) {
              case 'scenes':
                setAnswers(
                  eventsSincePreviousQuiz.reduce(
                    (acc: Answer[], event: Event, position: number) => {
                      if (event.type === 'scene')
                        acc.push({
                          id: event.id,
                          position,
                          label: event.name,
                          correct: !!event.sabotaged,
                        });
                      return acc;
                    },
                    [] as Answer[]
                  )
                );
                break;
              case 'suspicional': {
                const accused = eventsSincePreviousQuiz.reduce((acc: string[], event: Event) => {
                  if (event.type === 'suspicional') acc.push(...event.accused);
                  return acc;
                }, []);
                setAnswers([
                  ...[...agents.values()].map((agent, position) => ({
                    id: agent.id,
                    label: agent.name,
                    position,
                    correct: accused.includes(agent.id) && accused.length === 1,
                  })),
                  {
                    id: 'none',
                    label: 'Nobody',
                    position: agents.size,
                    correct: accused.length === 0,
                  },
                  {
                    id: 'unclear',
                    label: 'Multiple/unclear',
                    position: agents.size + 1,
                    correct: accused.length > 1,
                  },
                ]);
                break;
              }
              case 'accusation': {
                setAnswers(
                  [...agents.values()].map((agent, position) => ({
                    id: agent.id,
                    label: agent.name,
                    position,
                    correct: agent.id === mission.saboteurId,
                  }))
                );
                break;
              }
            }
          });
    return unsubscribe;
  }, [mission.id, quiz.id, question.type, mission.saboteurId, agents, baseRef]);

  const editable = question.type === 'custom';

  const addAnswer = useCallback(async () => {
    const data = {
      label: '',
      correct: false,
      position: answers.length,
    };

    const doc = await addDoc(collection(baseRef, 'answers'), data);
    setTimeout(() => {
      const el = document.querySelector(`[data-answer-id="${doc.id}"]`) as HTMLElement | null;
      el?.focus();
    });
  }, [baseRef, answers.length]);

  const updateAnswer = useCallback(
    async ({ id, ...answer }: PartialWithId<Answer>) => {
      await updateDoc(doc(baseRef, 'answers', id), answer);
    },
    [baseRef]
  );

  const deleteAnswer = useCallback(
    async (answer: Answer) => {
      for (const a of answers.slice(answer.position + 1)) {
        updateDoc(doc(baseRef, 'answers', a.id), { position: a.position - 1 });
      }
      await deleteDoc(doc(baseRef, 'answers', answer.id));
    },
    [answers, baseRef]
  );

  const labelKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.stopPropagation();
        break;
    }
  };

  const answerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        addAnswer();
        break;
      case ' ':
        e.stopPropagation();
        break;
    }
  };

  return (
    <Accordion.Item value={question.id} ref={setNodeRef} style={style}>
      <Accordion.Control component="div" icon={<IconMenu2 {...attributes} {...listeners} />}>
        <form.Field name="label">
          {(field) => (
            <TextInput
              value={field.state.value ?? ''}
              flex={1}
              disabled={!editable}
              style={{ pointerEvents: editable ? undefined : 'none' }}
              placeholder="Enter question text"
              onKeyDownCapture={labelKeyDown}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
              onBlur={(e) => {
                field.handleChange(e.currentTarget.value);
                form.handleSubmit();
              }}
              onClick={(e) => {
                if (editable) e.stopPropagation();
              }}
            />
          )}
        </form.Field>
      </Accordion.Control>
      <Accordion.Panel>
        <form.Field name="answers">
          {(field) => (
            <Stack>
              {field.state.value.map((answer, i) => (
                <Flex key={answer.id} align="center" gap="sm" mr="2.75rem">
                  <form.Field name={`answers[${i}].correct`}>
                    {(subfield) => (
                      <Checkbox
                        checked={subfield.state.value ?? false}
                        disabled={!editable}
                        onChange={(e) => {
                          subfield.handleChange(e.currentTarget.checked);
                          updateAnswer({ id: answer.id, correct: e.currentTarget.checked });
                        }}
                      />
                    )}
                  </form.Field>
                  <form.Field name={`answers[${i}].label`}>
                    {(subfield) => (
                      <TextInput
                        value={subfield.state.value ?? ''}
                        flex={1}
                        readOnly={!editable}
                        data-answer-id={answer.id}
                        onKeyDown={answerKeyDown}
                        onChange={(e) => subfield.handleChange(e.currentTarget.value)}
                        onBlur={(e) => {
                          subfield.handleChange(e.currentTarget.value);
                          updateAnswer({ id: answer.id, label: e.currentTarget.value });
                        }}
                      />
                    )}
                  </form.Field>
                  {editable && (
                    <ActionIcon
                      aria-label="Delete answer"
                      color="red"
                      variant="transparent"
                      onClick={() => deleteAnswer(answer)}
                    >
                      <IconTrash />
                    </ActionIcon>
                  )}
                </Flex>
              ))}
            </Stack>
          )}
        </form.Field>
        <Group ml="2rem" mt="sm">
          <Button variant="transparent" leftSection={<IconPlus />} onClick={addAnswer}>
            Add answer
          </Button>
          <Button
            variant="transparent"
            color="red"
            leftSection={<IconTrash />}
            onClick={() => deleteQuestion(question)}
          >
            Delete question
          </Button>
        </Group>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export default QuestionEditor;
