import { useMission } from '@/contexts/MissionProvider';
import { useQuiz } from '@/contexts/QuizProvider';
import { db } from '@/firebase';
import { Answer, parseQuestion } from '@/types/Question';
import { useSortable } from '@dnd-kit/sortable';
import {
  Accordion,
  ActionIcon,
  Button,
  Checkbox,
  Flex,
  Group,
  Radio,
  Stack,
  TextInput,
} from '@mantine/core';
import { IconMenu2, IconPlus, IconTrash } from '@tabler/icons-react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useForm } from '@tanstack/react-form';
import { PartialWithId } from '@/types';
import { useQuestion } from '@/contexts/QuestionProvider';

const QuestionEditor: React.FC = () => {
  const { mission } = useMission();
  const { quiz, deleteQuestion } = useQuiz();
  const { question: initial, answers } = useQuestion();

  const [question, setQuestion] = useState(initial);

  const form = useForm({
    defaultValues: {
      label: question.label,
      multiple: question.multiple,
      answers,
    },
    onSubmit: async ({ value: { label, multiple } }) => {
      await updateDoc(
        doc(db, 'missions', mission.id, 'events', quiz.id, 'questions', question.id),
        {
          label,
          multiple,
        }
      );
    },
  });

  useEffect(() => form.setFieldValue('answers', answers), [answers, form.setFieldValue]);

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
                    {(subfield) =>
                      question.multiple ? (
                        <Checkbox
                          checked={answers[i].correct ?? false}
                          disabled={!editable}
                          onChange={(e) => {
                            subfield.handleChange(e.currentTarget.checked);
                            updateAnswer({
                              id: answers[i].id,
                              correct: e.currentTarget.checked,
                            });
                          }}
                        />
                      ) : (
                        <Radio
                          name={question.id}
                          checked={answers[i].correct ?? false}
                          disabled={!editable}
                          onChange={(e) => {
                            subfield.handleChange(e.currentTarget.checked);
                            updateAnswer({
                              id: answers[i].id,
                              correct: e.currentTarget.checked,
                            });
                          }}
                        />
                      )
                    }
                  </form.Field>
                  <form.Field name={`answers[${i}].label`}>
                    {(subfield) => {
                      return (
                        <TextInput
                          defaultValue={answers[i].label}
                          flex={1}
                          readOnly={!editable}
                          data-answer-id={answers[i].id}
                          onKeyDown={answerKeyDown}
                          onChange={(e) => subfield.handleChange(e.currentTarget.value)}
                          onBlur={(e) => {
                            if (!editable) return;
                            subfield.handleChange(e.currentTarget.value);
                            updateAnswer({
                              id: answers[i].id,
                              label: e.currentTarget.value,
                            });
                          }}
                        />
                      );
                    }}
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
        <Group ml="2rem" mt="sm" justify="space-between">
          <Group>
            <Button
              variant="transparent"
              leftSection={<IconPlus />}
              disabled={!editable}
              onClick={addAnswer}
            >
              Add answer
            </Button>
            <form.Field name="multiple">
              {(field) => (
                <Checkbox
                  checked={field.state.value}
                  disabled={!editable}
                  label="Multi-choice?"
                  onChange={(e) => {
                    field.handleChange(e.currentTarget.checked);
                    form.handleSubmit();
                  }}
                />
              )}
            </form.Field>
          </Group>
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
