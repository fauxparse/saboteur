import { ResponseProvider } from '@/contexts/ResponseProvider';
import React from 'react';
import { Questions } from './Questions';
import { AgentsProvider } from '@/contexts/AgentsProvider';
import { QuizProvider } from '@/contexts/QuizProvider';
import { Quiz } from '@/types/Event';

type TakeQuizProps = {
  quiz: Quiz;
};

export const TakeQuiz: React.FC<TakeQuizProps> = ({ quiz }) => {
  return (
    <QuizProvider quiz={quiz}>
      <AgentsProvider>
        <ResponseProvider>
          <Questions />
        </ResponseProvider>
      </AgentsProvider>
    </QuizProvider>
  );
};
