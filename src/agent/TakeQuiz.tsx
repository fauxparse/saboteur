import { ResponseProvider } from '@/contexts/ResponseProvider';
import React from 'react';
import { Questions } from './Questions';
import { AgentsProvider } from '@/contexts/AgentsProvider';

export const TakeQuiz: React.FC = () => {
  return (
    <AgentsProvider>
      <ResponseProvider>
        <Questions />
      </ResponseProvider>
    </AgentsProvider>
  );
};
