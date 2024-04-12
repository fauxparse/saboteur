import { useQuestion } from '@/contexts/QuestionProvider';
import { useQuiz } from '@/contexts/QuizProvider';
import { useResponse } from '@/contexts/ResponseProvider';
import { Button, Stack, Text } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import React, { useCallback, useMemo, useReducer, useState } from 'react';

export const AskQuestion: React.FC = () => {
  const { question, answers } = useQuestion();
  const { questions } = useQuiz();
  const { respond } = useResponse();

  const [loading, setLoading] = useState(false);

  const [index, total] = useMemo(
    () => [questions.findIndex((q) => q.id === question.id) + 1, questions.length],
    [questions, question.id]
  );

  const [selected, toggle] = useReducer((state: Set<string>, answerId: string) => {
    const newState = new Set(state);

    if (newState.has(answerId)) {
      newState.delete(answerId);
    } else if (question.multiple) {
      newState.add(answerId);
    } else {
      return new Set([answerId]);
    }

    return newState;
  }, new Set<string>());

  const nextQuestion = useCallback(async () => {
    setLoading(true);
    await respond(question.id, Array.from(selected));
  }, [respond, selected, question.id]);

  return (
    <Stack ta="center">
      <Text fz="xl">{question.label}</Text>
      <Text opacity={0.5}>
        {question.multiple ? 'Select one or more answers' : 'Select one answer only'}
      </Text>
      <Stack>
        {answers.map((answer) => (
          <Button
            key={answer.id}
            size="xl"
            variant={selected.has(answer.id) ? 'gradient' : 'outline'}
            gradient={{ from: 'red', to: 'orange' }}
            onClick={() => toggle(answer.id)}
          >
            {answer.label}
          </Button>
        ))}
      </Stack>
      <Button
        size="lg"
        variant="subtle"
        loading={loading}
        disabled={selected.size === 0}
        rightSection={<IconArrowRight />}
        style={{ alignSelf: 'center' }}
        onClick={nextQuestion}
      >
        Continue
      </Button>
      <Text fz="sm" opacity={0.5}>
        Question {index} of {total}
      </Text>
    </Stack>
  );
};
